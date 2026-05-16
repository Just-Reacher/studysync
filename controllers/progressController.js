/* ─────────────────────────────────────────────
   StudySync — controllers/progressController.js
───────────────────────────────────────────── */
const { query }        = require('../config/db');
const { asyncHandler } = require('../utils/helpers');

const periodFilter = (period) => {
  if (period === 'all') return '';
  const days = period === '7' ? 7 : period === '90' ? 90 : 30;
  return `AND completed_at >= NOW() - INTERVAL '${days} days'`;
};

const getSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const pf     = periodFilter(req.query.period || '30');

  const [attemptsRes, streakRes, focusRes] = await Promise.all([
    query(`SELECT COUNT(*) AS total, ROUND(AVG(score))::INT AS avg FROM quiz_attempts WHERE user_id = $1 ${pf}`, [userId]),
    query('SELECT current_streak, longest_streak FROM study_streak WHERE user_id = $1', [userId]),
    query(`SELECT COALESCE(SUM(minutes),0) AS mins FROM timer_sessions WHERE user_id = $1 AND type='focus' ${pf.replace('completed_at','created_at')}`, [userId]),
  ]);

  // Best and worst subjects
  const subjectsRes = await query(
    `SELECT q.subject, ROUND(AVG(qa.score))::INT AS avg_score
     FROM quiz_attempts qa JOIN quizzes q ON q.id = qa.quiz_id
     WHERE qa.user_id = $1 ${pf}
     GROUP BY q.subject ORDER BY avg_score DESC`,
    [userId]
  );

  const subjects = subjectsRes.rows;
  const strongest = subjects[0]   ? { name: subjects[0].subject,   avgScore: subjects[0].avg_score }   : null;
  const weakest   = subjects.at(-1) ? { name: subjects.at(-1).subject, avgScore: subjects.at(-1).avg_score } : null;

  res.json({
    totalQuizzes:    parseInt(attemptsRes.rows[0]?.total) || 0,
    quizzesDelta:    parseInt(attemptsRes.rows[0]?.total) || 0,
    avgScore:        attemptsRes.rows[0]?.avg ?? null,
    streak:          parseInt(streakRes.rows[0]?.current_streak) || 0,
    focusMinutes:    parseInt(focusRes.rows[0]?.mins) || 0,
    strongestSubject: strongest,
    weakestSubject:   weakest,
  });
});

const getSubjects = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const pf     = periodFilter(req.query.period || '30');
  const limit  = parseInt(req.query.limit) || 10;

  const r = await query(
    `SELECT q.subject, COUNT(qa.id)::INT AS "quizCount", ROUND(AVG(qa.score))::INT AS "avgScore"
     FROM quiz_attempts qa JOIN quizzes q ON q.id = qa.quiz_id
     WHERE qa.user_id = $1 ${pf}
     GROUP BY q.subject ORDER BY "avgScore" DESC LIMIT $2`,
    [userId, limit]
  );
  res.json({ subjects: r.rows });
});

const getActivity = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const pf     = periodFilter(req.query.period || '30');

  const r = await query(
    `SELECT date::TEXT, quiz_count AS count, avg_score AS score, focus_min
     FROM daily_activity WHERE user_id = $1 ${pf.replace('completed_at','date::TIMESTAMPTZ')}
     ORDER BY date ASC`,
    [userId]
  );
  res.json({ days: r.rows });
});

const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const pf     = periodFilter(req.query.period || '30');
  const limit  = parseInt(req.query.limit) || 10;

  const r = await query(
    `SELECT qa.id, q.title AS "quizTitle", q.subject, qa.score, qa.correct, qa.total, qa.time_taken AS "timeTaken", qa.completed_at AS "completedAt"
     FROM quiz_attempts qa JOIN quizzes q ON q.id = qa.quiz_id
     WHERE qa.user_id = $1 ${pf}
     ORDER BY qa.completed_at DESC LIMIT $2`,
    [userId, limit]
  );
  res.json({ history: r.rows });
});

const getStreak = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const r      = await query('SELECT * FROM study_streak WHERE user_id = $1', [userId]);
  const streak = r.rows[0] || { current_streak: 0, longest_streak: 0 };

  // Last 7 days
  const days7 = await query(
    `SELECT date::TEXT FROM daily_activity WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 days'`,
    [userId]
  );
  const activeDates = new Set(days7.rows.map(d => d.date));
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    return { date: ds, active: activeDates.has(ds) };
  });

  res.json({
    streak:   parseInt(streak.current_streak) || 0,
    longest:  parseInt(streak.longest_streak)  || 0,
    message:  streak.current_streak >= 7 ? '🔥 On fire! Keep it up!' : 'Keep going!',
    last7Days: last7,
  });
});

const getBadges = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [attemptsRes, streakRes, notesRes, perfectRes, speedRes] = await Promise.all([
    query('SELECT COUNT(*)::INT AS total FROM quiz_attempts WHERE user_id = $1', [userId]),
    query('SELECT current_streak, longest_streak FROM study_streak WHERE user_id = $1', [userId]),
    query('SELECT COUNT(*)::INT AS total FROM notes WHERE user_id = $1', [userId]),
    query('SELECT COUNT(*)::INT AS cnt FROM quiz_attempts WHERE user_id = $1 AND score = 100', [userId]),
    query('SELECT COUNT(*)::INT AS cnt FROM quiz_attempts WHERE user_id = $1 AND time_taken < 180', [userId]),
  ]);

  const attempts     = parseInt(attemptsRes.rows[0]?.total) || 0;
  const streak       = streakRes.rows[0] || {};
  const notes        = parseInt(notesRes.rows[0]?.total) || 0;
  const hasPerfect   = parseInt(perfectRes.rows[0]?.cnt) > 0;
  const hasSpeed     = parseInt(speedRes.rows[0]?.cnt) > 0;

  // Subjects attempted
  const subjectsRes  = await query(
    'SELECT COUNT(DISTINCT q.subject)::INT AS cnt FROM quiz_attempts qa JOIN quizzes q ON q.id = qa.quiz_id WHERE qa.user_id = $1',
    [userId]
  );
  const subjectCount = parseInt(subjectsRes.rows[0]?.cnt) || 0;

  // Avg score
  const avgRes   = await query('SELECT ROUND(AVG(score))::INT AS avg FROM quiz_attempts WHERE user_id = $1', [userId]);
  const avgScore = parseInt(avgRes.rows[0]?.avg) || 0;

  const earned = [];
  if (attempts >= 1)                      earned.push('first_quiz');
  if (streak.current_streak >= 3 || streak.longest_streak >= 3) earned.push('streak_3');
  if (streak.current_streak >= 7 || streak.longest_streak >= 7) earned.push('streak_7');
  if (hasPerfect)                          earned.push('perfect_score');
  if (attempts >= 10)                      earned.push('quiz_10');
  if (subjectCount >= 5)                   earned.push('all_subjects');
  if (hasSpeed)                            earned.push('speed_demon');
  if (notes >= 10)                         earned.push('bookworm');
  if (avgScore >= 85 && attempts >= 5)     earned.push('top_score');

  res.json({ badges: earned.map(id => ({ id })) });
});

module.exports = { getSummary, getSubjects, getActivity, getHistory, getStreak, getBadges };