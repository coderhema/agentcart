# AgentCart

**The agent went to the market for you.**

AgentCart is a cart for AI agents. You shop, your agent pays, and everyone gets settled at once. It works with any agent — Claude, DeepSeek, ChatGPT, Hermes — and from your Chrome browser. No credit card. No account signup. Just USDC on Algorand.

AgentCart is built for the Algorand x402 Global Challenge.

## The Idea

You are browsing and you see a shirt you love. You do not fill a checkout form. You do not enter your card details. You just say: *"I love this shirt."*

You attach the image and the link. Your agent takes it from there.

The agent goes to the market for you. It buys the shirt from the store. It buys the shoes from another store. It buys the API from a third place. All of these are in one cart. Then it pays all the sellers at once, in one batch.

It also shops **money-wise**: for every item it compares the price across stores, finds the best deal, and only then adds it to the cart. You always get the best price without doing the hunting.

This is the cart. No per-store checkout. No stress.

## The Flow

1. **You spot something** — on any website, or in any agent.
2. **You drop it in the cart** — an image, a link, a price.
3. **The agent checks the cart** — is it already there?
4. **If it is a duplicate**, the agent asks: *"This is already in your cart. Do you want another one?"*
5. **You keep shopping** — shoes here, API there, shirt from Shein.
6. **Checkout** — one action, and the agent settles everyone at once.

Your agent can shop for you. You can shop with your agent. Both of you use the same identity — your **handle**.

## Your Handle

Your handle is your identity. It works like a domain name, an email, or a username. You use the same handle on Chrome, on Claude, on DeepSeek — everywhere.

- It is human-readable: `@yourname`
- It points to your Algorand wallet
- Every item you or your agent adds goes to the same cart
- Anyone can resolve your handle to your wallet

No long wallet addresses. No private keys pasted around. Just your handle.

## The WhatsApp Bot

The same cart, right in your chat. Send the AgentCart bot on WhatsApp a photo or a link from Shein, Temu, or Jumia and say *"check price"*.

The agent finds the same item across stores, compares prices, and builds a cart with the best deal on each. You see one total. You pay once, in USDC. The bot shows the total in your local currency — so no math, no conversion stress — and every seller gets settled in USDC at once.

No app to install. No card to enter. Just a chat.

## The Architecture

Any agent connects to AgentCart through the cart API. They all share your handle. Chrome, Claude, DeepSeek, ChatGPT, and Hermes all talk to the same cart.

```
[Chrome plugin] ─┐
[Claude/DeepSeek] ├─► AgentCart Cart API ──► @handle ──► wallet
[ChatGPT/Hermes] ─┘        │
                    cart + dedupe + batch atomic payment
                                   │
                          ┌────────┴────────┐
                          ▼                 ▼
                      x402 payment      Algorand atomic group
```

On the left are the ways in: the Chrome plugin, or any AI agent. In the middle is the cart — add items, find duplicates, and check out. On the right is the money — x402 handles each payment, and one Algorand atomic group settles the whole cart with every seller at once.

**Why Algorand:** it can split one checkout into many payments and settle them all together in a single atomic group. All the sellers get paid, or none of them do. That is exactly what a cart needs.

### The Money Model

Give the agent a balance, and it spends from there. No per-checkout checkout forms, no card entry.

```
top-up once ──► Agent wallet (USDC balance)
                    │  pays via x402 (per request)
                    ▼
                 Store wallet (USDC)
```

- **One top-up.** The user loads the agent's Algorand wallet with USDC once. That balance is what the agent spends.
- **Per-request payment.** Each API or store call is an x402 payment out of that balance, settled on-chain in USDC.
- **Store receives USDC.** If a store later wants cash, that is its own off-ramp — outside the checkout flow.
- **Local currency is a display estimate.** The UI shows the price in the user's local currency (e.g. "≈ ₦3,400"), but the settlement is USDC. No FX in the middle.
- **Fiat on/off ramps are a later layer.** Paystack-style local-currency checkout and conversion to cash build on top of this — they are not part of the hackathon core.

## The Parts

| Part | Function |
|---|---|
| Server | It receives the requests and the payments. |
| Cart API | It adds items, finds duplicates, and does the checkout. |
| Handle Registry | It gives each agent a human-readable name. |
| Chrome Plugin | It adds items straight from the browser. |
| Dashboard | It shows the cart, the transactions, and the revenue. |
| MCP Server | It connects AI agents to the cart. |

The server uses the Hono framework. It uses the `@x402` packages and the GoPlausible facilitator. The dashboard uses React and Tailwind CSS.

## The APIs

The cart can buy from these services. More are added all the time.

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
- `AGENT_PRIVATE_KEY` is the wallet that pays for the items.
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

## How To Shop

### 1. Register your handle

```bash
curl -X POST http://localhost:3001/api/v1/handles/register \
  -H 'Content-Type: application/json' \
  -d '{
    "handle": "yourname",
    "wallet_address": "YOUR_WALLET_ADDRESS",
    "display_name": "Your Name"
  }'
```

### 2. Add something to the cart

```bash
curl -X POST http://localhost:3001/api/v1/cart/add \
  -H 'Content-Type: application/json' \
  -d '{
    "handle": "yourname",
    "title": "That shirt I love",
    "source": "shein.com",
    "product_url": "https://shein.com/shirt",
    "image_url": "https://shein.com/shirt.jpg",
    "price_usdc": 12.50,
    "seller_payto": "SELLER_WALLET_ADDRESS"
  }'
```

If the shirt is already in the cart, the agent replies: *"This is already in your cart. Do you want another one?"*

### 3. View your cart

```bash
curl http://localhost:3001/api/v1/cart/yourname
```

### 4. Checkout — pay everyone at once

```bash
curl -X POST http://localhost:3001/api/v1/cart/yourname/checkout
```

AgentCart builds one Algorand atomic group. It pays the shirt store, the shoe store, and the API in a single batch. All settle together or none do.

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

## Watch It Work

> The demo video and the screenshots will go here once the full flow runs on the testnet.

![AgentCart demo](docs/screenshot.png)

[Watch the demo video](https://your-demo-video-link.example)

## The Project Structure

```
agentcart/
├── server/           The API server and the cart
├── dashboard/        The dashboard
├── chrome-extension/ The Chrome plugin
├── mcp-server/       The MCP server for agents
├── skills/           The agent skill files
└── scripts/          The maintenance scripts
```

## The License

AgentCart uses the MIT license.
