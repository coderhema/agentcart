import { config } from 'dotenv';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { paymentMiddleware, x402ResourceServer } from '@x402/hono';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { ExactAvmScheme } from '@x402/avm/exact/server';
import { USDC_MAINNET_ASA_ID, USDC_TESTNET_ASA_ID } from '@x402/avm';
import { declareDiscoveryExtension, bazaarResourceServerExtension } from '@x402-avm/extensions';
import { BrowserProvider } from './providers/browser.js';

// @x402/avm exports truncated CAIP-2 constants (bug in 2.19-2.24). Use the
// full canonical strings the GoPlausible facilitator accepts (from /supported).
const ALGORAND_MAINNET_CAIP2 = 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=';
const ALGORAND_TESTNET_CAIP2 = 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=';

config();

const avmAddress = process.env.AGENTCART_WALLET_ADDRESS;
if (!avmAddress) {
  console.error('Missing AGENTCART_WALLET_ADDRESS environment variable');
  process.exit(1);
}

const facilitatorUrl = process.env.X402_FACILITATOR || 'https://facilitator.goplausible.xyz';
const isMainnet = process.env.ALGORAND_NETWORK === 'mainnet';
const network = isMainnet ? ALGORAND_MAINNET_CAIP2 : ALGORAND_TESTNET_CAIP2;
const usdcAsset = isMainnet ? USDC_MAINNET_ASA_ID : USDC_TESTNET_ASA_ID;

const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
const server = new x402ResourceServer(facilitatorClient)
  .register(network, new ExactAvmScheme());

const linkedinDiscovery = declareDiscoveryExtension({
  bodyType: 'json',
  input: { url: 'https://www.linkedin.com/in/someprofile' },
  inputSchema: {
    properties: {
      url: { type: 'string', description: 'LinkedIn profile URL' },
    },
    required: ['url'],
  },
  output: {
    example: {
      name: 'John Doe',
      headline: 'CEO at Company',
      experience: [{ title: 'CEO', company: 'Company Inc.', duration: '2020-Present' }],
      education: [{ degree: 'MBA', school: 'University', year: '2018' }],
    },
  },
});

const twitterDiscovery = declareDiscoveryExtension({
  bodyType: 'json',
  input: { query: 'Algorand x402', count: 10 },
  inputSchema: {
    properties: {
      query: { type: 'string', description: 'Search query' },
      count: { type: 'number', description: 'Number of results (max 20)' },
    },
    required: ['query'],
  },
  output: {
    example: {
      tweets: [{ id: '1', text: 'Sample tweet', author: '@user', metrics: { likes: 10, retweets: 2 } }],
    },
  },
});

const weatherDiscovery = declareDiscoveryExtension({
  bodyType: 'json',
  input: { city: 'San Francisco', units: 'metric' },
  inputSchema: {
    properties: {
      city: { type: 'string', description: 'City name' },
      units: { type: 'string', enum: ['metric', 'imperial'], description: 'Temperature units' },
    },
    required: ['city'],
  },
  output: {
    example: {
      city: 'San Francisco',
      temperature: 18.5,
      conditions: 'Partly cloudy',
      humidity: 65,
      wind_speed: 12,
    },
  },
});

const emailDiscovery = declareDiscoveryExtension({
  bodyType: 'json',
  input: { email: 'user@example.com' },
  inputSchema: {
    properties: {
      email: { type: 'string', description: 'Email address to verify' },
    },
    required: ['email'],
  },
  output: {
    example: {
      email: 'user@example.com',
      valid: true,
      risk_score: 0.1,
      domain: 'example.com',
      disposable: false,
    },
  },
});

const browserDiscovery = declareDiscoveryExtension({
  bodyType: 'json',
  input: { action: 'open', params: { url: 'https://example.com' } },
  inputSchema: {
    properties: {
      action: {
        type: 'string',
        enum: ['open', 'snapshot', 'click', 'fill', 'extract', 'screenshot', 'close'],
        description: 'Browser action to execute',
      },
      params: {
        type: 'object',
        description: 'Action-specific parameters (url, ref, value, script, interactive)',
      },
    },
    required: ['action'],
  },
  output: {
    example: {
      action: 'open',
      ok: true,
      url: 'https://example.com',
    },
  },
});

const app = new Hono();

