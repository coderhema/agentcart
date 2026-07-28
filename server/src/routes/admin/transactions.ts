import { Router } from 'express';
import { db } from '../../db/index.js';
import { transactions } from '../../db/schema.js';
import { sql } from 'drizzle-orm';

export const transactionsRouter = Router();

transactionsRouter.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;

  const rows = await db.select().from(transactions)
    .orderBy(sql`created_at DESC`)
    .limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql`COUNT(*)` }).from(transactions);

  res.json({ transactions: rows, total: count, page, limit });
});

transactionsRouter.get('/stats', async (req, res) => {
  const stats = await db.select({
    total_volume: sql`COALESCE(SUM(${transactions.amount_usdc}), 0)`,
    total_txns: sql`COUNT(*)`,
    today_volume: sql`COALESCE(SUM(CASE WHEN date(${transactions.created_at}) = date('now') THEN ${transactions.amount_usdc} ELSE 0 END), 0)`,
    today_txns: sql`COUNT(CASE WHEN date(${transactions.created_at}) = date('now') THEN 1 END)`,
  }).from(transactions);

  res.json(stats[0]);
});

transactionsRouter.get('/:id', async (req, res) => {
  const txn = await db.select().from(transactions).where({ id: req.params.id }).limit(1);
  if (!txn[0]) return res.status(404).json({ error: 'Transaction not found' });
  res.json(txn[0]);
});