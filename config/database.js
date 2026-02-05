// const { Pool } = require("pg")
// require("dotenv").config()

// const pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//      ssl: { rejectUnauthorized: false } 
// });
// pool.connect()
//     .then(() => console.log("Connected to PostgreSQL"))
//     .catch((err) => console.error("DB Connection Error:", err))

// module.exports = pool



const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT 1")
  .then(() => console.log("✅ Connected to Supabase PostgreSQL"))
  .catch((err) => console.error("DB Connection Error:", err));

module.exports = pool;
