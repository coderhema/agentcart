import { Router } from 'express';
import { db } from '../db/index.js';
import { apiProducts } from '../db/schema.js';
import { logger } from '../utils/logger.js';

export const productsRouter = Router();

productsRouter.get('/', async (req, res) => {
  try {
    const products = await db.select().from(apiProducts).where({ is_active: 1 });
    res.json({ products });
  } catch (error) {
    logger.error('Failed to fetch products', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});