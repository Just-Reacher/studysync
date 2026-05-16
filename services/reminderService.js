/* ─────────────────────────────────────────────
   StudySync — services/reminderService.js
   Scheduled reminder logic — determines which
   reminders are due based on time + repeat pattern.
───────────────────────────────────────────── */
const { query } = require('../config/db');

/* ══════════════════════════════
   GET DUE REMINDERS FOR USER
   Returns reminders active right now
   within a ±10 minute window
══════════════════════════════ */
const getDueReminders = async (userId) => {
  const now       = new Date();
  const today     = now.toISOString().split('T')[0];
  const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const hh  = String(now.getHours()).padStart(2, '0');
  const mm  = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hh}:${mm}`;

  // ±10 minute window
  const windowStart = new Date(now.getTime() - 10 * 60000);
  const windowEnd   = new Date(now.getTime() + 10 * 60000);
  const wsHH = String(windowStart.getHours()).padStart(2, '0');
  const wsMM = String(windowStart.getMinutes()).padStart(2, '0');
  const weHH = String(windowEnd.getHours()).padStart(2, '0');
  const weMM = String(windowEnd.getMinutes()).padStart(2, '0');
  const timeStart = `${wsHH}:${wsMM}`;
  const timeEnd   = `${weHH}:${weMM}`;

  const r = await query(
    `SELECT * FROM reminders
     WHERE user_id = $1
       AND active = TRUE
       AND time BETWEEN $2 AND $3
       AND (
         repeat = 'daily'
         OR (repeat = 'once'     AND date = $4)
         OR (repeat = 'weekdays' AND $5 = TRUE)
         OR (repeat = 'weekends' AND $6 = TRUE)
       )
     ORDER BY time ASC`,
    [userId, timeStart, timeEnd, today, isWeekday, isWeekend]
  );

  return r.rows;
};

/* ══════════════════════════════
   GET TODAY'S REMINDER SCHEDULE
   All active reminders for today
   sorted by time
══════════════════════════════ */
const getTodaySchedule = async (userId) => {
  const now       = new Date();
  const today     = now.toISOString().split('T')[0];
  const dayOfWeek = now.getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const r = await query(
    `SELECT id, title, type, time, repeat, note FROM reminders
     WHERE user_id = $1
       AND active = TRUE
       AND (
         repeat = 'daily'
         OR (repeat = 'once'     AND date = $2)
         OR (repeat = 'weekdays' AND $3 = TRUE)
         OR (repeat = 'weekends' AND $4 = TRUE)
       )
     ORDER BY time ASC`,
    [userId, today, isWeekday, isWeekend]
  );

  return r.rows.map(r => ({
    ...r,
    time:   r.time,
    isPast: r.time < now.toTimeString().slice(0, 5),
  }));
};

/* ══════════════════════════════
   FORMAT TIME FOR DISPLAY
   '14:30' → '2:30 PM'
══════════════════════════════ */
const formatReminderTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm   = h >= 12 ? 'PM' : 'AM';
  const h12    = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

/* ══════════════════════════════
   GET UPCOMING REMINDERS
   Next N reminders from now
══════════════════════════════ */
const getUpcomingReminders = async (userId, limit = 3) => {
  const now        = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const today      = now.toISOString().split('T')[0];
  const dayOfWeek  = now.getDay();
  const isWeekday  = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isWeekend  = dayOfWeek === 0 || dayOfWeek === 6;

  const r = await query(
    `SELECT id, title, type, time, repeat FROM reminders
     WHERE user_id = $1
       AND active = TRUE
       AND time > $2
       AND (
         repeat = 'daily'
         OR (repeat = 'once'     AND date = $3)
         OR (repeat = 'weekdays' AND $4 = TRUE)
         OR (repeat = 'weekends' AND $5 = TRUE)
       )
     ORDER BY time ASC
     LIMIT $6`,
    [userId, currentTime, today, isWeekday, isWeekend, limit]
  );

  return r.rows.map(r => ({
    ...r,
    displayTime: formatReminderTime(r.time),
  }));
};

/* ══════════════════════════════
   CHECK REMINDER CONFLICT
   Returns true if a new reminder
   overlaps with an existing one
   within 15 minutes
══════════════════════════════ */
const hasConflict = async (userId, time, excludeId = null) => {
  const [h, m] = time.split(':').map(Number);
  const totalMins = h * 60 + m;
  const minTime   = `${String(Math.floor((totalMins - 15) / 60)).padStart(2,'0')}:${String((totalMins - 15) % 60).padStart(2,'0')}`;
  const maxTime   = `${String(Math.floor((totalMins + 15) / 60)).padStart(2,'0')}:${String((totalMins + 15) % 60).padStart(2,'0')}`;

  let sql = `SELECT COUNT(*)::INT AS cnt FROM reminders
             WHERE user_id = $1 AND active = TRUE AND time BETWEEN $2 AND $3`;
  const params = [userId, minTime, maxTime];

  if (excludeId) {
    sql += ` AND id != $4`;
    params.push(excludeId);
  }

  const r = await query(sql, params);
  return parseInt(r.rows[0]?.cnt) > 0;
};

module.exports = { getDueReminders, getTodaySchedule, getUpcomingReminders, formatReminderTime, hasConflict };