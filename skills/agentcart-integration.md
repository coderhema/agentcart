# AgentCart Integration

AgentCart is an x402-powered API marketplace that lets AI agents access external APIs (LinkedIn, Twitter, Weather, Email) by paying per-request in USDC on Algorand. Built for the Algorand x402 Global Challenge.

## Setup

1. Create two Algorand accounts:
   - **Receiver** (AgentCart's payTo address) — set as `AGENTCART_WALLET_ADDRESS`
   - **Payer** (agent wallet) — fund with ALGO + USDC, set mnemonic as `AGENT_PRIVATE_KEY`
2. Fund both with test ALGO from the [Lora faucet](https://lora.algokit.io/testnet/fund) and USDC from the [Circle testnet faucet](https://faucet.circle.com/)
3. Opt both accounts into TestNet USDC (ASA 10458941) or MainNet USDC (ASA 31566704)

## Your Handle

Register a human-readable handle for your agent. A handle is as easy to use as a domain name, email, or username. Use it instead of a long wallet address.

```bash
curl -X POST https://agentcart.osskri.xyz/api/v1/handles/register \
  -H 'Content-Type: application/json' \
  -d '{
    "handle": "myagent",
    "wallet_address": "YOUR_ALGORAND_WALLET",
    "display_name": "My Agent",
    "bio": "A helpful agent"
  }'
```

Resolve a handle to a wallet:

```bash
curl https://agentcart.osskri.xyz/api/v1/handles/myagent
```

## Endpoint

Base URL: `https://agentcart.osskri.xyz`

## How It Works

1. Call the API with your request
2. If unpaid, you get HTTP 402 with payment requirements
3. Pay the USDC amount to the specified payTo address on Algorand
4. Retry the request with proof of payment
5. Get your data

Use `wrapFetchWithPayment` from `@x402/fetch` to automate this flow:

```typescript
import { x402Client, wrapFetchWithPayment, x402HTTPClient } from '@x402/fetch';
import { toClientAvmSigner, ExactAvmScheme } from '@x402/avm';
// @x402/avm exports truncated CAIP-2 constants (bug in 2.19-2.24) - use full strings
const ALGORAND_MAINNET_CAIP2 = 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=';
import { seedFromMnemonic } from '@algorandfoundation/algokit-utils/algo25';
import { ed25519SigningKeyFromWrappedSecret } from '@algorandfoundation/algokit-utils/crypto';

const avmSigner = toClientAvmSigner(await getSecretKeyFromMnemonic(process.env.AGENT_PRIVATE_KEY));
const client = new x402Client();
client.register(ALGORAND_MAINNET_CAIP2, new ExactAvmScheme(avmSigner));

const fetchWithPayment = wrapFetchWithPayment(fetch, client);
const response = await fetchWithPayment('https://agentcart.osskri.xyz/proxy/weather/current', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ city: 'San Francisco' }),
});
const data = await response.json();
```

## Available APIs

### LinkedIn Profile Data
- **Endpoint:** POST /proxy/linkedin/profile
- **Cost:** 0.05 USDC per call
- **Parameters:** `url` (string, required): LinkedIn profile URL

### Twitter/X Search
- **Endpoint:** POST /proxy/twitter/search
- **Cost:** 0.03 USDC per call
- **Parameters:** `query` (string, required), `count` (number, optional, max 20)

### Weather Data
- **Endpoint:** POST /proxy/weather/current
- **Cost:** 0.01 USDC per call
- **Parameters:** `city` (string, required), `units` (string, optional: metric/imperial)

### Email Verification
- **Endpoint:** POST /proxy/email/verify
- **Cost:** 0.02 USDC per call
- **Parameters:** `email` (string, required)

## Notes

- Prices in USDC on Algorand
- Failed requests are not charged
- Rate limit: 60 requests per minute per wallet
- All endpoints share one payTo address (Composite entry for the x402 Global Challenge)