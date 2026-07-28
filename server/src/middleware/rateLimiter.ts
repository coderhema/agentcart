import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const wallet = req.headers['x402-wallet'] as string;
  if (wallet) {
    logger.debug(`Request from wallet ${wallet.slice(0, 8)}...`);
  }
  next();
}