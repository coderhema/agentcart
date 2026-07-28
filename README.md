# AgentCart — x402-Powered API Marketplace for AI Agents

The first payment rail that lets AI agents buy API access autonomously. No signup, no OAuth, no human — just USDC on Algorand.

Built for the [Algorand x402 Global Challenge](https://algorand.co/global-x402-challenge).

## Overview

AgentCart is an x402-powered API marketplace. An agent shows up with an Algorand wallet, pays per-request in USDC, and gets instant access. AgentCart holds the master API keys and provides a unified, pay-per-call proxy.

### Key Principles

- **No human in the loop.** Payment -> data. Full autonomy.
- **x402 native.** HTTP 402 Payment Required is the protocol.
- **Pay-per-call.** Micropayments in USDC on Algorand.
- **Open marketplace.** Any API provider can list.

## Quick Start

```bash
git clone https://github.com/coderhema/agentcart
cd agentcart
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev          # Server on :3001
npm run dev:dashboard # Dashboard on :5173
```

## Project Structure

```
agentcart/
├── server/          # Express + TypeScript x402 API gateway
├── dashboard/       # React + Vite + Tailwind admin UI
├── mcp-server/      # MCP server for agent integration
├── skills/          # Agent skill files
└── scripts/         # Seed and deploy scripts
```

## Environment Variables

See `.env.example` for all configuration options including:
- Algorand wallet and network settings
- Provider API keys (LinkedIn, Twitter, Weather, Email)
- GoPlausible facilitator URL
- Dashboard authentication

## License

MIT