/* ─────────────────────────────────────────────
   StudySync — controllers/timerController.js
───────────────────────────────────────────── */
const { query }        = require('../config/db');
const { asyncHandler } = require('../utils/helpers');

/* ── POST session ── */
const createSession = asyncHandler(async (req, res) => {
  const { type = 'focus', minutes, taskId, date } = req.body;
  const sessionDate = date || new Date().toISOString().split('T')[0];

  const r = await query(
    `INSERT INTO timer_sessions (user_id, type, minutes, task_id, date)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.id, type, parseInt(minutes), taskId || null, sessionDate]
  );

  // Update daily activity focus minutes
  if (type === 'focus') {
    await query(
      `INSERT INTO daily_activity (user_id, date, focus_min)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, date) DO UPDATE SET focus_min = daily_activity.focus_min + EXCLUDED.focus_min`,
      [req.user.id, sessionDate, parseInt(minutes)]
    );
  }

  res.status(201).json({ session: r.rows[0] });
});

/* ── GET today stats ── */
const getTodayStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const date   = req.query.date || new Date().toISOString().split('T')[0];

  const [sessionsRes, focusRes, breaksRes, settingsRes] = await Promise.all([
    query(`SELECT COUNT(*)::INT AS cnt FROM timer_sessions WHERE user_id=$1 AND date=$2 AND type='focus'`, [userId, date]),
    query(`SELECT COALESCE(SUM(minutes),0)::INT AS mins FROM timer_sessions WHERE user_id=$1 AND date=$2 AND type='focus'`, [userId, date]),
    query(`SELECT COUNT(*)::INT AS cnt FROM timer_sessions WHERE user_id=$1 AND date=$2 AND type='break'`, [userId, date]),
    query(`SELECT daily_focus_goal_min FROM user_settings WHERE user_id=$1`, [userId]),
  ]);

  res.json({
    sessions:       sessionsRes.rows[0]?.cnt  || 0,
    focusMin:       focusRes.rows[0]?.mins    || 0,
    breaks:         breaksRes.rows[0]?.cnt    || 0,
    dailyGoal:      settingsRes.rows[0]?.daily_focus_goal_min || 120,
  });
});

/* ── GET session history ── */
const getSessions = asyncHandler(async (req, res) => {
  const { date, limit = 20 } = req.query;
  let sql = 'SELECT ts.*, t.title AS task_title FROM timer_sessions ts LEFT JOIN tasks t ON t.id = ts.task_id WHERE ts.user_id = $1';
  const params = [req.user.id]; let idx = 2;

  if (date) { sql += ` AND ts.date = $${idx++}`; params.push(date); }
  sql += ` ORDER BY ts.created_at DESC LIMIT $${idx++}`;
  params.push(parseInt(limit));

  const r = await query(sql, params);
  res.json({ sessions: r.rows });
});

module.exports = { createSession, getTodayStats, getSessions };