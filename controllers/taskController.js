const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

async function create(req, res) {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const result = await pool.query(
    `INSERT INTO tasks (title, is_completed, user_id)
     VALUES ($1, $2, $3)
     RETURNING id, title, is_completed`,
    [value.title, value.isCompleted, global.user_id],
  );

  const newTask = result.rows[0];

  return res.status(201).json(newTask);
}
async function index(req, res) {
  const result = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
    [global.user_id],
  );

  const userTasks = result.rows;

  if (userTasks.length === 0) {
    return res.status(404).json({
      message: "No tasks found.",
    });
  }

  return res.status(200).json(userTasks);
}

async function show(req, res) {
  const taskId = parseInt(req.params?.id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  const result = await pool.query(
    `SELECT id, title, is_completed
     FROM tasks
     WHERE id = $1 AND user_id = $2`,
    [taskId, global.user_id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      message: "Task not found.",
    });
  }

  return res.status(200).json(result.rows[0]);
}

async function update(req, res) {
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const taskChange = value;

  const keys = Object.keys(taskChange).map((key) =>
    key === "isCompleted" ? "is_completed" : key,
  );

  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");

  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;

  const result = await pool.query(
    `UPDATE tasks SET ${setClauses}
   WHERE id = ${idParm} AND user_id = ${userParm}
   RETURNING id, title, is_completed`,
    [...Object.values(taskChange), req.params.id, global.user_id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      message: "Task not found.",
    });
  }

  return res.status(200).json(result.rows[0]);
}

async function deleteTask(req, res) {
  const result = await pool.query(
    "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id",
    [req.params.id, global.user_id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      message: "Task not found.",
    });
  }

  return res.status(200).json({
    message: "Task deleted successfully.",
  });
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
};
