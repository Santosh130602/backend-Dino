const pool = require("../config/database");

const createLedgerTable = async () => {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ledger (
      id SERIAL PRIMARY KEY,
      tx_id UUID DEFAULT gen_random_uuid() UNIQUE,
      from_wallet INT REFERENCES wallets(id),
      to_wallet INT REFERENCES wallets(id),
      asset_id INT REFERENCES asset_types(id),
      amount DECIMAL(12,2) NOT NULL,
      type TEXT CHECK (type IN ('TOPUP','BONUS','SPEND','CONVERT')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

module.exports = { createLedgerTable };
