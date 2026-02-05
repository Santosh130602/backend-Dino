const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");



const completeTask = async (req, res) => {
  const userId = req.user.id;
  const { taskId } = req.body;
  const txId = uuidv4();

  if (!userId || !taskId) {
    return res.status(400).json({
      error: "userId and taskId are required",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const taskRes = await client.query(
      "SELECT id, reward_silver FROM tasks WHERE id = $1",
      [taskId]
    );

    if (taskRes.rows.length === 0) {
      throw new Error("Task not found");
    }

    const { reward_silver } = taskRes.rows[0];

    // 2️⃣ Check if user already completed this task
    const checkCompletion = await client.query(
      "SELECT id FROM user_task_completions WHERE user_id = $1 AND task_id = $2",
      [userId, taskId]
    );

    if (checkCompletion.rows.length > 0) {
      throw new Error("Task already completed");
    }

    // 3️⃣ Mark task as completed
    await client.query(
      `INSERT INTO user_task_completions (user_id, task_id)
       VALUES ($1, $2)`,
      [userId, taskId]
    );

    // 4️⃣ Get Silver asset ID
    const assetRes = await client.query(
      "SELECT id FROM asset_types WHERE name = 'Silver'"
    );

    if (assetRes.rows.length === 0) {
      throw new Error("Silver asset is not configured");
    }

    const silverAssetId = assetRes.rows[0].id;

    // 5️⃣ Get Treasury wallet for Silver
    const sysRes = await client.query(
      "SELECT id FROM system_wallet WHERE asset_id = $1 LIMIT 1",
      [silverAssetId]
    );

    if (sysRes.rows.length === 0) {
      throw new Error("Treasury wallet for Silver not configured");
    }

    const treasuryId = sysRes.rows[0].id;

    // 6️⃣ Lock user's silver wallet row to avoid race conditions
    const balRes = await client.query(
      `SELECT balance 
       FROM wallets 
       WHERE user_id = $1 AND asset_id = $2 
       FOR UPDATE`,
      [userId, silverAssetId]
    );

    if (balRes.rows.length === 0) {
      throw new Error("User silver wallet not found");
    }

    // 7️⃣ Credit user's Silver wallet
    await client.query(
      `UPDATE wallets 
       SET balance = balance + $1
       WHERE user_id = $2 AND asset_id = $3`,
      [reward_silver, userId, silverAssetId]
    );

    // 8️⃣ Debit treasury Silver wallet
    await client.query(
      `UPDATE system_wallet 
       SET balance = balance - $1
       WHERE id = $2`,
      [reward_silver, treasuryId]
    );

    // 9️⃣ Create ledger entry (audit trail)
    await client.query(
      `INSERT INTO ledger 
       (tx_id, from_wallet, to_wallet, asset_id, amount, type)
       VALUES ($1, $2, $3, $4, $5, 'BONUS')`,
      [txId, treasuryId, userId, silverAssetId, reward_silver]
    );

    await client.query("COMMIT");

    res.json({
      message: "Task completed successfully",
      reward_silver,
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
  completeTask,
};
