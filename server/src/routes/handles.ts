import { Router } from 'express';
import { db } from '../db/index.js';
import { agentHandles, transactions } from '../db/schema.js';
import { sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

export const handlesRouter = Router();

const HANDLE_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;

handlesRouter.get('/', async (req, res) => {
  const handles = await db.select().from(agentHandles)
    .where({ is_active: 1 })
    .orderBy(agentHandles.created_at);
  res.json({ handles });
});

handlesRouter.post('/register', async (req, res) => {
  const { handle, wallet_address, display_name, bio, avatar_url, spending_limit_usdc } = req.body;

  if (!handle || !wallet_address) {
    return res.status(400).json({ error: 'handle and wallet_address are required' });
  }
  if (!HANDLE_REGEX.test(handle)) {
    return res.status(400).json({ error: 'Invalid handle. Use lowercase letters, numbers, and dashes (2-32 chars).' });
  }

  try {
    const created = await db.insert(agentHandles).values({
      handle,
      wallet_address,
      display_name,
      bio,
      avatar_url,
      spending_limit_usdc: spending_limit_usdc || 0,
    }).returning();
    res.status(201).json(created[0]);
  } catch (error) {
    logger.error('Failed to register handle', error);
    res.status(409).json({ error: 'Handle or wallet already registered' });
  }
});

handlesRouter.get('/:handle', async (req, res) => {
  const row = await db.select().from(agentHandles)
    .where({ handle: req.params.handle, is_active: 1 })
    .limit(1);

  if (!row[0]) {
    return res.status(404).json({ error: 'Handle not found' });
  }

  const spent = await db.select({
    total_spent: sql`COALESCE(SUM(${transactions.amount_usdc}), 0)`,
    total_calls: sql`COUNT(*)`,
  }).from(transactions).where({ agent_wallet: row[0].wallet_address });

  res.json({
    ...row[0],
    total_spent: parseFloat(spent[0]?.total_spent?.toString() || '0'),
    total_calls: parseInt(spent[0]?.total_calls?.toString() || '0'),
  });
});

handlesRouter.put('/:handle', async (req, res) => {
  const { display_name, bio, avatar_url, spending_limit_usdc } = req.body;
  const updated = await db.update(agentHandles)
    .set({
      display_name,
      bio,
      avatar_url,
      spending_limit_usdc,
      updated_at: new Date().toISOString(),
    })
    .where({ handle: req.params.handle })
    .returning();
  if (!updated[0]) return res.status(404).json({ error: 'Handle not found' });
  res.json(updated[0]);
});