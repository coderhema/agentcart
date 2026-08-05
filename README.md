# AgentCart

AgentCart is a payment system for AI agents. It lets an AI agent buy data from APIs.

The agent pays with USDC on the Algorand network. It does not need a user account. It does not need a credit card.

The payment protocol is x402. It uses the HTTP 402 status code. AgentCart is built for the Algorand x402 Global Challenge.

## What It Does

An AI agent wants data from an API. It sends a request to AgentCart. AgentCart sends back a payment request. The agent pays the amount in USDC. AgentCart verifies the payment on the Algorand network. AgentCart sends the data to the agent.

This flow is automatic. No human must do anything.

## How It Is Built

AgentCart has three parts.

| Part | Function |
|---|---|
| Server | It receives the requests and the payments. |
| Dashboard | It shows the transactions and the revenue. |
| MCP Server | It connects the agent to the APIs. |

The server uses the Hono framework. It uses the `@x402` packages. It uses the GoPlausible facilitator. The facilitator verifies the payments.

The dashboard uses React and Tailwind CSS.

## The APIs

AgentCart gives access to four APIs.

| API | Use | Price |
|---|---|---|
| LinkedIn Profile Data | It gets a public LinkedIn profile. | 0.05 USDC |
| Twitter/X Search | It searches for tweets. | 0.03 USDC |
| Weather Data | It gets the current weather. | 0.01 USDC |
| Email Verification | It checks if an email address is valid. | 0.02 USDC |

## How To Run It

You must do these steps to run AgentCart on your computer.

### 1. Install the software

```bash
git clone https://github.com/coderhema/agentcart
cd agentcart
npm install
```

### 2. Make the configuration file

```bash
cp .env.example .env
```

### 3. Set the environment values

Open the file `.env`. You must set these values:

- `AGENTCART_WALLET_ADDRESS` is the wallet that receives the payments.
- `AGENT_PRIVATE_KEY` is the wallet that pays for the data.
- `ALGORAND_NETWORK` is `testnet` for tests. It is `mainnet` for the competition.

You must create two Algorand wallets. You must fund both wallets with test ALGO. You must give both wallets test USDC. You must opt both wallets into USDC.

### 4. Create the database

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start the server

```bash
npm run dev
```

The server runs on port 3001. The x402 server runs on port 4021. The dashboard runs on port 5173.

## How To Test

You must test on the testnet first. The testnet does not use real money.

Start the server:

```bash
npm run dev
```

Run the client in a second terminal:

```bash
cd server
npm run client weather "San Francisco"
```

The client pays with USDC. It receives the weather data. The transaction appears on the GoPlausible dashboard.

## How To Enter The Competition

You must do these steps to enter the x402 Global Challenge.

1. Test the endpoint on the testnet.
2. Set `ALGORAND_NETWORK=mainnet` in the file `.env`.
3. Deploy the server to a public server. It must be accessible with HTTPS.
4. Fund the mainnet wallet with USDC. Opt the wallet into USDC.
5. Make a real payment. Confirm that USDC arrives at your wallet.
6. Check the GoPlausible leaderboard. Your project must appear there.

All four endpoints use the same payTo address. This makes AgentCart a Composite entry.

## The Project Structure

```
agentcart/
├── server/       The API server
├── dashboard/    The dashboard
├── mcp-server/   The MCP server
├── skills/       The agent skill files
└── scripts/      The maintenance scripts
```

## The License

AgentCart uses the MIT license.
