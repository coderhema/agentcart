import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    jwt.verify(token, config.dashboard.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function loginHandler(req: Request, res: Response) {
  const { passphrase } = req.body;
  if (passphrase !== config.dashboard.passphrase) {
    return res.status(401).json({ error: 'Invalid passphrase' });
  }

  const token = jwt.sign({ role: 'admin' }, config.dashboard.jwtSecret, { expiresIn: '24h' });
  res.json({ token });
}