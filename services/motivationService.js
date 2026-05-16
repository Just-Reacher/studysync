/* ─────────────────────────────────────────────
   StudySync — services/motivationService.js
   Quote rotation, streak-based messages,
   achievement triggers, daily goal messages.
───────────────────────────────────────────── */
const { query } = require('../config/db');

/* ══════════════════════════════
   QUOTE BANK — categorised
══════════════════════════════ */
const QUOTES = {
  general: [
    { quote: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
    { quote: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
    { quote: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
    { quote: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
    { quote: 'Great things never come from comfort zones.', author: 'Unknown' },
    { quote: 'Work hard in silence, let success make the noise.', author: 'Unknown' },
    { quote: 'Don\'t stop when you\'re tired. Stop when you\'re done.', author: 'Unknown' },
    { quote: 'Dream it. Wish it. Do it.', author: 'Unknown' },
  ],
  discipline: [
    { quote: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
    { quote: 'We are what we repeatedly do. Excellence is not an act, but a habit.', author: 'Aristotle' },
    { quote: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
    { quote: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  ],
  education: [
    { quote: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' },
    { quote: 'The more that you read, the more things you will know.', author: 'Dr. Seuss' },
    { quote: 'Live as if you were to die tomorrow. Learn as if you were to live forever.', author: 'Mahatma Gandhi' },
    { quote: 'Education is not the filling of a pail, but the lighting of a fire.', author: 'W.B. Yeats' },
  ],
  streak: [
    { quote: 'Consistency is what transforms average into excellence.', author: 'Unknown' },
    { quote: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma' },
    { quote: 'Success is nothing more than a few simple disciplines practised every day.', author: 'Jim Rohn' },
  ],
  comeback: [
    { quote: 'It\'s not how many times you fall, it\'s how many times you get back up.', author: 'Unknown' },
    { quote: 'Every day is a new beginning. Take a deep breath and start again.', author: 'Unknown' },
    { quote: 'You don\'t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
  ],
};

/* ══════════════════════════════
   GET RANDOM QUOTE
   Optionally filtered by category
══════════════════════════════ */
const getRandomQuote = (category = null) => {
  const pool = category && QUOTES[category] ? QUOTES[category] : QUOTES.general;
  return pool[Math.floor(Math.random() * pool.length)];
};

/* ══════════════════════════════
   GET CONTEXTUAL QUOTE
   Based on user's current streak
   and recent performance
══════════════════════════════ */
const getContextualQuote = async (userId) => {
  try {
    const [streakRes, attemptsRes] = await Promise.all([
      query('SELECT current_streak FROM study_streak WHERE user_id = $1', [userId]),
      query(`SELECT ROUND(AVG(score))::INT AS avg FROM quiz_attempts
             WHERE user_id = $1 AND completed_at >= NOW() - INTERVAL '7 days'`, [userId]),
    ]);

    const streak = parseInt(streakRes.rows[0]?.current_streak) || 0;
    const avg    = parseInt(attemptsRes.rows[0]?.avg) || null;

    // Choose quote category based on context
    if (streak === 0) return getRandomQuote('comeback');
    if (streak >= 7)  return getRandomQuote('streak');
    if (avg !== null && avg < 50) return getRandomQuote('comeback');
    if (avg !== null && avg >= 80) return getRandomQuote('discipline');

    return getRandomQuote('general');
  } catch {
    return getRandomQuote('general');
  }
};

/* ══════════════════════════════
   GET STREAK MESSAGE
   Personalised message based on streak
══════════════════════════════ */
const getStreakMessage = (streak) => {
  if (streak === 0)   return "Start today — your streak begins with one session!";
  if (streak === 1)   return "Great start! Come back tomorrow to build your streak.";
  if (streak < 3)     return "Building momentum! Keep going.";
  if (streak < 7)     return "You're on a roll! Don't stop now.";
  if (streak < 14)    return "🔥 One week strong! You're unstoppable.";
  if (streak < 30)    return "🔥🔥 Incredible consistency! You're a study machine.";
  return "🔥🔥🔥 Legendary dedication! You're an inspiration.";
};

/* ══════════════════════════════
   GET SCORE MESSAGE
   Personalised message based on score
══════════════════════════════ */
const getScoreMessage = (score) => {
  if (score >= 95) return { emoji: '🏆', message: 'Outstanding! Near-perfect score!' };
  if (score >= 80) return { emoji: '🎉', message: 'Excellent work! Keep it up.' };
  if (score >= 65) return { emoji: '👍', message: 'Good effort! Review the ones you missed.' };
  if (score >= 50) return { emoji: '📖', message: 'You\'re getting there. Keep practising.' };
  return { emoji: '💪', message: 'Don\'t give up! Every attempt makes you stronger.' };
};

/* ══════════════════════════════
   GET DAILY GOAL MESSAGE
   Based on focus minutes vs goal
══════════════════════════════ */
const getDailyGoalMessage = (focusMin, goalMin) => {
  if (focusMin === 0)              return "Start your first focus session today!";
  if (focusMin >= goalMin)         return `🎯 Daily goal reached! ${focusMin} minutes focused.`;
  const remaining = goalMin - focusMin;
  if (remaining <= 25)             return `Almost there! Just ${remaining} more minutes to hit your goal.`;
  return `${focusMin}/${goalMin} minutes today. Keep going!`;
};

/* ══════════════════════════════
   GET ACHIEVEMENT MESSAGE
   For badge unlock popups
══════════════════════════════ */
const getAchievementMessage = (badgeId) => {
  const messages = {
    first_quiz:    { emoji: '🎯', title: 'First Quiz Done!',     body: 'You took your first quiz. The journey begins!' },
    streak_3:      { emoji: '🔥', title: '3-Day Streak!',        body: 'Three days of consistent study. Keep the fire burning!' },
    streak_7:      { emoji: '⚡', title: '7-Day Streak!',        body: 'A full week of studying! You\'re building real discipline.' },
    perfect_score: { emoji: '💯', title: 'Perfect Score!',       body: 'You got 100%! Absolute mastery.' },
    quiz_10:       { emoji: '🏆', title: 'Quiz Master!',         body: 'Ten quizzes completed. You\'re a dedicated learner.' },
    all_subjects:  { emoji: '🌟', title: 'All-Rounder!',         body: 'You\'ve quizzed across every subject. Impressive range!' },
    speed_demon:   { emoji: '⏱️', title: 'Speed Demon!',         body: 'You finished a quiz in under 3 minutes. Lightning fast!' },
    bookworm:      { emoji: '📚', title: 'Bookworm!',            body: 'Ten notes saved. You\'re building a great knowledge base.' },
    top_score:     { emoji: '🥇', title: 'Top Student!',         body: 'Average score above 85%! You\'re at the top of your game.' },
  };
  return messages[badgeId] || { emoji: '🏅', title: 'Achievement Unlocked!', body: 'Keep up the great work!' };
};

/* ══════════════════════════════
   GET ALL QUOTES
   For frontend quote carousel
══════════════════════════════ */
const getAllQuotes = () => {
  return Object.values(QUOTES).flat();
};

module.exports = {
  getRandomQuote,
  getContextualQuote,
  getStreakMessage,
  getScoreMessage,
  getDailyGoalMessage,
  getAchievementMessage,
  getAllQuotes,
  QUOTES,
};