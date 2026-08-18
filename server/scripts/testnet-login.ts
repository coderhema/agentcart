/**
 * AgentCart TestNet Dispenser Login + Fund - ONE human action.
 *
 * Uses the AlgoKit Dispenser API Auth0 device flow:
 *   1. Prints a URL - user opens it, signs in with GitHub, clicks Authorize
 *   2. Polls for the access token (30-day CI token)
 *   3. Saves token to .env as ALGOKIT_DISPENSER_ACCESS_TOKEN
 *   4. Funds BOTH test accounts with ALGO via the official dispenser API
 *
 * No Google login, no reCAPTCHA.
 *
 * Usage:  npm run testnet:login
 */
import { config } from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { TestNetDispenserApiClient } from '@algorandfoundation/algokit-utils';

// .env lives in the repo ROOT (../.env relative to server/), not server/.env
config({ path: join(fileURLToPath(new URL('../..', import.meta.url)), '.env') });

const AUTH0_DOMAIN = 'dispenser-prod.eu.auth0.com';
const CLIENT_ID = 'BOZkxGUiiWkaAXZebCQ20MTIYuQSqqpI';
const AUDIENCE = 'api-prod-dispenser-ci';

const RECEIVER = 'RO2CBOWPYD33AURIZ3H5UGHHVD3F4ATC32AS5RWUYCOIGEMFV42G34EDJE';
const PAYER = 'W3DK5D3F7BVYAT5M2YS5NOP4N5ZHEVCIYPCD2PYQKX7IFYWL5ZCRF5IEZA';
const FUND_ALGO = 10; // dispenser gives ~10 ALGO per request, daily limit

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function saveToken(token: string) {
  const envPath = join(process.cwd(), '.env');
  let content = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  if (/^ALGOKIT_DISPENSER_ACCESS_TOKEN=/m.test(content)) {
    content = content.replace(/^ALGOKIT_DISPENSER_ACCESS_TOKEN=.*$/m, `ALGOKIT_DISPENSER_ACCESS_TOKEN=${token}`);
  } else {
    content += `\n# AlgoKit TestNet Dispenser CI token (30 days) - get via: npm run testnet:login\nALGOKIT_DISPENSER_ACCESS_TOKEN=${token}\n`;
  }
  writeFileSync(envPath, content);
  console.log(`\n✓ Token saved to ${envPath}`);
}

async function main() {
  const existing = process.env.ALGOKIT_DISPENSER_ACCESS_TOKEN;
  if (existing) {
    console.log('Already have ALGOKIT_DISPENSER_ACCESS_TOKEN in env - using it.');
    console.log('(Delete it from .env to re-login)');
    return fundAll(existing);
  }

  // Step 1: request device code
  console.log('Requesting device code from AlgoKit Dispenser Auth0...');
  const deviceRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/device/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      audience: AUDIENCE,
      scope: 'openid profile email',
    }).toString(),
  });
  if (!deviceRes.ok) {
    console.error(`Device code request failed: ${deviceRes.status} ${await deviceRes.text()}`);
    process.exit(1);
  }
  const device = await deviceRes.json();
  const { device_code, user_code, verification_uri_complete, interval, expires_in } = device;

  // Log the device_code so an external poller can redeem it if this script dies
  console.log(`DEVICE_CODE_FOR_EXTERNAL_POLL: ${device_code}`);

  console.log('\n══════════════════════════════════════════════════');
  console.log('  ⚠ ONE HUMAN ACTION NEEDED (30 seconds)');
  console.log('══════════════════════════════════════════════════');
  console.log('  1. Open this URL (phone/desktop browser):');
  console.log(`     ${verification_uri_complete}`);
  console.log(`  2. Sign in with GitHub (or any account) and click Authorize`);
  console.log(`  3. Come back here - I will detect it automatically`);
  console.log(`\n  Code: ${user_code}  (expires in ${Math.floor(expires_in / 60)} min)`);
  console.log('══════════════════════════════════════════════════\n');

  // Step 2: poll for token
  const started = Date.now();
  while (Date.now() - started < expires_in * 1000) {
    await sleep((interval || 5) * 1000);
    const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code,
        client_id: CLIENT_ID,
        audience: AUDIENCE,
      }).toString(),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.access_token) {
      console.log('✓ Authorization successful!');
      saveToken(tokenData.access_token);
      return fundAll(tokenData.access_token);
    }
    if (tokenData.error === 'authorization_pending') {
      process.stdout.write('.');
      continue;
    }
    if (tokenData.error === 'slow_down') {
      await sleep(5000);
      continue;
    }
    if (tokenData.error === 'access_denied') {
      console.error('\n✗ Authorization denied.');
      process.exit(1);
    }
    if (tokenData.error === 'expired_token') {
      console.error('\n✗ Device code expired. Run again.');
      process.exit(1);
    }
    // unknown - show and retry
    console.error('\n? Poll response:', JSON.stringify(tokenData));
  }
  console.error('\n✗ Timed out waiting for authorization.');
  process.exit(1);
}

async function fundAll(token: string) {
  process.env.ALGOKIT_DISPENSER_ACCESS_TOKEN = token;
  const client = new TestNetDispenserApiClient();
  console.log('\n=== Funding both accounts (ALGO) ===');
  for (const [label, addr] of [
    ['Receiver (payTo)', RECEIVER],
    ['Payer (agent)', PAYER],
  ] as const) {
    try {
      const limit = await client.getLimit();
      console.log(`  ${label}: dispenser limit ${(Number(limit.amount) / 1e6).toFixed(1)} ALGO`);
      const res = await client.fund(addr, FUND_ALGO * 1e6);
      console.log(`  ✓ ${label} funded ${FUND_ALGO} ALGO - tx ${res.txId}`);
    } catch (e: any) {
      console.error(`  ✗ ${label} funding failed: ${e.message}`);
    }
    await sleep(2000);
  }
  console.log('\nNext: npm run testnet:setup  (opts both accounts into USDC)');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
