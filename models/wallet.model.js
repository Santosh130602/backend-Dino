const pool = require("../config/database");

const createWalletTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wallets (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      asset_id INT REFERENCES asset_types(id),
      balance DECIMAL(12,2) DEFAULT 0 CHECK (balance >= 0),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, asset_id)
    );
  `);
};

module.exports = { createWalletTable };
