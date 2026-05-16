/* utils/helpers.js */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const paginate = (page = 1, limit = 20) => {
  const p      = Math.max(1, parseInt(page));
  const l      = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;
  return { limit: l, offset, page: p };
};

const sendSuccess = (res, data, status = 200) =>
  res.status(status).json(data);

const sendError = (res, message, status = 400) =>
  res.status(status).json({ message });

module.exports = { asyncHandler, paginate, sendSuccess, sendError };


/* ── formatDate.js ── */
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const formatDateTime = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

module.exports.formatDate     = formatDate;
module.exports.formatDateTime = formatDateTime;


/* ── calculateScore.js ── */
const calculateScore = (correct, total) => {
  if (!total || total === 0) return 0;
  return Math.round((correct / total) * 100);
};

module.exports.calculateScore = calculateScore;


/* ── validation.js ── */
const { body } = require('express-validator');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const taskRules = [
  body('title').trim().notEmpty().withMessage('Task title is required.'),
  body('priority').optional().isIn(['low','medium','high']).withMessage('Invalid priority.'),
];

const reminderRules = [
  body('title').trim().notEmpty().withMessage('Reminder title is required.'),
  body('time').notEmpty().withMessage('Time is required.'),
  body('type').optional().isIn(['prayer','study','school','custom']).withMessage('Invalid type.'),
  body('repeat').optional().isIn(['daily','weekdays','weekends','once']).withMessage('Invalid repeat.'),
];

const noteRules = [
  body('title').trim().notEmpty().withMessage('Note title is required.'),
  body('content').trim().notEmpty().withMessage('Content is required.'),
  body('subject').trim().notEmpty().withMessage('Subject is required.'),
];

const eventRules = [
  body('title').trim().notEmpty().withMessage('Event title is required.'),
  body('date').isDate().withMessage('Valid date is required.'),
];

module.exports.registerRules = registerRules;
module.exports.loginRules    = loginRules;
module.exports.taskRules     = taskRules;
module.exports.reminderRules = reminderRules;
module.exports.noteRules     = noteRules;
module.exports.eventRules    = eventRules;