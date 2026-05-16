/* routes/authRoutes.js */
const router = require('express').Router();
const { register, login, forgotPassword, resetPassword, getMe } = require('../controllers/authController');
const { protect }      = require('../middleware/authMiddleware');
const { authRateLimit } = require('../middleware/rateLimitMiddleware');
const { validate }     = require('../middleware/validateMiddleware');
const { registerRules, loginRules } = require('../utils/validation');

router.post('/register',        authRateLimit, registerRules, validate, register);
router.post('/login',           authRateLimit, loginRules,    validate, login);
router.post('/forgot-password', authRateLimit, forgotPassword);
router.post('/reset-password',  authRateLimit, resetPassword);
router.get('/me',               protect, getMe);

module.exports = router;