/* ─────────────────────────────────────────────
   StudySync — controllers/quizController.js
───────────────────────────────────────────── */
const { query }           = require('../config/db');
const { asyncHandler }    = require('../utils/helpers');
const { calculateScore }  = require('../utils/validation');

/* ── GET quizzes list ── */
const getQuizzes = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { subject, level, limit = 20 } = req.query;

  let sql = `
    SELECT q.*,
      (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id)::INT AS "questionCount",
      (SELECT score FROM quiz_attempts WHERE user_id = $1 AND quiz_id = q.id ORDER BY completed_at DESC LIMIT 1) AS "lastScore"
    FROM quizzes q
    WHERE q.is_active = TRUE
  `;
  const params = [userId]; let idx = 2;

  if (subject) { sql += ` AND q.subject = $${idx++}`; params.push(subject); }
  if (level)   { sql += ` AND q.level = $${idx++}`;   params.push(level); }
  sql += ` ORDER BY q.subject, q.title LIMIT $${idx++}`;
  params.push(parseInt(limit));

  const result = await query(sql, params);

  const quizzes = result.rows.map(q => ({
    ...q,
    timed:             q.timed,
    timeLimitMinutes:  q.time_limit_minutes,
  }));

  res.json({ quizzes });
});

/* ── GET single quiz ── */
const getQuiz = asyncHandler(async (req, res) => {
  const r = await query(
    `SELECT q.*, (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id)::INT AS "questionCount"
     FROM quizzes q WHERE q.id = $1 AND q.is_active = TRUE`,
    [req.params.id]
  );
  if (!r.rows.length) return res.status(404).json({ message: 'Quiz not found.' });
  const quiz = { ...r.rows[0], timeLimitMinutes: r.rows[0].time_limit_minutes };
  res.json({ quiz });
});

/* ── START quiz — returns randomised questions (no correct index exposed) ── */
const startQuiz = asyncHandler(async (req, res) => {
  const { id: quizId } = req.params;

  const quizRes = await query('SELECT id FROM quizzes WHERE id = $1 AND is_active = TRUE', [quizId]);
  if (!quizRes.rows.length) return res.status(404).json({ message: 'Quiz not found.' });

  const qRes = await query(
    'SELECT id, text, options, correct_index, explanation FROM questions WHERE quiz_id = $1 ORDER BY RANDOM()',
    [quizId]
  );

  // Shuffle options per question and map correct_index accordingly
  const questions = qRes.rows.map(q => {
    const opts    = JSON.parse(typeof q.options === 'string' ? q.options : JSON.stringify(q.options));
    const correct = opts[q.correct_index];

    // Shuffle
    const shuffled = opts.map((o, i) => ({ ...o, origIdx: i })).sort(() => Math.random() - 0.5);
    const newCorrectIdx = shuffled.findIndex(o => o.origIdx === q.correct_index);

    return {
      id:           q.id,
      text:         q.text,
      options:      shuffled.map(o => ({ text: o.text })),
      correctIndex: newCorrectIdx,
      explanation:  q.explanation,
    };
  });

  const attemptId = require('uuid').v4();
  res.json({ attemptId, questions });
});

/* ── SUBMIT quiz ── */
const submitQuiz = asyncHandler(async (req, res) => {
  const { attemptId, answers = [], timeTaken = 0 } = req.body;
  const { id: quizId } = req.params;
  const userId = req.user.id;

  // Get questions to verify answers
  const qRes = await query(
    'SELECT id, correct_index FROM questions WHERE quiz_id = $1',
    [quizId]
  );

  const questionMap = {};
  qRes.rows.forEach(q => { questionMap[q.id] = q.correct_index; });

  let correct = 0;
  answers.forEach(a => {
    if (questionMap[a.questionId] === a.selectedIndex) correct++;
  });

  const total = qRes.rows.length;
  const score = calculateScore ? calculateScore(correct, total) : Math.round((correct / total) * 100);

  await query(
    `INSERT INTO quiz_attempts (id, user_id, quiz_id, answers, score, correct, total, time_taken)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [attemptId, userId, quizId, JSON.stringify(answers), score, correct, total, timeTaken]
  );

  // Update daily activity
  const today = new Date().toISOString().split('T')[0];
  await query(
    `INSERT INTO daily_activity (user_id, date, quiz_count, avg_score)
     VALUES ($1, $2, 1, $3)
     ON CONFLICT (user_id, date) DO UPDATE SET
       quiz_count = daily_activity.quiz_count + 1,
       avg_score  = (daily_activity.avg_score * daily_activity.quiz_count + EXCLUDED.avg_score) / (daily_activity.quiz_count + 1)`,
    [userId, today, score]
  );

  // Update streak
  await updateStreak(userId, today);

  res.json({ score, correct, total, timeTaken });
});

/* ── GET quiz review (with correct answers) ── */
const getQuizReview = asyncHandler(async (req, res) => {
  const qRes = await query(
    'SELECT id, text, options, correct_index, explanation FROM questions WHERE quiz_id = $1',
    [req.params.id]
  );
  res.json({ questions: qRes.rows });
});

/* ── Helper: update study streak ── */
const updateStreak = async (userId, today) => {
  try {
    const s = await query('SELECT * FROM study_streak WHERE user_id = $1', [userId]);
    const streak = s.rows[0];

    if (!streak) {
      await query(
        'INSERT INTO study_streak (user_id, current_streak, longest_streak, last_study_date) VALUES ($1,1,1,$2)',
        [userId, today]
      );
      return;
    }

    const last      = streak.last_study_date ? new Date(streak.last_study_date) : null;
    const todayDate = new Date(today);
    const yesterday = new Date(todayDate); yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = streak.current_streak;

    if (!last || last < yesterday) {
      newStreak = 1; // Reset
    } else if (last.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
      newStreak = streak.current_streak + 1; // Continue
    }
    // If last === today, streak unchanged

    const longest = Math.max(newStreak, streak.longest_streak);
    await query(
      'UPDATE study_streak SET current_streak=$1, longest_streak=$2, last_study_date=$3 WHERE user_id=$4',
      [newStreak, longest, today, userId]
    );
  } catch (err) {
    console.error('Streak update error:', err.message);
  }
};

module.exports = { getQuizzes, getQuiz, startQuiz, submitQuiz, getQuizReview };