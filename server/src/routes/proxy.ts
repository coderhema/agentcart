import { Router } from 'express';
import { x402Middleware } from '@x402/express';
import { algorand } from '@x402/avm';
import { config } from '../config.js';
import { registry } from '../providers/registry.js';
import { db } from '../db/index.js';
import { transactions, agentWallets } from '../db/schema.js';
import { logger } from '../utils/logger.js';

export const proxyRouter = Router();

proxyRouter.use(x402Middleware({
  network: algorand,
  facilitator: config.x402.facilitator,
  receiver: config.algorand.walletAddress,
  getPrice: async (req) => {
    const product = await getProductByPath(req.path);
    return product?.price_usdc?.toString() || '0';
  },
}));

proxyRouter.all('/:provider/:action', async (req, res) => {
  const { provider, action } = req.params;
  const wallet = req.headers['x402-wallet'] as string;
  const txnProof = req.headers['x402-proof'] as string;

  try {
    const handler = registry.get(provider);
    if (!handler) {
      return res.status(404).json({ error: `Provider '${provider}' not found` });
    }

    const data = await handler.handle(action, req.body);
    const productPath = `/proxy/${provider}/${action}`;
    const product = await getProductByPath(productPath);

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
          total_spent: agentWallets.total_spent + product.price_usdc,
          total_calls: agentWallets.total_calls + 1,
        },
      });
    }

    res.json({
      success: true,
      data,
      transaction: txnId ? {
        id: txnId,
        amount_usdc: product?.price_usdc,
        timestamp: Math.floor(Date.now() / 1000),
      } : undefined,
    });
  } catch (error) {
    logger.error(`Proxy error for ${provider}/${action}`, error);
    res.status(502).json({ error: 'Upstream API error', message: (error as Error).message });
  }
});

async function getProductByPath(path: string) {
  const products = await db.select().from(apiProducts);
  return products.find(p => path.includes(p.endpoint_path) || path.includes(p.id));
}