app.use(
  paymentMiddleware(
    {
      'POST /proxy/linkedin/profile': {
        accepts: [
          {
            scheme: 'exact',
            price: '$0.05',
            network,
            payTo: avmAddress,
            extra: { asset: usdcAsset, tag: 'x402-global-challenge' },
          },
        ],
        description: 'LinkedIn Profile Data: name, headline, experience, education for a given LinkedIn profile URL',
        mimeType: 'application/json',
        extensions: linkedinDiscovery,
      },
      'POST /proxy/twitter/search': {
        accepts: [
          {
            scheme: 'exact',
            price: '$0.03',
            network,
            payTo: avmAddress,
            extra: { asset: usdcAsset, tag: 'x402-global-challenge' },
          },
        ],
        description: 'Twitter/X Search: recent tweets by query with author, text, and engagement metrics',
        mimeType: 'application/json',
        extensions: twitterDiscovery,
      },
      'POST /proxy/weather/current': {
        accepts: [
          {
            scheme: 'exact',
            price: '$0.01',
            network,
            payTo: avmAddress,
            extra: { asset: usdcAsset, tag: 'x402-global-challenge' },
          },
        ],
        description: 'Real-time weather: temperature, conditions, humidity, and wind for a given city',
        mimeType: 'application/json',
        extensions: weatherDiscovery,
      },
      'POST /proxy/email/verify': {
        accepts: [
          {
            scheme: 'exact',
            price: '$0.02',
            network,
            payTo: avmAddress,
            extra: { asset: usdcAsset, tag: 'x402-global-challenge' },
          },
        ],
        description: 'Email Verification: validate deliverability, risk score, and domain info for a given email address',
        mimeType: 'application/json',
        extensions: emailDiscovery,
      },
      'POST /proxy/browser/action': {
        accepts: [
          {
            scheme: 'exact',
            price: '$0.02',
            network,
            payTo: avmAddress,
            extra: { asset: usdcAsset, tag: 'x402-global-challenge' },
          },
        ],
        description: 'Browser Action: real browser automation - open pages, snapshot elements, click, fill forms, or extract data from any public website. SSRF-protected (no private/loopback targets).',
        mimeType: 'application/json',
        extensions: browserDiscovery,
      },
    },
    server,
  ),
);

app.post('/proxy/linkedin/profile', async (c) => {
  return c.json({
    success: true,
    data: {
      name: 'John Doe',
      headline: 'CEO at Company',
      experience: [
        { title: 'CEO', company: 'Company Inc.', duration: '2020-Present' },
        { title: 'CTO', company: 'Startup Co.', duration: '2018-2020' },
      ],
      education: [{ degree: 'MBA', school: 'University', year: '2018' }],
    },
  });
});

app.post('/proxy/twitter/search', async (c) => {
  const { query, count = 10 } = await c.req.json().catch(() => ({ query: '', count: 10 }));
  return c.json({
    success: true,
    data: {
      query,
      tweets: Array.from({ length: Math.min(count, 20) }, (_, i) => ({
        id: `t${i + 1}`,
        text: `Sample tweet ${i + 1} about ${query || 'query'}`,
        author: `@user${i + 1}`,
        metrics: { likes: 10, retweets: 2 },
      })),
    },
  });
});

app.post('/proxy/weather/current', async (c) => {
  const { city = 'Unknown', units = 'metric' } = await c.req.json().catch(() => ({}));
  return c.json({
    success: true,
    data: {
      city,
      temperature: units === 'imperial' ? 65 : 18.5,
      conditions: 'Partly cloudy',
      humidity: 65,
      wind_speed: 12,
    },
  });
});

app.post('/proxy/email/verify', async (c) => {
  const { email = '' } = await c.req.json().catch(() => ({}));
  return c.json({
    success: true,
    data: {
      email,
      valid: /\S+@\S+\.\S+/.test(email),
      risk_score: 0.1,
      domain: email.split('@')[1],
      disposable: false,
    },
  });
});

const browserProvider = new BrowserProvider();

app.post('/proxy/browser/action', async (c) => {
  const { action, params = {} } = await c.req.json().catch(() => ({ action: '', params: {} }));
  try {
    const data = await browserProvider.handle(action, params);
    return c.json({ success: true, action, data });
  } catch (e: any) {
    return c.json({ success: false, action, error: e?.message || 'Browser action failed' }, 400);
  }
});

const port = parseInt(process.env.X402_PORT || '4021', 10);

serve({ fetch: app.fetch, port }, () => {
  console.log(`AgentCart x402 Resource Server listening on http://localhost:${port}`);
  console.log(`Network: ${isMainnet ? 'Mainnet' : 'Testnet'} (${network})`);
  console.log(`Facilitator: ${facilitatorUrl}`);
  console.log(`PayTo: ${avmAddress}`);
});