



const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");

// Helper: get Treasury wallet ID dynamically

const getTreasuryId = async (client, assetId) => {
  const res = await client.query(
    "SELECT id FROM system_wallet WHERE asset_id = $1 LIMIT 1",
    [assetId]
  );

  if (res.rows.length === 0) {
    throw new Error("Treasury wallet not configured for this asset");
  }

  return res.rows[0].id;
};





// GET BALANCE

const getBalance = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
         w.balance,
         a.name AS asset_name
       FROM wallets w
       JOIN asset_types a 
         ON w.asset_id = a.id
       WHERE w.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No wallets found for this user"
      });
    }

    // Default structure (even if some wallets are missing)
    const balances = {
      silver: 0,
      gold: 0,
      diamond: 0
    };

    // Fill actual values from DB
    result.rows.forEach(row => {
      const name = row.asset_name.toLowerCase();

      if (name === "silver") balances.silver = Number(row.balance);
      if (name === "gold") balances.gold = Number(row.balance);
      if (name === "diamond") balances.diamond = Number(row.balance);
    });

    res.json({
      user_id: Number(userId),
      balances
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET ASSETS WISE BALANCE
const getAssetBalance = async (req, res) => {
  const { userId, assetId } = req.params;

  try {
    const result = await pool.query(
      `SELECT balance 
       FROM wallets 
       WHERE user_id = $1 AND asset_id = $2`,
      [userId, assetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.json({ balance: result.rows[0].balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




// TOP-UP
const topUpWallet = async (req, res) => {
  const { userId, assetId} = req.params;
  const {amount } = req.body;
  const txId = uuidv4();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const treasuryId = await getTreasuryId(client, assetId);

    await client.query(
      `SELECT balance FROM wallets 
       WHERE user_id = $1 AND asset_id = $2 
       FOR UPDATE`,
      [userId, assetId]
    );

    await client.query(
      `UPDATE wallets 
       SET balance = balance + $1
       WHERE user_id = $2 AND asset_id = $3`,
      [amount, userId, assetId]
    );

    await client.query(
      `UPDATE system_wallet 
       SET balance = balance - $1
       WHERE id = $2`,
      [amount, treasuryId]
    );

    await client.query(
      `INSERT INTO ledger 
       (tx_id, from_wallet, to_wallet, asset_id, amount, type)
       VALUES ($1, $2, $3, $4, $5, 'TOPUP')`,
      [txId, treasuryId, userId, assetId, amount]
    );

    await client.query("COMMIT");
    res.json({ message: "Top-up successful", txId });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};



// BONUS (manual bonus if needed)

const giveBonus = async (req, res) => {
  const { userId, assetId } = req.params;
  const {amount, reason } = req.body;
  const txId = uuidv4();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const treasuryId = await getTreasuryId(client, assetId);

    await client.query(
      `SELECT balance FROM wallets 
       WHERE user_id = $1 AND asset_id = $2 
       FOR UPDATE`,
      [userId, assetId]
    );

    await client.query(
      `UPDATE wallets 
       SET balance = balance + $1
       WHERE user_id = $2 AND asset_id = $3`,
      [amount, userId, assetId]
    );

    await client.query(
      `UPDATE system_wallet 
       SET balance = balance - $1
       WHERE id = $2`,
      [amount, treasuryId]
    );

    await client.query(
      `INSERT INTO ledger 
       (tx_id, from_wallet, to_wallet, asset_id, amount, type)
       VALUES ($1, $2, $3, $4, $5, 'BONUS')`,
      [txId, treasuryId, userId, assetId, amount]
    );

    await client.query("COMMIT");
    res.json({ message: `Bonus credited: ${reason}`, txId });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

// SPEND (Buy item using GOLD)
const spendWallet = async (req, res) => {
  const userId = Number(req.params.userId);   
  const itemId = Number(req.params.itemId);   
  const txId = uuidv4();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const itemRes = await client.query(
      "SELECT price_gold FROM items WHERE id = $1",
      [itemId]
    );

    if (itemRes.rows.length === 0) {
      throw new Error("Item not found");
    }

    const price = Number(itemRes.rows[0].price_gold); 

    const assetRes = await client.query(
      "SELECT id FROM asset_types WHERE LOWER(name) = 'gold'"
    );

    if (assetRes.rows.length === 0) {
      throw new Error("Gold asset is not configured");
    }

    const goldAssetId = Number(assetRes.rows[0].id);
    const treasuryId = await getTreasuryId(client, goldAssetId);

    const balRes = await client.query(
      `SELECT balance 
       FROM wallets 
       WHERE user_id = $1 AND asset_id = $2 
       FOR UPDATE`,
      [userId, goldAssetId]
    );

    if (balRes.rows.length === 0) {
      throw new Error(
        `User wallet not found for user=${userId}, asset=${goldAssetId}`
      );
    }

    const userBalance = Number(balRes.rows[0].balance); 

    if (userBalance < price) {
      throw new Error(
        `Insufficient Gold: have ${userBalance}, need ${price}`
      );
    }

    await client.query(
      "SELECT balance FROM system_wallet WHERE id = $1 FOR UPDATE",
      [treasuryId]
    );

    await client.query(
      `UPDATE wallets 
       SET balance = balance - $1
       WHERE user_id = $2 AND asset_id = $3`,
      [price, userId, goldAssetId]
    );

    await client.query(
      `UPDATE system_wallet 
       SET balance = balance + $1
       WHERE id = $2`,
      [price, treasuryId]
    );

    await client.query(
      `INSERT INTO ledger 
       (tx_id, from_wallet, to_wallet, asset_id, amount, type)
       VALUES ($1, $2, $3, $4, $5, 'SPEND')`,
      [txId, userId, treasuryId, goldAssetId, price]
    );

    await client.query("COMMIT");

    res.json({
      message: "Item purchased successfully",
      itemId,
      price,
      txId
    });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};


// CONVERT SILVER → GOLD
const convertSilverToGold = async (req, res) => {

  const {userId, silverAmount } = req.body;
  const txId = uuidv4();

  if (silverAmount % 50 !== 0) {
    return res.status(400).json({
      error: "Silver amount must be multiple of 50"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const assets = await client.query(
      "SELECT id, name FROM asset_types WHERE name IN ('Silver','Gold')"
    );

    const silverId = assets.rows.find(a => a.name === "Silver").id;
    const goldId = assets.rows.find(a => a.name === "Gold").id;
    const goldToAdd = silverAmount / 50;

    const balRes = await client.query(
      `SELECT balance FROM wallets 
       WHERE user_id = $1 AND asset_id = $2 
       FOR UPDATE`,
      [userId, silverId]
    );

    if (balRes.rows.length === 0 || balRes.rows[0].balance < silverAmount) {
      throw new Error("Insufficient Silver");
    }

    await client.query(
      `UPDATE wallets 
       SET balance = balance - $1
       WHERE user_id = $2 AND asset_id = $3`,
      [silverAmount, userId, silverId]
    );

    await client.query(
      `UPDATE wallets 
       SET balance = balance + $1
       WHERE user_id = $2 AND asset_id = $3`,
      [goldToAdd, userId, goldId]
    );

    await client.query(
      `INSERT INTO ledger 
       (tx_id, from_wallet, to_wallet, asset_id, amount, type)
       VALUES ($1, $2, $3, $4, $5, 'CONVERT')`,
      [txId, userId, userId, goldId, goldToAdd]
    );

    await client.query("COMMIT");
    res.json({ message: "Silver → Gold converted", goldReceived: goldToAdd, txId });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};




// CONVERT GOLD → DIAMOND
const convertGoldToDiamond = async (req, res) => {
  const {userId, goldAmount } = req.body;
  const txId = uuidv4();

  if (goldAmount % 50 !== 0) {
    return res.status(400).json({
      error: "Gold amount must be multiple of 50"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const assets = await client.query(
      "SELECT id, name FROM asset_types WHERE name IN ('Gold','Diamond')"
    );

    const goldId = assets.rows.find(a => a.name === "Gold").id;
    const diamondId = assets.rows.find(a => a.name === "Diamond").id;
    const diamondToAdd = goldAmount / 50;

    const balRes = await client.query(
      `SELECT balance FROM wallets 
       WHERE user_id = $1 AND asset_id = $2 
       FOR UPDATE`,
      [userId, goldId]
    );

    if (balRes.rows.length === 0 || balRes.rows[0].balance < goldAmount) {
      throw new Error("Insufficient Gold");
    }

    await client.query(
      `UPDATE wallets 
       SET balance = balance - $1
       WHERE user_id = $2 AND asset_id = $3`,
      [goldAmount, userId, goldId]
    );

    await client.query(
      `UPDATE wallets 
       SET balance = balance + $1
       WHERE user_id = $2 AND asset_id = $3`,
      [diamondToAdd, userId, diamondId]
    );

    await client.query(
      `INSERT INTO ledger 
       (tx_id, from_wallet, to_wallet, asset_id, amount, type)
       VALUES ($1, $2, $3, $4, $5, 'CONVERT')`,
      [txId, userId, userId, diamondId, diamondToAdd]
    );

    await client.query("COMMIT");
    res.json({
      message: "Gold → Diamond converted",
      diamondsReceived: diamondToAdd,
      txId
    });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

module.exports = {
  getBalance,
  getAssetBalance,
  topUpWallet,
  giveBonus,
  spendWallet,
  convertSilverToGold,
  convertGoldToDiamond
};




