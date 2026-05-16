/* ─────────────────────────────────────────────
   StudySync — services/notificationService.js
   Smart notification logic — overdue tasks,
   quiz nudges, streak alerts, badge unlocks.
───────────────────────────────────────────── */
const { query } = require('../config/db');

/* ══════════════════════════════
   GET SMART NOTIFICATION
   Returns the most relevant
   notification for the user right now.
══════════════════════════════ */
const getSmartNotification = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const hour  = new Date().getHours();

  /* 1. Overdue tasks */
  const overdue = await query(
    `SELECT COUNT(*)::INT AS cnt FROM tasks
     WHERE user_id = $1 AND completed = FALSE AND deadline < NOW()`,
    [userId]
  );
  if (parseInt(overdue.rows[0]?.cnt) > 0) {
    return {
      type:         'overdue',
      title:        'Overdue Tasks ⚠️',
      body:         `You have ${overdue.rows[0].cnt} overdue task${overdue.rows[0].cnt > 1 ? 's' : ''}. Let's get them done!`,
      primaryLabel: 'View Tasks',
      primaryHref:  'tasks.html',
    };
  }

  /* 2. No quiz taken today */
  const quizToday = await query(
    `SELECT COUNT(*)::INT AS cnt FROM quiz_attempts
     WHERE user_id = $1 AND DATE(completed_at) = $2`,
    [userId, today]
  );
  if (parseInt(quizToday.rows[0]?.cnt) === 0 && hour >= 10) {
    return {
      type:         'quiz_nudge',
      title:        'Time to Practice! 🧠',
      body:         "You haven't taken a quiz today. A quick practice keeps your streak alive!",
      primaryLabel: 'Start Quiz',
      primaryHref:  'quizzes.html',
    };
  }

  /* 3. Streak about to break (studied yesterday, not today) */
  const streak = await query(
    `SELECT current_streak, last_study_date FROM study_streak WHERE user_id = $1`,
    [userId]
  );
  if (streak.rows.length) {
    const lastDate = streak.rows[0].last_study_date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (
      lastDate &&
      lastDate.toISOString?.().split('T')[0] === yesterdayStr &&
      streak.rows[0].current_streak >= 3 &&
      hour >= 18
    ) {
      return {
        type:         'streak_alert',
        title:        `Don't break your ${streak.rows[0].current_streak}-day streak! 🔥`,
        body:         'You studied yesterday. Study something today to keep your streak going!',
        primaryLabel: 'Start Quiz',
        primaryHref:  'quizzes.html',
      };
    }
  }

  /* 4. Tasks due today */
  const dueToday = await query(
    `SELECT COUNT(*)::INT AS cnt FROM tasks
     WHERE user_id = $1 AND completed = FALSE AND DATE(deadline) = $2`,
    [userId, today]
  );
  if (parseInt(dueToday.rows[0]?.cnt) > 0) {
    return {
      type:         'tasks_due',
      title:        'Tasks Due Today 📋',
      body:         `You have ${dueToday.rows[0].cnt} task${dueToday.rows[0].cnt > 1 ? 's' : ''} due today. Stay on top of it!`,
      primaryLabel: 'View Tasks',
      primaryHref:  'tasks.html',
    };
  }

  /* 5. No focus session today */
  const focus = await query(
    `SELECT COALESCE(SUM(minutes),0)::INT AS mins FROM timer_sessions
     WHERE user_id = $1 AND date = $2 AND type = 'focus'`,
    [userId, today]
  );
  if (parseInt(focus.rows[0]?.mins) === 0 && hour >= 14) {
    return {
      type:         'focus_nudge',
      title:        'Start a Focus Session ⏱️',
      body:         "You haven't started a Pomodoro session today. Even 25 minutes makes a difference!",
      primaryLabel: 'Open Timer',
      primaryHref:  'pomodoro.html',
    };
  }

  /* 6. Default — no urgent notification */
  return null;
};

/* ══════════════════════════════
   GET PENDING NOTIFICATIONS COUNT
   For navbar badge
══════════════════════════════ */
const getPendingCount = async (userId) => {
  const today = new Date().toISOString().split('T')[0];

  const [overdueRes, dueTodayRes] = await Promise.all([
    query(`SELECT COUNT(*)::INT AS cnt FROM tasks WHERE user_id=$1 AND completed=FALSE AND deadline < NOW()`, [userId]),
    query(`SELECT COUNT(*)::INT AS cnt FROM tasks WHERE user_id=$1 AND completed=FALSE AND DATE(deadline)=$2`, [userId, today]),
  ]);

  return {
    overdue:  parseInt(overdueRes.rows[0]?.cnt)  || 0,
    dueToday: parseInt(dueTodayRes.rows[0]?.cnt) || 0,
    total:    (parseInt(overdueRes.rows[0]?.cnt) || 0) + (parseInt(dueTodayRes.rows[0]?.cnt) || 0),
  };
};

/* ══════════════════════════════
   CHECK BADGE UNLOCK
   Returns newly unlocked badges
   to show as popup achievements
══════════════════════════════ */
const checkBadgeUnlocks = async (userId) => {
  const [attemptsRes, streakRes, notesRes, perfectRes] = await Promise.all([
    query('SELECT COUNT(*)::INT AS total FROM quiz_attempts WHERE user_id=$1', [userId]),
    query('SELECT current_streak, longest_streak FROM study_streak WHERE user_id=$1', [userId]),
    query('SELECT COUNT(*)::INT AS total FROM notes WHERE user_id=$1', [userId]),
    query('SELECT COUNT(*)::INT AS cnt FROM quiz_attempts WHERE user_id=$1 AND score=100', [userId]),
  ]);

  const attempts = parseInt(attemptsRes.rows[0]?.total) || 0;
  const streak   = streakRes.rows[0] || {};
  const notes    = parseInt(notesRes.rows[0]?.total) || 0;
  const perfect  = parseInt(perfectRes.rows[0]?.cnt) || 0;

  const unlocked = [];

  if (attempts === 1)  unlocked.push({ id: 'first_quiz',    emoji: '🎯', name: 'First Quiz!' });
  if (attempts === 10) unlocked.push({ id: 'quiz_10',       emoji: '🏆', name: 'Quiz Master!' });
  if (streak.current_streak === 3) unlocked.push({ id: 'streak_3', emoji: '🔥', name: '3-Day Streak!' });
  if (streak.current_streak === 7) unlocked.push({ id: 'streak_7', emoji: '⚡', name: '7-Day Streak!' });
  if (perfect === 1)   unlocked.push({ id: 'perfect_score', emoji: '💯', name: 'Perfect Score!' });
  if (notes === 10)    unlocked.push({ id: 'bookworm',      emoji: '📚', name: 'Bookworm!' });

  return unlocked;
};

module.exports = { getSmartNotification, getPendingCount, checkBadgeUnlocks };