const pool = require("../config/database");


// CREATE A NEW TASK 

const createTask = async (req, res) => {
  const { title, description, reward_silver } = req.body;

  if (!title || !reward_silver) {
    return res.status(400).json({
      error: "Title and reward_silver are required",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, reward_silver)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, description, reward_silver]
    );

    res.status(201).json({
      message: "Task created successfully",
      task: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// CREATE BULK TASK

const createBulkTasks = async (req, res) => {
  const { tasks } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Please provide an array of tasks"
    });
  }

  for (let task of tasks) {
    if (!task.title || !task.reward_silver) {
      return res.status(400).json({
        error: "Each task must have title and reward_silver"
      });
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const values = [];
    const placeholders = [];

    tasks.forEach((task, i) => {
      placeholders.push(`($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`);
      values.push(
        task.title,
        task.description || null,
        task.reward_silver
      );
    });

    const insertQuery = `
      INSERT INTO tasks (title, description, reward_silver)
      VALUES ${placeholders.join(", ")}
      RETURNING id, title, reward_silver;
    `;

    const result = await client.query(insertQuery, values);

    await client.query("COMMIT");

    res.status(201).json({
      message: `${result.rows.length} tasks created successfully`,
      total: result.rows.length,
      tasks: result.rows
    });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};



// GET ALL TASKS

const getAllTasks = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks ORDER BY created_at DESC"
    );

    res.json({ tasks: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};





// DELETE A TASK (Admin only)

const deleteTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({
      message: "Task deleted successfully",
      deletedTask: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// CREATE IN-GAME ITEM (Admin only)

const createItem = async (req, res) => {
  const { name, category, price_gold } = req.body;

  if (!name || !category || !price_gold) {
    return res.status(400).json({
      error: "name, category, and price_gold are required",
    });
  }


  const validCategories = ["classic", "legend", "mythic"];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      error: "Invalid category. Must be classic, legend, or mythic",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO items (name, category, price_gold)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, category, price_gold]
    );

    res.status(201).json({
      message: "Item created successfully",
      item: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




// CREATE BULK ITEMS

const createBulkItems = async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: "Please provide an array of items"
    });
  }

  const validCategories = ["classic", "legend", "mythic"];

  for (let item of items) {
    if (!item.name || !item.category || !item.price_gold) {
      return res.status(400).json({
        error: "Each item must have name, category, and price_gold"
      });
    }

    if (!validCategories.includes(item.category)) {
      return res.status(400).json({
        error: `Invalid category for item: ${item.name}. Must be classic, legend, or mythic`
      });
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const values = [];
    const placeholders = [];

    items.forEach((item, i) => {
      placeholders.push(`($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`);
      values.push(item.name, item.category, item.price_gold);
    });

    const insertQuery = `
      INSERT INTO items (name, category, price_gold)
      VALUES ${placeholders.join(", ")}
      RETURNING id, name, category, price_gold;
    `;

    const result = await client.query(insertQuery, values);

    await client.query("COMMIT");

    res.status(201).json({
      message: `${result.rows.length} items created successfully`,
      total: result.rows.length,
      items: result.rows
    });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};


// GET ALL ITEMS

const getAllItems = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM items ORDER BY created_at DESC"
    );

    res.json({ items: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE ITEM (Admin only)

const deleteItem = async (req, res) => {
  const { itemId } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM items WHERE id = $1 RETURNING *",
      [itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({
      message: "Item deleted successfully",
      deletedItem: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};







//  UPDATE CONVERSION RATES 

const setConversionRates = async (req, res) => {
  const { silverToGold, goldToDiamond } = req.body;

  if (!silverToGold || !goldToDiamond) {
    return res.status(400).json({
      error: "Both silverToGold and goldToDiamond are required",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const assets = await client.query(
      "SELECT id, name FROM asset_types WHERE name IN ('Silver','Gold','Diamond')"
    );

    const silver = assets.rows.find(a => a.name === "Silver")?.id;
    const gold = assets.rows.find(a => a.name === "Gold")?.id;
    const diamond = assets.rows.find(a => a.name === "Diamond")?.id;

    if (!silver || !gold || !diamond) {
      throw new Error("Assets not seeded correctly");
    }

    // Upsert conversion rates
    await client.query(
      `INSERT INTO conversions (from_asset, to_asset, rate)
       VALUES ($1, $2, $3)
       ON CONFLICT (from_asset, to_asset)
       DO UPDATE SET rate = $3`,
      [silver, gold, silverToGold]
    );

    await client.query(
      `INSERT INTO conversions (from_asset, to_asset, rate)
       VALUES ($1, $2, $3)
       ON CONFLICT (from_asset, to_asset)
       DO UPDATE SET rate = $3`,
      [gold, diamond, goldToDiamond]
    );

    await client.query("COMMIT");

    res.json({
      message: "Conversion rates updated",
      rates: {
        silverToGold,
        goldToDiamond,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

module.exports = {
  createTask,
  createBulkTasks ,
  getAllTasks,
  deleteTask,
  createItem,
  createBulkItems,
  getAllItems,
  deleteItem,
  setConversionRates,
};
