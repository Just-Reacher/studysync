/* ─────────────────────────────────────────────
   StudySync — controllers/calendarController.js
───────────────────────────────────────────── */
const { query }        = require('../config/db');
const { asyncHandler } = require('../utils/helpers');

const getEvents = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  let sql = 'SELECT * FROM calendar_events WHERE user_id = $1';
  const params = [req.user.id]; let idx = 2;

  if (year && month) {
    sql += ` AND EXTRACT(YEAR FROM date) = $${idx++} AND EXTRACT(MONTH FROM date) = $${idx++}`;
    params.push(parseInt(year), parseInt(month));
  }

  sql += ' ORDER BY date ASC, start_time ASC NULLS LAST';
  const r = await query(sql, params);
  res.json({ events: r.rows.map(e => ({ ...e, date: e.date.toISOString().split('T')[0] })) });
});

const getEvent = asyncHandler(async (req, res) => {
  const r = await query('SELECT * FROM calendar_events WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!r.rows.length) return res.status(404).json({ message: 'Event not found.' });
  res.json(r.rows[0]);
});

const createEvent = asyncHandler(async (req, res) => {
  const { title, type = 'study', date, startTime, endTime, note } = req.body;
  const r = await query(
    `INSERT INTO calendar_events (user_id, title, type, date, start_time, end_time, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.id, title.trim(), type, date, startTime || null, endTime || null, note || null]
  );
  const ev = r.rows[0];
  res.status(201).json({ event: { ...ev, date: ev.date.toISOString().split('T')[0] } });
});

const updateEvent = asyncHandler(async (req, res) => {
  const exists = await query('SELECT id FROM calendar_events WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!exists.rows.length) return res.status(404).json({ message: 'Event not found.' });

  const { title, type, date, startTime, endTime, note } = req.body;
  const r = await query(
    `UPDATE calendar_events SET
       title      = COALESCE($1, title),
       type       = COALESCE($2, type),
       date       = COALESCE($3, date),
       start_time = COALESCE($4, start_time),
       end_time   = COALESCE($5, end_time),
       note       = COALESCE($6, note)
     WHERE id = $7 AND user_id = $8 RETURNING *`,
    [title, type, date, startTime, endTime, note, req.params.id, req.user.id]
  );
  const ev = r.rows[0];
  res.json({ ...ev, date: ev.date.toISOString().split('T')[0] });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const r = await query('DELETE FROM calendar_events WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
  if (!r.rows.length) return res.status(404).json({ message: 'Event not found.' });
  res.json({ message: 'Event deleted.', id: req.params.id });
});

module.exports = { getEvents, getEvent, createEvent, updateEvent, deleteEvent };