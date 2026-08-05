import { Router } from 'express';
import { productsRouter } from './products.js';
import { balanceRouter } from './balance.js';
import { adminRouter } from './admin/index.js';

export const routes = Router();

routes.use('/v1/products', productsRouter);
routes.use('/v1/balance', balanceRouter);
routes.use('/admin', adminRouter);