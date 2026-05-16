/* routes/progressRoutes.js */
const router  = require('express').Router();
const { getSummary, getSubjects, getActivity, getHistory, getStreak, getBadges } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/summary',  getSummary);
router.get('/subjects', getSubjects);
router.get('/activity', getActivity);
router.get('/history',  getHistory);
router.get('/streak',   getStreak);
router.get('/badges',   getBadges);

module.exports = router;