/* routes/calendarRoutes.js */
const router  = require('express').Router();
const { getEvents, getEvent, createEvent, updateEvent, deleteEvent } = require('../controllers/calendarController');
const { protect }  = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { eventRules } = require('../utils/validation');

router.use(protect);
router.get('/events',        getEvents);
router.get('/events/:id',    getEvent);
router.post('/events',       eventRules, validate, createEvent);
router.put('/events/:id',    updateEvent);
router.delete('/events/:id', deleteEvent);

module.exports = router;