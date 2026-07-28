import { Router } from 'express';
import { db } from '../../db/index.js';
import { transactions, apiProducts } from '../../db/schema.js';
import { sql } from 'drizzle-orm';

export const statsRouter = Router();

statsRouter.get('/', async (req, res) => {
  const days = parseInt(req.query.days as string) || 7;

  const overview = await db.select({
    total_calls: sql`COUNT(*)`,
    revenue: sql`COALESCE(SUM(${transactions.amount_usdc}), 0)`,
    unique_agents: sql`COUNT(DISTINCT ${transactions.agent_wallet})`,
    avg_price: sql`COALESCE(AVG(${transactions.amount_usdc}), 0)`,
  }).from(transactions);

  const revenueByDay = await db.select({
    date: sql`date(${transactions.created_at})`,
    revenue: sql`COALESCE(SUM(${transactions.amount_usdc}), 0)`,
    count: sql`COUNT(*)`,
  }).from(transactions)
    .where(sql`date(${transactions.created_at}) >= date('now', '-' || ${days} || ' days')`)
    .groupBy(sql`date(${transactions.created_at})`)
    .orderBy(sql`date(${transactions.created_at})`);

  const topApis = await db.select({
    product_id: transactions.product_id,
    revenue: sql`COALESCE(SUM(${transactions.amount_usdc}), 0)`,
    count: sql`COUNT(*)`,
  }).from(transactions)
    .groupBy(transactions.product_id)
    .orderBy(sql`revenue DESC`)
    .limit(10);

  res.json({ overview: overview[0], revenueByDay, topApis });
});