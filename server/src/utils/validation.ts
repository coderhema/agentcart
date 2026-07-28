import { z } from 'zod';

export const proxyRequestSchema = z.object({
  url: z.string().url().optional(),
  query: z.string().optional(),
  city: z.string().optional(),
  email: z.string().email().optional(),
  count: z.number().int().max(20).optional(),
  units: z.enum(['metric', 'imperial']).optional(),
});

export const loginSchema = z.object({
  passphrase: z.string().min(1),
});

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price_usdc: z.number().positive(),
  provider: z.string().min(1),
  endpoint_path: z.string().min(1),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('POST'),
  parameters: z.string().optional(),
});