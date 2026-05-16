/* routes/quizRoutes.js */
const router  = require('express').Router();
const { getQuizzes, getQuiz, startQuiz, submitQuiz, getQuizReview } = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/',                getQuizzes);
router.get('/:id',             getQuiz);
router.post('/:id/start',      startQuiz);
router.post('/:id/submit',     submitQuiz);
router.get('/:id/review',      getQuizReview);

module.exports = router;