import { Router } from 'express';
import {
  x402HTTPResourceServer,
  HTTPFacilitatorClient,
} from '@x402/core/server';
import { registerExactAvmScheme } from '@x402/avm/exact/server';
import {
  bazaarResourceServerExtension,
  declareDiscoveryExtension,
} from '@x402/extensions';
import { config } from '../config.js';
import { registry } from '../providers/registry.js';
import { db } from '../db/index.js';
import { transactions, agentWallets, apiProducts } from '../db/schema.js';
import { logger } from '../utils/logger.js';

export const proxyRouter = Router();

const facilitatorClient = new HTTPFacilitatorClient({
  url: config.x402.facilitator,
});

const server = new x402HTTPResourceServer(facilitatorClient, {
  routes: [
    {
      path: '/api/v1/proxy/linkedin/profile',
      config: {
        scheme: 'exact',
        payTo: config.algorand.walletAddress,
        price: {
          asset: config.algorand.usdcAsaId,
          amount: '50000',
          extra: { name: 'USDC', decimals: 6, tag: 'x402-global-challenge' },
        },
        network: config.algorand.caip2,
        maxTimeoutSeconds: 60,
      },
      description: 'LinkedIn Profile Data: name, headline, experience, education for a given LinkedIn profile URL',
      mimeType: 'application/json',
    },
    {
      path: '/api/v1/proxy/twitter/search',
      config: {
        scheme: 'exact',
        payTo: config.algorand.walletAddress,
        price: {
          asset: config.algorand.usdcAsaId,
          amount: '30000',
          extra: { name: 'USDC', decimals: 6, tag: 'x402-global-challenge' },
        },
        network: config.algorand.caip2,
        maxTimeoutSeconds: 60,
      },
      description: 'Twitter/X Search: recent tweets by query with author, text, and engagement metrics',
      mimeType: 'application/json',
    },
    {
      path: '/api/v1/proxy/weather/current',
      config: {
        scheme: 'exact',
        payTo: config.algorand.walletAddress,
        price: {
          asset: config.algorand.usdcAsaId,
          amount: '10000',
          extra: { name: 'USDC', decimals: 6, tag: 'x402-global-challenge' },
        },
        network: config.algorand.caip2,
        maxTimeoutSeconds: 60,
      },
      description: 'Real-time weather: temperature, conditions, humidity, and wind for a given city',
      mimeType: 'application/json',
    },
    {
      path: '/api/v1/proxy/email/verify',
      config: {
        scheme: 'exact',
        payTo: config.algorand.walletAddress,
        price: {
          asset: config.algorand.usdcAsaId,
          amount: '20000',
          extra: { name: 'USDC', decimals: 6, tag: 'x402-global-challenge' },
        },
        network: config.algorand.caip2,
        maxTimeoutSeconds: 60,
      },
      description: 'Email Verification: validate deliverability, risk score, and domain info for a given email address',
      mimeType: 'application/json',
    },
  ],
});

registerExactAvmScheme(server.resourceServer);
server.resourceServer.registerExtension(bazaarResourceServerExtension);

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

const discoveryMap: Record<string, any> = {
  linkedin: { profile: linkedinDiscovery },
  twitter: { search: twitterDiscovery },
  weather: { current: weatherDiscovery },
  email: { verify: emailDiscovery },
};

proxyRouter.all('/:provider/:action', async (req, res) => {
  const { provider, action } = req.params;

  try {
    const discovery = discoveryMap[provider]?.[action];
    const result = await server.processRequest({
      url: req.originalUrl,
      method: req.method,
      headers: req.headers as Record<string, string>,
      adapter: {
        getHeader: (name: string) => req.headers[name.toLowerCase()] as string,
      },
      extensions: discovery || undefined,
    });

    if (result.status === 402) {
      return res.status(402).json(result.body);
    }

    const handler = registry.get(provider);
    if (!handler) {
      return res.status(404).json({ error: `Provider '${provider}' not found` });
    }

    const data = await handler.handle(action, req.body);
    const wallet = req.headers['x402-wallet'] as string;
    const txnProof = req.headers['x402-proof'] as string;
    const productPath = `/proxy/${provider}/${action}`;
    const products = await db.select().from(apiProducts);
    const product = products.find(p => productPath.includes(p.endpoint_path) || productPath.includes(p.id));

    if (product) {
      const txnId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await db.insert(transactions).values({
        id: txnId,
        agent_wallet: wallet || 'unknown',
        product_id: product.id,
        amount_usdc: product.price_usdc,
        txn_id: txnProof,
        status: 'confirmed',
        request_data: JSON.stringify(req.body),
        response_data: JSON.stringify(data),
        ip_address: req.ip,
        confirmed_at: new Date().toISOString(),
      });

      await db.insert(agentWallets).values({
        wallet_address: wallet || 'unknown',
        last_seen: new Date().toISOString(),
      }).onConflictDoUpdate({
        target: agentWallets.wallet_address,
        set: {
          last_seen: new Date().toISOString(),
          total_spent: (agentWallets as any).total_spent + product.price_usdc,
          total_calls: (agentWallets as any).total_calls + 1,
        },
      });
    }

    res.json({
      success: true,
      data,
      transaction: product ? {
        id: `txn_${Date.now()}`,
        amount_usdc: product.price_usdc,
        timestamp: Math.floor(Date.now() / 1000),
      } : undefined,
    });
  } catch (error) {
    logger.error(`Proxy error for ${provider}/${action}`, error);
    res.status(502).json({ error: 'Upstream API error', message: (error as Error).message });
  }
});