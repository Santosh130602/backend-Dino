const { Pool } = require("pg")
require("dotenv").config()

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
pool.connect()
    .then(() => console.log("Connected to PostgreSQL"))
    .catch((err) => console.error("DB Connection Error:", err))

module.exports = pool


// const { Pool } = require("pg");

// const pool = new Pool({
//   host: process.env.DB_HOST || "localhost",
//   port: process.env.DB_PORT || 5432,
//   database: process.env.DB_NAME || "wallet_db",
//   user: process.env.DB_USER || "wallet_user",
//   password: process.env.DB_PASSWORD || "wallet_pass",
//   ssl: false
// });

// pool.on("connect", () => console.log("✅ Connected to PostgreSQL"));

// module.exports = pool;