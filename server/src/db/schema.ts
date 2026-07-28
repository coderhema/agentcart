import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const apiProducts = sqliteTable('api_products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price_usdc: real('price_usdc').notNull(),
  provider: text('provider').notNull(),
  endpoint_path: text('endpoint_path').notNull(),
  method: text('method').default('POST'),
  parameters: text('parameters'),
  response_schema: text('response_schema'),
  is_active: integer('is_active').default(1),
  created_at: text('created_at').default('datetime(\'now\')'),
  updated_at: text('updated_at').default('datetime(\'now\')'),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  agent_wallet: text('agent_wallet').notNull(),
  product_id: text('product_id').notNull().references(() => apiProducts.id),
  amount_usdc: real('amount_usdc').notNull(),
  txn_id: text('txn_id'),
  status: text('status').notNull().default('pending'),
  request_data: text('request_data'),
  response_data: text('response_data'),
  ip_address: text('ip_address'),
  created_at: text('created_at').default('datetime(\'now\')'),
  confirmed_at: text('confirmed_at'),
});

export const providerApiKeys = sqliteTable('provider_api_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  provider: text('provider').notNull().unique(),
  api_key: text('api_key').notNull(),
  base_url: text('base_url').notNull(),
  is_active: integer('is_active').default(1),
  created_at: text('created_at').default('datetime(\'now\')'),
});

export const agentWallets = sqliteTable('agent_wallets', {
  wallet_address: text('wallet_address').primaryKey(),
  first_seen: text('first_seen').default('datetime(\'now\')'),
  last_seen: text('last_seen').default('datetime(\'now\')'),
  total_spent: real('total_spent').default(0),
  total_calls: integer('total_calls').default(0),
  is_blocked: integer('is_blocked').default(0),
});

export const requestLogs = sqliteTable('request_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agent_wallet: text('agent_wallet'),
  product_id: text('product_id'),
  status_code: integer('status_code'),
  duration_ms: integer('duration_ms'),
  error_message: text('error_message'),
  created_at: text('created_at').default('datetime(\'now\')'),
});