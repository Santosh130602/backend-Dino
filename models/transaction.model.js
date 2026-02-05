const pool = require("../config/database");

const createTransactionTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      tx_id UUID UNIQUE NOT NULL,
      user_id INT REFERENCES users(id),
      wallet_id INT REFERENCES wallets(id),
      amount DECIMAL(12,2) NOT NULL,
      type TEXT CHECK (type IN ('TOPUP','BONUS','SPEND','CONVERT')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

module.exports = { createTransactionTable };
