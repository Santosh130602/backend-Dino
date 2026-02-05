const pool = require("../config/database");

const idempotencyKey = async (req, res, next) => {
  const key = req.headers["x-idempotency-key"];

  if (!key) {
    return res.status(400).json({ error: "Missing X-Idempotency-Key header" });
  }

  try {
    const exists = await pool.query(
      "SELECT 1 FROM ledger WHERE tx_id = $1",
      [key]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({
        error: "Duplicate transaction detected",
      });
    }

    req.txId = key;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = idempotencyKey;
