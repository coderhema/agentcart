import { Router } from 'express';
import { db } from '../../db/index.js';
import { agentWallets } from '../../db/schema.js';
import { transactions } from '../../db/schema.js';
import { sql } from 'drizzle-orm';

export const agentsRouter = Router();

agentsRouter.get('/', async (req, res) => {
  const agents = await db.select().from(agentWallets).orderBy(sql`total_spent DESC`);
  res.json({ agents });
});

agentsRouter.get('/:wallet', async (req, res) => {
  const agent = await db.select().from(agentWallets)
    .where({ wallet_address: req.params.wallet }).limit(1);
  if (!agent[0]) return res.status(404).json({ error: 'Agent not found' });

  const txnHistory = await db.select().from(transactions)
    .where({ agent_wallet: req.params.wallet })
    .orderBy(sql`created_at DESC`).limit(50);

  res.json({ ...agent[0], recent_transactions: txnHistory });
});