import { Router } from 'express';
import { productsRouter } from './products.js';
import { balanceRouter } from './balance.js';
import { handlesRouter } from './handles.js';
import { adminRouter } from './admin/index.js';

export const routes = Router();

routes.use('/v1/products', productsRouter);
routes.use('/v1/balance', balanceRouter);
routes.use('/v1/handles', handlesRouter);
routes.use('/admin', adminRouter);