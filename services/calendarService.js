/* ─────────────────────────────────────────────
   StudySync — services/calendarService.js
   Calendar helpers — event formatting, date
   range queries, conflict detection, auto-sync
   of tasks and reminders into calendar view.
───────────────────────────────────────────── */
const { query } = require('../config/db');

/* ══════════════════════════════
   FORMAT EVENT FOR RESPONSE
══════════════════════════════ */
const formatEvent = (event) => ({
  ...event,
  date:      event.date instanceof Date
    ? event.date.toISOString().split('T')[0]
    : event.date,
  startTime: event.start_time || null,
  endTime:   event.end_time   || null,
});

/* ══════════════════════════════
   GET EVENTS IN DATE RANGE
══════════════════════════════ */
const getEventsInRange = async (userId, startDate, endDate) => {
  const r = await query(
    `SELECT * FROM calendar_events
     WHERE user_id = $1 AND date BETWEEN $2 AND $3
     ORDER BY date ASC, start_time ASC NULLS LAST`,
    [userId, startDate, endDate]
  );
  return r.rows.map(formatEvent);
};

/* ══════════════════════════════
   GET EVENTS FOR MONTH
══════════════════════════════ */
const getEventsForMonth = async (userId, year, month) => {
  const r = await query(
    `SELECT * FROM calendar_events
     WHERE user_id = $1
       AND EXTRACT(YEAR  FROM date) = $2
       AND EXTRACT(MONTH FROM date) = $3
     ORDER BY date ASC, start_time ASC NULLS LAST`,
    [userId, year, month]
  );
  return r.rows.map(formatEvent);
};

/* ══════════════════════════════
   GET EVENTS FOR DAY
══════════════════════════════ */
const getEventsForDay = async (userId, date) => {
  const r = await query(
    `SELECT * FROM calendar_events
     WHERE user_id = $1 AND date = $2
     ORDER BY start_time ASC NULLS LAST`,
    [userId, date]
  );
  return r.rows.map(formatEvent);
};

/* ══════════════════════════════
   GET BUSY DATES (has events)
   Returns array of date strings
   for a given month — used by
   mini-calendar dot indicators
══════════════════════════════ */
const getBusyDates = async (userId, year, month) => {
  const r = await query(
    `SELECT DISTINCT date::TEXT FROM calendar_events
     WHERE user_id = $1
       AND EXTRACT(YEAR  FROM date) = $2
       AND EXTRACT(MONTH FROM date) = $3`,
    [userId, year, month]
  );
  return r.rows.map(row => row.date);
};

/* ══════════════════════════════
   CHECK TIME CONFLICT
   Returns true if a new event
   overlaps with an existing one
   on the same date
══════════════════════════════ */
const hasTimeConflict = async (userId, date, startTime, endTime, excludeId = null) => {
  if (!startTime || !endTime) return false;

  let sql = `
    SELECT COUNT(*)::INT AS cnt FROM calendar_events
    WHERE user_id = $1
      AND date = $2
      AND start_time IS NOT NULL
      AND end_time IS NOT NULL
      AND start_time < $4
      AND end_time > $3
  `;
  const params = [userId, date, startTime, endTime];

  if (excludeId) {
    sql += ` AND id != $5`;
    params.push(excludeId);
  }

  const r = await query(sql, params);
  return parseInt(r.rows[0]?.cnt) > 0;
};

/* ══════════════════════════════
   SYNC TASKS TO CALENDAR
   Auto-creates calendar events for
   tasks that have deadlines and
   don't already have a calendar event
══════════════════════════════ */
const syncTasksToCalendar = async (userId) => {
  // Find tasks with deadlines that don't have matching calendar events
  const tasks = await query(
    `SELECT t.id, t.title, DATE(t.deadline) AS date
     FROM tasks t
     WHERE t.user_id = $1
       AND t.deadline IS NOT NULL
       AND t.completed = FALSE
       AND NOT EXISTS (
         SELECT 1 FROM calendar_events ce
         WHERE ce.user_id = $1
           AND ce.type = 'task'
           AND ce.note LIKE '%task_ref:' || t.id::TEXT || '%'
       )
     LIMIT 20`,
    [userId]
  );

  const created = [];
  for (const task of tasks.rows) {
    const r = await query(
      `INSERT INTO calendar_events (user_id, title, type, date, note)
       VALUES ($1, $2, 'task', $3, $4)
       ON CONFLICT DO NOTHING RETURNING *`,
      [userId, task.title, task.date, `Auto-synced task. task_ref:${task.id}`]
    );
    if (r.rows.length) created.push(formatEvent(r.rows[0]));
  }

  return created;
};

/* ══════════════════════════════
   GET UPCOMING EVENTS
   Next N events from today
══════════════════════════════ */
const getUpcomingEvents = async (userId, limit = 5) => {
  const today = new Date().toISOString().split('T')[0];
  const r = await query(
    `SELECT * FROM calendar_events
     WHERE user_id = $1 AND date >= $2
     ORDER BY date ASC, start_time ASC NULLS LAST
     LIMIT $3`,
    [userId, today, limit]
  );
  return r.rows.map(formatEvent);
};

/* ══════════════════════════════
   GET EVENT COUNTS PER DAY
   For week view density indicator
══════════════════════════════ */
const getEventCountsForWeek = async (userId, weekStart, weekEnd) => {
  const r = await query(
    `SELECT date::TEXT, COUNT(*)::INT AS count
     FROM calendar_events
     WHERE user_id = $1 AND date BETWEEN $2 AND $3
     GROUP BY date ORDER BY date`,
    [userId, weekStart, weekEnd]
  );
  const counts = {};
  r.rows.forEach(row => { counts[row.date] = row.count; });
  return counts;
};

module.exports = {
  formatEvent,
  getEventsInRange,
  getEventsForMonth,
  getEventsForDay,
  getBusyDates,
  hasTimeConflict,
  syncTasksToCalendar,
  getUpcomingEvents,
  getEventCountsForWeek,
};