import Database from 'better-sqlite3';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const sql = `
CREATE TABLE IF NOT EXISTS api_products (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  price_usdc    REAL NOT NULL,
  provider      TEXT NOT NULL,
  endpoint_path TEXT NOT NULL,
  method        TEXT DEFAULT 'POST',
  parameters    TEXT,
  response_schema TEXT,
  is_active     INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id              TEXT PRIMARY KEY,
  agent_wallet    TEXT NOT NULL,
  product_id      TEXT NOT NULL,
  amount_usdc     REAL NOT NULL,
  txn_id          TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  request_data    TEXT,
  response_data   TEXT,
  ip_address      TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  confirmed_at    TEXT,
  FOREIGN KEY (product_id) REFERENCES api_products(id)
);

CREATE INDEX IF NOT EXISTS idx_txn_agent ON transactions(agent_wallet);
CREATE INDEX IF NOT EXISTS idx_txn_product ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_txn_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_txn_created ON transactions(created_at);

CREATE TABLE IF NOT EXISTS provider_api_keys (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  provider      TEXT NOT NULL UNIQUE,
  api_key       TEXT NOT NULL,
  base_url      TEXT NOT NULL,
  is_active     INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_wallets (
  wallet_address  TEXT PRIMARY KEY,
  first_seen      TEXT DEFAULT (datetime('now')),
  last_seen       TEXT DEFAULT (datetime('now')),
  total_spent     REAL DEFAULT 0,
  total_calls     INTEGER DEFAULT 0,
  is_blocked      INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS request_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_wallet    TEXT,
  product_id      TEXT,
  status_code     INTEGER,
  duration_ms     INTEGER,
  error_message   TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_handles (
  handle              TEXT PRIMARY KEY,
  wallet_address      TEXT NOT NULL UNIQUE,
  display_name        TEXT,
  bio                 TEXT,
  avatar_url          TEXT,
  spending_limit_usdc REAL DEFAULT 0,
  is_active           INTEGER DEFAULT 1,
  created_at          TEXT DEFAULT (datetime('now')),
  updated_at          TEXT DEFAULT (datetime('now'))
);
`;

const db = new Database(config.database.url);
db.exec(sql);
logger.info('Database migrations complete');
db.close();