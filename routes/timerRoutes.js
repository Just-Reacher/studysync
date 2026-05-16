/* routes/timerRoutes.js */
const router  = require('express').Router();
const { createSession, getTodayStats, getSessions } = require('../controllers/timerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/sessions',  createSession);
router.get('/sessions',   getSessions);
router.get('/stats',      getTodayStats);

module.exports = router;