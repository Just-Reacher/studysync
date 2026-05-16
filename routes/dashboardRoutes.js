/* routes/dashboardRoutes.js */
const router  = require('express').Router();
const { getStats, getQuote, getNotification } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/stats',        getStats);
router.get('/quote',        getQuote);
router.get('/notification', getNotification);

module.exports = router;