-------------------------------
-- 1) CREATE EXTENSIONS
-------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-------------------------------
-- 2) CLEAN SLATE (OPTIONAL)
-------------------------------
DROP TABLE IF EXISTS ledger CASCADE;
DROP TABLE IF EXISTS user_task_completions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS system_wallet CASCADE;
DROP TABLE IF EXISTS conversions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS asset_types CASCADE;

-------------------------------
-- 3) ASSET TYPES
-------------------------------
CREATE TABLE asset_types (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO asset_types (name)
VALUES ('Silver'), ('Gold'), ('Diamond')
ON CONFLICT (name) DO NOTHING;

-------------------------------
-- 4) USERS TABLE
-------------------------------
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin user (password = admin123)
INSERT INTO users (name, email, phone, password, role)
VALUES
(
  'Admin',
  'admin@example.com',
  '9999999999',
  '$2b$10$VtqXJ1Z8fM5HkVZ2cZyH5eGmL3G5dQZtFQJ3g7Z7z0uY7bQ3g3JdW',
  'admin'
);

-- Two normal users (password = user123)
INSERT INTO users (name, email, phone, password, role)
VALUES
(
  'User One',
  'user1@example.com',
  '8888888888',
  '$2b$10$VtqXJ1Z8fM5HkVZ2cZyH5eGmL3G5dQZtFQJ3g7Z7z0uY7bQ3g3JdW',
  'user'
),
(
  'User Two',
  'user2@example.com',
  '7777777777',
  '$2b$10$VtqXJ1Z8fM5HkVZ2cZyH5eGmL3G5dQZtFQJ3g7Z7z0uY7bQ3g3JdW',
  'user'
);

-------------------------------
-- 5) USER WALLETS
-------------------------------
CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  asset_id INT REFERENCES asset_types(id),
  balance DECIMAL(12,2) DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, asset_id)
);

-- Give every user 3 wallets
INSERT INTO wallets (user_id, asset_id, balance)
SELECT u.id, a.id,
  CASE 
    WHEN a.name = 'Gold' THEN 100   -- initial gold
    ELSE 0
  END
FROM users u
CROSS JOIN asset_types a;

-------------------------------
-- 6) SYSTEM TREASURY WALLET
-------------------------------
CREATE TABLE system_wallet (
  id SERIAL PRIMARY KEY,
  asset_id INT UNIQUE REFERENCES asset_types(id) ON DELETE CASCADE,
  balance DECIMAL(14,2) DEFAULT 1000000 CHECK (balance >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- One treasury wallet per asset
INSERT INTO system_wallet (asset_id, balance)
SELECT id, 1000000 FROM asset_types
ON CONFLICT (asset_id) DO NOTHING;

-------------------------------
-- 7) TASKS (reward in SILVER)
-------------------------------
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reward_silver DECIMAL(12,2) NOT NULL CHECK (reward_silver >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tasks (title, description, reward_silver)
VALUES
('Complete Level 1', 'Finish first game level', 20),
('Daily Login', 'Login to app today', 10),
('Invite Friend', 'Invite a friend to platform', 50);

-------------------------------
-- 8) USER TASK COMPLETIONS
-------------------------------
CREATE TABLE user_task_completions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, task_id)
);

-------------------------------
-- 9) ITEMS (priced in GOLD)
-------------------------------
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('classic','legend','mythic')),
  price_gold DECIMAL(12,2) NOT NULL CHECK (price_gold > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO items (name, category, price_gold)
VALUES
('Classic Sword', 'classic', 30),
('Legend Shield', 'legend', 60),
('Mythic Dragon', 'mythic', 120);

-------------------------------
-- 10) CONVERSION RATES
-------------------------------
CREATE TABLE conversions (
  from_asset INT REFERENCES asset_types(id) ON DELETE CASCADE,
  to_asset INT REFERENCES asset_types(id) ON DELETE CASCADE,
  rate INT NOT NULL CHECK (rate > 0),
  PRIMARY KEY (from_asset, to_asset)
);

-- 50 Silver = 1 Gold
INSERT INTO conversions (from_asset, to_asset, rate)
SELECT a1.id, a2.id, 50
FROM asset_types a1, asset_types a2
WHERE a1.name='Silver' AND a2.name='Gold';

-- 50 Gold = 1 Diamond
INSERT INTO conversions (from_asset, to_asset, rate)
SELECT a1.id, a2.id, 50
FROM asset_types a1, asset_types a2
WHERE a1.name='Gold' AND a2.name='Diamond';

-------------------------------
-- 11) LEDGER (DOUBLE-ENTRY AUDIT)
-------------------------------
CREATE TABLE ledger (
  id SERIAL PRIMARY KEY,
  tx_id UUID DEFAULT gen_random_uuid(),
  from_wallet INT,
  to_wallet INT,
  asset_id INT REFERENCES asset_types(id),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  type TEXT CHECK (type IN ('TOPUP','BONUS','SPEND','CONVERT')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-------------------------------
-- 12) IDEMPOTENCY KEYS (IMPORTANT FOR RETRIES)
-------------------------------
CREATE TABLE idempotency_keys (
  key UUID PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-------------------------------
-- 13) FINAL CHECK
-------------------------------
SELECT 'SEEDING COMPLETED SUCCESSFULLY' AS status;
