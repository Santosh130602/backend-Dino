const pool = require("../config/database");

const createSystemWalletTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_wallet (
      id SERIAL PRIMARY KEY,
      asset_id INT UNIQUE REFERENCES asset_types(id) ON DELETE CASCADE,
      balance DECIMAL(14,2) DEFAULT 0 CHECK (balance >= 0),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

module.exports = { createSystemWalletTable };



