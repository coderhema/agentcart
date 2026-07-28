import { Router } from 'express';
import { db } from '../../db/index.js';
import { apiProducts } from '../../db/schema.js';

export const productsAdminRouter = Router();

productsAdminRouter.get('/', async (req, res) => {
  const products = await db.select().from(apiProducts).orderBy(apiProducts.name);
  res.json({ products });
});

productsAdminRouter.post('/', async (req, res) => {
  const product = await db.insert(apiProducts).values(req.body).returning();
  res.status(201).json(product[0]);
});

productsAdminRouter.put('/:id', async (req, res) => {
  const product = await db.update(apiProducts)
    .set({ ...req.body, updated_at: new Date().toISOString() })
    .where({ id: req.params.id }).returning();
  res.json(product[0]);
});

productsAdminRouter.delete('/:id', async (req, res) => {
  await db.update(apiProducts).set({ is_active: 0, updated_at: new Date().toISOString() })
    .where({ id: req.params.id });
  res.json({ success: true });
});