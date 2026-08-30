import { config } from 'dotenv';
import { x402Client, wrapFetchWithPayment, x402HTTPClient } from '@x402/fetch';
import { toClientAvmSigner, ExactAvmScheme } from '@x402/avm';
import {
  ed25519SigningKeyFromWrappedSecret,
  type WrappedEd25519Seed,
} from '@algorandfoundation/algokit-utils/crypto';
import { seedFromMnemonic } from '@algorandfoundation/algokit-utils/algo25';

// @x402/avm exports truncated CAIP-2 constants (bug in 2.19-2.24).
const ALGORAND_MAINNET_CAIP2 = 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=';
const ALGORAND_TESTNET_CAIP2 = 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=';

config();

const avmMnemonic = process.env.AGENT_PRIVATE_KEY as string;
const isMainnet = process.env.ALGORAND_NETWORK === 'mainnet';
const network = isMainnet ? ALGORAND_MAINNET_CAIP2 : ALGORAND_TESTNET_CAIP2;

if (!avmMnemonic) {
  console.error('Missing AGENT_PRIVATE_KEY (25-word mnemonic)');
  process.exit(1);
}

const endpoint = process.argv[2] || 'weather';
const param = process.argv[3] || 'San Francisco';

// Browser action params: accept JSON string ({"url":"..."}) or bare value (open https://x.com -> {url})
let browserParams: Record<string, string>;
try {
  browserParams = param.startsWith('{') ? JSON.parse(param) : { url: param };
} catch {
  browserParams = { url: param };
}

// Point at a local x402 server with AGENTCART_BASE_URL or AGENTCART_URL
const baseUrl = process.env.AGENTCART_BASE_URL || process.env.AGENTCART_URL || 'https://agentcart.osskri.xyz';

const urlMap: Record<string, string> = {
  linkedin: `${baseUrl}/proxy/linkedin/profile`,
  twitter: `${baseUrl}/proxy/twitter/search`,
  weather: `${baseUrl}/proxy/weather/current`,
  email: `${baseUrl}/proxy/email/verify`,
  browser: `${baseUrl}/proxy/browser/action`,
};

const bodyMap: Record<string, Record<string, unknown>> = {
  linkedin: { url: param },
  twitter: { query: param },
  weather: { city: param },
  email: { email: param },
  browser: { action: param.split(' ')[0] ?? 'open', params: browserParams },
};

async function getSecretKeyFromMnemonic(avmMnemonic: string): Promise<string> {
  const seed = seedFromMnemonic(avmMnemonic);
  const seedCopy = new Uint8Array(seed);
  const wrappedSeed: WrappedEd25519Seed = {
    unwrapEd25519Seed: async () => seed,
    wrapEd25519Seed: async () => {},
  };
  const wrappedSecret = await ed25519SigningKeyFromWrappedSecret(wrappedSeed);
  return Buffer.concat([Buffer.from(seedCopy), Buffer.from(wrappedSecret.ed25519Pubkey)]).toString('base64');
}

async function main(): Promise<void> {
  const secretKey = await getSecretKeyFromMnemonic(avmMnemonic);
  const avmSigner = toClientAvmSigner(secretKey);
  const client = new x402Client();
  client.register(network, new ExactAvmScheme(avmSigner));

  console.info(`Agent wallet: ${avmSigner.address}`);
  console.info(`Requesting: ${urlMap[endpoint]} ...`);

  const fetchWithPayment = wrapFetchWithPayment(fetch, client);
  const response = await fetchWithPayment(urlMap[endpoint], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyMap[endpoint]),
  });

  if (response.ok) {
    const paymentResponse = new x402HTTPClient(client).getPaymentSettleResponse(name =>
      response.headers.get(name),
    );
    console.log('\nPayment response:');
    console.log(JSON.stringify(paymentResponse, null, 2));
    console.log('\nData response:');
    console.log(JSON.stringify(await response.json(), null, 2));
  } else {
    console.log(`\nRequest failed (status: ${response.status})`);
  }
}

main().catch(error => {
  console.error(error?.response?.data?.error ?? error);
  process.exit(1);
});