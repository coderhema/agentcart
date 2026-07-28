import { Router } from 'express';
import { transactionsRouter } from './transactions.js';
import { productsAdminRouter } from './products.js';
import { agentsRouter } from './agents.js';
import { statsRouter } from './stats.js';
import { logsRouter } from './logs.js';
import { authMiddleware, loginHandler } from '../../middleware/auth.js';

export const adminRouter = Router();

adminRouter.post('/login', loginHandler);
adminRouter.use(authMiddleware);
adminRouter.use('/transactions', transactionsRouter);
adminRouter.use('/products', productsAdminRouter);
adminRouter.use('/agents', agentsRouter);
adminRouter.use('/stats', statsRouter);
adminRouter.use('/logs', logsRouter);