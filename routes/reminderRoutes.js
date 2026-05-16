/* routes/reminderRoutes.js */
const router  = require('express').Router();
const { getReminders, getReminder, createReminder, updateReminder, patchReminder, deleteReminder } = require('../controllers/reminderController');
const { protect }   = require('../middleware/authMiddleware');
const { validate }  = require('../middleware/validateMiddleware');
const { reminderRules } = require('../utils/validation');

router.use(protect);
router.get('/',       getReminders);
router.get('/:id',    getReminder);
router.post('/',      reminderRules, validate, createReminder);
router.put('/:id',    updateReminder);
router.patch('/:id',  patchReminder);
router.delete('/:id', deleteReminder);

module.exports = router;