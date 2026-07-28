import { Router } from 'express';
import { db } from '../../db/index.js';
import { requestLogs } from '../../db/schema.js';
import { sql } from 'drizzle-orm';

export const logsRouter = Router();

logsRouter.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = (page - 1) * limit;

  const rows = await db.select().from(requestLogs)
    .orderBy(sql`created_at DESC`)
    .limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql`COUNT(*)` }).from(requestLogs);

  res.json({ logs: rows, total: count, page, limit });
});