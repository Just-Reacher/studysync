/* ─────────────────────────────────────────────
   StudySync — controllers/reminderController.js
───────────────────────────────────────────── */
const { query }        = require('../config/db');
const { asyncHandler } = require('../utils/helpers');

const getReminders = async (req, res) => {
  try {
    const { date, type } = req.query;

    let sql = 'SELECT * FROM reminders WHERE user_id = $1';
    const params = [req.user.id];
    let idx = 2;

    if (type) {
      sql += ` AND type = $${idx++}`;
      params.push(type);
    }

    if (date) {
      sql += ` AND (
        repeat = 'daily'
        OR (repeat = 'once' AND date = $${idx})
        OR (repeat = 'weekdays' AND EXTRACT(DOW FROM $${idx}::date) BETWEEN 1 AND 5)
        OR (repeat = 'weekends' AND EXTRACT(DOW FROM $${idx}::date) IN (0,6))
      )`;

      params.push(date);
      idx++;
    }

    sql += ' ORDER BY time::time ASC';

    const result = await query(sql, params);

    res.json({ reminders: result.rows });

  } catch (err) {
    console.error("🔥 Reminder error:", err);
    res.status(500).json({ error: err.message });
  }
};

const getReminder = asyncHandler(async (req, res) => {
  const r = await query('SELECT * FROM reminders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!r.rows.length) return res.status(404).json({ message: 'Reminder not found.' });
  res.json(r.rows[0]);
});

const createReminder = asyncHandler(async (req, res) => {
  const { title, type = 'custom', time, repeat = 'daily', date, note, active = true } = req.body;
  const r = await query(
    `INSERT INTO reminders (user_id, title, type, time, repeat, date, note, active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.id, title.trim(), type, time, repeat, date || null, note || null, active]
  );
  res.status(201).json({ reminder: r.rows[0] });
});

const updateReminder = asyncHandler(async (req, res) => {
  const exists = await query('SELECT id FROM reminders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!exists.rows.length) return res.status(404).json({ message: 'Reminder not found.' });

  const { title, type, time, repeat, date, note, active } = req.body;
  const r = await query(
    `UPDATE reminders SET
       title  = COALESCE($1, title),
       type   = COALESCE($2, type),
       time   = COALESCE($3, time),
       repeat = COALESCE($4, repeat),
       date   = COALESCE($5, date),
       note   = COALESCE($6, note),
       active = COALESCE($7, active)
     WHERE id = $8 AND user_id = $9 RETURNING *`,
    [title, type, time, repeat, date, note, active, req.params.id, req.user.id]
  );
  res.json(r.rows[0]);
});

const patchReminder = asyncHandler(async (req, res) => {
  const fields = []; const params = []; let idx = 1;
  for (const [k, v] of Object.entries(req.body)) {
    if (['title','type','time','repeat','date','note','active'].includes(k)) {
      fields.push(`${k} = $${idx++}`); params.push(v);
    }
  }
  if (!fields.length) return res.status(400).json({ message: 'Nothing to update.' });
  params.push(req.params.id, req.user.id);
  const r = await query(
    `UPDATE reminders SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx++} RETURNING *`,
    params
  );
  if (!r.rows.length) return res.status(404).json({ message: 'Reminder not found.' });
  res.json(r.rows[0]);
});

const deleteReminder = asyncHandler(async (req, res) => {
  const r = await query('DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
  if (!r.rows.length) return res.status(404).json({ message: 'Reminder not found.' });
  res.json({ message: 'Reminder deleted.', id: req.params.id });
});

module.exports = { getReminders, getReminder, createReminder, updateReminder, patchReminder, deleteReminder };