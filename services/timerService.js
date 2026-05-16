/* ─────────────────────────────────────────────
   StudySync — services/timerService.js
   Pomodoro session calculations, daily goal
   tracking, focus statistics, weekly summaries.
───────────────────────────────────────────── */
const { query } = require('../config/db');

/* ══════════════════════════════
   GET TODAY'S FOCUS STATS
══════════════════════════════ */
const getTodayFocusStats = async (userId) => {
  const today = new Date().toISOString().split('T')[0];

  const [sessionsRes, focusRes, breaksRes, goalRes] = await Promise.all([
    query(`SELECT COUNT(*)::INT AS cnt FROM timer_sessions WHERE user_id=$1 AND date=$2 AND type='focus'`, [userId, today]),
    query(`SELECT COALESCE(SUM(minutes),0)::INT AS mins FROM timer_sessions WHERE user_id=$1 AND date=$2 AND type='focus'`, [userId, today]),
    query(`SELECT COUNT(*)::INT AS cnt FROM timer_sessions WHERE user_id=$1 AND date=$2 AND type='break'`, [userId, today]),
    query(`SELECT daily_focus_goal_min FROM user_settings WHERE user_id=$1`, [userId]),
  ]);

  const focusMins = parseInt(focusRes.rows[0]?.mins)  || 0;
  const goalMins  = parseInt(goalRes.rows[0]?.daily_focus_goal_min) || 120;

  return {
    sessions:       parseInt(sessionsRes.rows[0]?.cnt) || 0,
    focusMinutes:   focusMins,
    breaks:         parseInt(breaksRes.rows[0]?.cnt)   || 0,
    dailyGoalMins:  goalMins,
    goalProgress:   Math.min(100, Math.round((focusMins / goalMins) * 100)),
    goalReached:    focusMins >= goalMins,
  };
};

/* ══════════════════════════════
   GET WEEKLY FOCUS SUMMARY
   Last 7 days breakdown
══════════════════════════════ */
const getWeeklyFocusSummary = async (userId) => {
  const r = await query(
    `SELECT
       date::TEXT,
       COALESCE(SUM(minutes) FILTER (WHERE type='focus'),0)::INT AS focus_min,
       COUNT(*) FILTER (WHERE type='focus')::INT AS sessions
     FROM timer_sessions
     WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 days'
     GROUP BY date
     ORDER BY date ASC`,
    [userId]
  );

  // Fill in missing days with zeros
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d   = new Date();
    d.setDate(d.getDate() - i);
    const ds  = d.toISOString().split('T')[0];
    const row = r.rows.find(r => r.date === ds);
    result.push({
      date:      ds,
      focusMin:  row?.focus_min || 0,
      sessions:  row?.sessions  || 0,
      dayLabel:  d.toLocaleDateString('en-US', { weekday: 'short' }),
    });
  }

  const totalFocus    = result.reduce((sum, d) => sum + d.focusMin, 0);
  const totalSessions = result.reduce((sum, d) => sum + d.sessions, 0);
  const avgPerDay     = Math.round(totalFocus / 7);

  return { days: result, totalFocus, totalSessions, avgPerDay };
};

/* ══════════════════════════════
   GET ALL-TIME FOCUS STATS
══════════════════════════════ */
const getAllTimeFocusStats = async (userId) => {
  const r = await query(
    `SELECT
       COALESCE(SUM(minutes) FILTER (WHERE type='focus'),0)::INT AS total_focus_min,
       COUNT(*) FILTER (WHERE type='focus')::INT AS total_sessions,
       COUNT(*) FILTER (WHERE type='break')::INT AS total_breaks,
       COUNT(DISTINCT date)::INT AS active_days
     FROM timer_sessions
     WHERE user_id = $1`,
    [userId]
  );

  const stats = r.rows[0] || {};
  const totalMins = parseInt(stats.total_focus_min) || 0;

  return {
    totalFocusMinutes: totalMins,
    totalFocusHours:   parseFloat((totalMins / 60).toFixed(1)),
    totalSessions:     parseInt(stats.total_sessions) || 0,
    totalBreaks:       parseInt(stats.total_breaks)   || 0,
    activeDays:        parseInt(stats.active_days)    || 0,
    avgSessionLength:  stats.total_sessions > 0
      ? Math.round(totalMins / parseInt(stats.total_sessions))
      : 0,
  };
};

/* ══════════════════════════════
   LOG SESSION + UPDATE DAILY ACTIVITY
   Combined helper used by controller
══════════════════════════════ */
const logSessionAndUpdateActivity = async (userId, { type, minutes, taskId, date }) => {
  const sessionDate = date || new Date().toISOString().split('T')[0];

  // Insert timer session
  const r = await query(
    `INSERT INTO timer_sessions (user_id, type, minutes, task_id, date)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [userId, type, parseInt(minutes), taskId || null, sessionDate]
  );

  // Update daily activity focus minutes
  if (type === 'focus') {
    await query(
      `INSERT INTO daily_activity (user_id, date, focus_min)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, date) DO UPDATE
       SET focus_min = daily_activity.focus_min + EXCLUDED.focus_min`,
      [userId, sessionDate, parseInt(minutes)]
    );
  }

  return r.rows[0];
};

/* ══════════════════════════════
   CALCULATE POMODORO CYCLES
   Given focus + break minutes,
   returns how many full cycles fit
   in a given total time
══════════════════════════════ */
const calculateCycles = (totalMinutes, focusMin = 25, shortBreakMin = 5, rounds = 4, longBreakMin = 15) => {
  const cycleLength = (focusMin + shortBreakMin) * (rounds - 1) + focusMin + longBreakMin;
  const fullCycles  = Math.floor(totalMinutes / cycleLength);
  const remainder   = totalMinutes % cycleLength;

  const sessionsInRemainder = Math.min(rounds, Math.floor(remainder / (focusMin + shortBreakMin)));

  return {
    fullCycles,
    extraSessions:  sessionsInRemainder,
    totalSessions:  fullCycles * rounds + sessionsInRemainder,
    totalFocusMin:  fullCycles * rounds * focusMin + sessionsInRemainder * focusMin,
  };
};

/* ══════════════════════════════
   FORMAT FOCUS DURATION
   Minutes → human readable
══════════════════════════════ */
const formatFocusDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

module.exports = {
  getTodayFocusStats,
  getWeeklyFocusSummary,
  getAllTimeFocusStats,
  logSessionAndUpdateActivity,
  calculateCycles,
  formatFocusDuration,
};