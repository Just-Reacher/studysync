/* ─────────────────────────────────────────────
   StudySync — controllers/taskController.js
───────────────────────────────────────────── */
const { query }        = require('../config/db');
const { asyncHandler } = require('../utils/helpers');

/* ── GET all tasks ── */
const getTasks = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { date, completed, limit = 100, offset = 0 } = req.query;

  let sql    = `SELECT * FROM tasks WHERE user_id = $1`;
  const params = [userId];
  let idx    = 2;

  if (date) {
    sql += ` AND DATE(deadline) = $${idx++}`;
    params.push(date);
  }
  if (completed !== undefined) {
    sql += ` AND completed = $${idx++}`;
    params.push(completed === 'true');
  }

  sql += ` ORDER BY completed ASC, deadline ASC NULLS LAST, created_at DESC`;
  sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(parseInt(limit), parseInt(offset));

  const result = await query(sql, params);
  res.json({ tasks: result.rows });
});

/* ── GET single task ── */
const getTask = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ message: 'Task not found.' });
  res.json(result.rows[0]);
});

/* ── CREATE task ── */
const createTask = asyncHandler(async (req, res) => {
  const { title, description, deadline, priority = 'medium', subject } = req.body;
  const result = await query(
    `INSERT INTO tasks (user_id, title, description, deadline, priority, subject)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, title.trim(), description || null, deadline || null, priority, subject || null]
  );
  res.status(201).json({ task: result.rows[0] });
});

/* ── UPDATE task ── */
const updateTask = asyncHandler(async (req, res) => {
  const exists = await query('SELECT id FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!exists.rows.length) return res.status(404).json({ message: 'Task not found.' });

  const { title, description, deadline, priority, subject, completed } = req.body;
  const result = await query(
    `UPDATE tasks SET
       title       = COALESCE($1, title),
       description = COALESCE($2, description),
       deadline    = COALESCE($3, deadline),
       priority    = COALESCE($4, priority),
       subject     = COALESCE($5, subject),
       completed   = COALESCE($6, completed)
     WHERE id = $7 AND user_id = $8 RETURNING *`,
    [title, description, deadline, priority, subject, completed, req.params.id, req.user.id]
  );
  res.json(result.rows[0]);
});

/* ── PATCH task (partial, e.g. toggle complete) ── */
const patchTask = asyncHandler(async (req, res) => {
  const fields  = [];
  const params  = [];
  let   idx     = 1;

  for (const [key, val] of Object.entries(req.body)) {
    if (['title','description','deadline','priority','subject','completed'].includes(key)) {
      fields.push(`${key} = $${idx++}`);
      params.push(val);
    }
  }
  if (!fields.length) return res.status(400).json({ message: 'Nothing to update.' });

  params.push(req.params.id, req.user.id);
  const result = await query(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx++} RETURNING *`,
    params
  );
  if (!result.rows.length) return res.status(404).json({ message: 'Task not found.' });
  res.json(result.rows[0]);
});

/* ── DELETE task ── */
const deleteTask = asyncHandler(async (req, res) => {
  const result = await query(
    'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ message: 'Task not found.' });
  res.json({ message: 'Task deleted.', id: req.params.id });
});

/* ── DELETE all tasks ── */
const deleteAllTasks = asyncHandler(async (req, res) => {
  await query('DELETE FROM tasks WHERE user_id = $1', [req.user.id]);
  res.json({ message: 'All tasks deleted.' });
});

module.exports = { getTasks, getTask, createTask, updateTask, patchTask, deleteTask, deleteAllTasks };