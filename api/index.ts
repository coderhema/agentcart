import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const DASHBOARD_PASSPHRASE = process.env.DASHBOARD_PASSPHRASE || 'agentcart-admin';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only handle /api/admin/login
  if (req.url === '/api/admin/login' && req.method === 'POST') {
    const { passphrase } = req.body;
    
    if (passphrase !== DASHBOARD_PASSPHRASE) {
      return res.status(401).json({ error: 'Invalid passphrase' });
    }

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }

  // Return 404 for other routes
  return res.status(404).json({ error: 'Not found' });
}
