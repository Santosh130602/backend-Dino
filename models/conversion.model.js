const pool = require("../config/database");

const createConversionTable = async () => {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS conversions (
      id SERIAL PRIMARY KEY,
      from_asset INT REFERENCES asset_types(id),
      to_asset INT REFERENCES asset_types(id),
      rate NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(from_asset, to_asset)
    );
  `);
};

module.exports = { createConversionTable };
