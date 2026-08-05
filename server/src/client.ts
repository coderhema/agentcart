import { config } from 'dotenv';
import { x402Client, wrapFetchWithPayment, x402HTTPClient } from '@x402/fetch';
import { toClientAvmSigner, ExactAvmScheme, ALGORAND_MAINNET_CAIP2, ALGORAND_TESTNET_CAIP2 } from '@x402/avm';
import {
  ed25519SigningKeyFromWrappedSecret,
  type WrappedEd25519Seed,
} from '@algorandfoundation/algokit-utils/crypto';
import { seedFromMnemonic } from '@algorandfoundation/algokit-utils/algo25';

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

const urlMap: Record<string, string> = {
  linkedin: 'https://agentcart.osskri.xyz/proxy/linkedin/profile',
  twitter: 'https://agentcart.osskri.xyz/proxy/twitter/search',
  weather: 'https://agentcart.osskri.xyz/proxy/weather/current',
  email: 'https://agentcart.osskri.xyz/proxy/email/verify',
};

const bodyMap: Record<string, Record<string, string>> = {
  linkedin: { url: param },
  twitter: { query: param },
  weather: { city: param },
  email: { email: param },
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