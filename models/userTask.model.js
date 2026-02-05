const pool = require("../config/database");

const createUserTaskTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_task_completions (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id),
      task_id INT REFERENCES tasks(id),
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, task_id)
    );
  `);
};

module.exports = { createUserTaskTable };
