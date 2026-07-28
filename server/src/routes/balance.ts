import { Router } from 'express';
import { db } from '../db/index.js';
import { agentWallets, transactions } from '../db/schema.js';
import { sql } from 'drizzle-orm';

export const balanceRouter = Router();

balanceRouter.get('/', async (req, res) => {
  const wallet = req.headers['x402-wallet'] as string;
  if (!wallet) {
    return res.status(400).json({ error: 'x402-wallet header required' });
  }

  const agent = await db.select().from(agentWallets).where({ wallet_address: wallet }).limit(1);
  const stats = await db.select({
    total_spent: sql`COALESCE(SUM(${transactions.amount_usdc}), 0)`,
    total_calls: sql`COUNT(*)`,
  }).from(transactions).where({ agent_wallet: wallet });

  res.json({
    wallet,
    usdc_balance: agent[0]?.total_spent ? (100 - agent[0].total_spent).toFixed(2) : '100.00',
    total_spent: parseFloat(stats[0]?.total_spent?.toString() || '0').toFixed(2),
    total_calls: parseInt(stats[0]?.total_calls?.toString() || '0'),
  });
});