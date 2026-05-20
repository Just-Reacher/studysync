/* ─────────────────────────────────────────────
   StudySync — routes/adminRoutes.js
   All /api/admin/* routes. Admin only.
───────────────────────────────────────────── */
const router = require('express').Router();
const {
  getDashboard,
  getUsers, getUser, getUserStats, getUserHistory, toggleUserActive, resetUserPassword, deleteUser,
  adminGetQuizzes, adminCreateQuiz, adminUpdateQuiz, adminDeleteQuiz,
  adminGetQuestions, adminCreateQuestion, adminUpdateQuestion, adminDeleteQuestion,
  adminGetNotes, adminCreateNote, adminUpdateNote, adminDeleteNote,
  getAnalytics,
  getLogs, exportLogs, clearLogs, getEmailLogs,
  sendMotivationBlast, sendWeeklyBlast, sendCustomBlast,
  getAdminProfile, updateAdminProfile, updateAdminPassword,
  getSmtpSettings, updateSmtpSettings, testSmtp, updateMaintenance, getSystemInfo,
} = require('../controllers/adminController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

/* ── Dashboard ── */
router.get('/dashboard', getDashboard);

/* ── Users ── */
router.get('/users',                      getUsers);
router.get('/users/:id',                  getUser);
router.get('/users/:id/stats',            getUserStats);
router.get('/users/:id/history',          getUserHistory);
router.patch('/users/:id/toggle-active',  toggleUserActive);
router.post('/users/:id/reset-password',  resetUserPassword);
router.delete('/users/:id',               deleteUser);

/* ── Quizzes ── */
router.get('/quizzes',        adminGetQuizzes);
router.post('/quizzes',       adminCreateQuiz);
router.put('/quizzes/:id',    adminUpdateQuiz);
router.delete('/quizzes/:id', adminDeleteQuiz);

/* ── Questions ── */
router.get('/questions',        adminGetQuestions);
router.post('/questions',       adminCreateQuestion);
router.put('/questions/:id',    adminUpdateQuestion);
router.delete('/questions/:id', adminDeleteQuestion);

/* ── Notes ── */
router.get('/notes',        adminGetNotes);
router.post('/notes',       adminCreateNote);
router.put('/notes/:id',    adminUpdateNote);
router.delete('/notes/:id', adminDeleteNote);

/* ── Analytics ── */
router.get('/analytics', getAnalytics);

/* ── Logs ── */
router.get('/logs',         getLogs);
router.get('/logs/export',  exportLogs);
router.delete('/logs/clear', clearLogs);
router.get('/email-logs',   getEmailLogs);

/* ── Emails ── */
router.post('/emails/motivation-blast', sendMotivationBlast);
router.post('/emails/weekly-blast',     sendWeeklyBlast);
router.post('/emails/custom-blast',     sendCustomBlast);

/* ── Settings ── */
router.get('/settings/profile',      getAdminProfile);
router.put('/settings/profile',      updateAdminProfile);
router.put('/settings/password',     updateAdminPassword);
router.get('/settings/smtp',         getSmtpSettings);
router.put('/settings/smtp',         updateSmtpSettings);
router.post('/settings/smtp/test',   testSmtp);
router.put('/settings/maintenance',  updateMaintenance);
router.get('/settings/system',       getSystemInfo);

module.exports = router;