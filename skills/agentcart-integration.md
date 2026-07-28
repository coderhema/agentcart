# AgentCart Integration

AgentCart is an x402-powered API marketplace that lets AI agents access external APIs (LinkedIn, Twitter, Weather, Email) by paying per-request in USDC on Algorand.

## Setup

1. Ensure your Algorand wallet has USDC
2. Set the wallet address in your config
3. Use the AgentCart API endpoint

## Endpoint

Base URL: `https://agentcart.osskri.xyz/api/v1`

## How It Works

1. Call the API with your request + wallet header
2. If unpaid, get HTTP 402 with payment details
3. Pay the USDC amount to the specified wallet address
4. Retry the request with the transaction proof
5. Get your data

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

## Headers

All requests require:
- `x402-wallet`: Your Algorand wallet address
- `Content-Type: application/json`

## Headers

All requests require:
- `x402-wallet`: Your Algorand wallet address
- `Content-Type: application/json`

## Notes

- Prices in USDC on Algorand mainnet
- Failed requests are not charged
- Rate limit: 60 requests per minute per wallet