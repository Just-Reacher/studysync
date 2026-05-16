/* routes/emailRoutes.js */
const router  = require('express').Router();
const { sendWeeklySummary, sendMotivation } = require('../controllers/emailController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/weekly-summary', sendWeeklySummary);
router.post('/motivation',     sendMotivation);

module.exports = router;