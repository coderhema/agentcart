import Database from 'better-sqlite3';
import { config } from '../src/config.ts';
import { logger } from '../src/utils/logger.ts';

const products = [
  {
    id: 'linkedin-profile',
    name: 'LinkedIn Profile Data',
    description: 'Get public LinkedIn profile data including name, headline, experience, education',
    price_usdc: 0.05,
    provider: 'linkedin',
    endpoint_path: '/proxy/linkedin/profile',
    method: 'POST',
    parameters: JSON.stringify({
      type: 'object',
      properties: { url: { type: 'string', description: 'LinkedIn profile URL' } },
      required: ['url'],
    }),
  },
  {
    id: 'twitter-search',
    name: 'Twitter/X Search',
    description: 'Search recent tweets by query or user',
    price_usdc: 0.03,
    provider: 'twitter',
    endpoint_path: '/proxy/twitter/search',
    method: 'POST',
    parameters: JSON.stringify({
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        count: { type: 'number', description: 'Number of results (max 20)' },
      },
      required: ['query'],
    }),
  },
  {
    id: 'weather-current',
    name: 'Weather Data',
    description: 'Current weather, temperature, humidity, wind for a given city',
    price_usdc: 0.01,
    provider: 'weather',
    endpoint_path: '/proxy/weather/current',
    method: 'POST',
    parameters: JSON.stringify({
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name' },
        units: { type: 'string', description: 'metric or imperial' },
      },
      required: ['city'],
    }),
  },
  {
    id: 'email-verify',
    name: 'Email Verification',
    description: 'Verify if an email address is valid and deliverable',
    price_usdc: 0.02,
    provider: 'email',
    endpoint_path: '/proxy/email/verify',
    method: 'POST',
    parameters: JSON.stringify({
      type: 'object',
      properties: { email: { type: 'string', description: 'Email address to verify' } },
      required: ['email'],
    }),
  },
  {
    id: 'browser-action',
    name: 'Browser Action',
    description: 'Real browser automation: open a page, snapshot elements, click, fill forms, or extract data from any public website',
    price_usdc: 0.02,
    provider: 'browser',
    endpoint_path: '/proxy/browser/action',
    method: 'POST',
    parameters: JSON.stringify({
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['open', 'snapshot', 'click', 'fill', 'extract', 'screenshot', 'close'],
          description: 'Browser action to execute',
        },
        params: { type: 'object', description: 'Action-specific parameters' },
      },
      required: ['action'],
    }),
  },
];

const db = new Database(config.database.url);
const insert = db.prepare(`
  INSERT OR REPLACE INTO api_products (id, name, description, price_usdc, provider, endpoint_path, method, parameters)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const p of products) {
  insert.run(p.id, p.name, p.description, p.price_usdc, p.provider, p.endpoint_path, p.method, p.parameters);
}

logger.info(`Seeded ${products.length} products`);
db.close();