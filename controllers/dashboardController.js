/* ─────────────────────────────────────────────
   StudySync — controllers/dashboardController.js
───────────────────────────────────────────── */
const { query }       = require('../config/db');
const { asyncHandler } = require('../utils/helpers');
const { randomQuote }  = require('../utils/randomQuote');

/* ── Get dashboard stats ── */
const getStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const today  = new Date().toISOString().split('T')[0];

  const [streakRes, tasksRes, scoreRes, focusRes] = await Promise.all([
    query('SELECT current_streak, longest_streak FROM study_streak WHERE user_id = $1', [userId]),
    query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE completed = TRUE) AS done
           FROM tasks WHERE user_id = $1 AND DATE(deadline) = $2`, [userId, today]),
    query(`SELECT ROUND(AVG(score))::INT AS avg FROM quiz_attempts WHERE user_id = $1`, [userId]),
    query(`SELECT COALESCE(SUM(minutes),0) AS mins FROM timer_sessions
           WHERE user_id = $1 AND date = $2 AND type = 'focus'`, [userId, today]),
  ]);

  const streak   = streakRes.rows[0] || { current_streak: 0 };
  const tasks    = tasksRes.rows[0]  || { total: 0, done: 0 };
  const avg      = scoreRes.rows[0]?.avg ?? null;
  const focusMins = parseInt(focusRes.rows[0]?.mins || 0);

  res.json({
    streak:             parseInt(streak.current_streak) || 0,
    streakMessage:      streak.current_streak >= 7 ? '🔥 On fire! Keep it up!' : 'Keep it going!',
    tasksTotal:         parseInt(tasks.total)  || 0,
    tasksPending:       (parseInt(tasks.total) || 0) - (parseInt(tasks.done) || 0),
    avgScore:           avg,
    focusMinutesToday:  focusMins,
  });
});

/* ── Get motivational quote ── */
const getQuote = asyncHandler(async (req, res) => {
  res.json(randomQuote());
});

/* ── Get smart notification ── */
const getNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const today  = new Date().toISOString().split('T')[0];

  // Check overdue tasks
  const overdue = await query(
    `SELECT COUNT(*) AS cnt FROM tasks
     WHERE user_id = $1 AND completed = FALSE AND deadline < NOW()`,
    [userId]
  );

  if (parseInt(overdue.rows[0]?.cnt) > 0) {
    return res.json({
      title:        'Overdue Tasks',
      body:         `You have ${overdue.rows[0].cnt} overdue task(s). Let's get them done!`,
      primaryLabel: 'View Tasks',
      primaryHref:  'tasks.html',
    });
  }

  // Check if no quiz taken today
  const quizToday = await query(
    `SELECT COUNT(*) AS cnt FROM quiz_attempts
     WHERE user_id = $1 AND DATE(completed_at) = $2`,
    [userId, today]
  );

  if (parseInt(quizToday.rows[0]?.cnt) === 0) {
    return res.json({
      title:        'Time to Practice!',
      body:         'You haven\'t taken a quiz today. A quick practice session keeps your streak going!',
      primaryLabel: 'Start Quiz',
      primaryHref:  'quizzes.html',
    });
  }

  // Default — motivational
  const q = randomQuote();
  res.json({
    title:        'Stay Focused 💪',
    body:         `"${q.quote}" — ${q.author}`,
    primaryLabel: 'Dashboard',
    primaryHref:  'dashboard.html',
  });
});

module.exports = { getStats, getQuote, getNotification };