/* routes/taskRoutes.js */
const router  = require('express').Router();
const { getTasks, getTask, createTask, updateTask, patchTask, deleteTask, deleteAllTasks } = require('../controllers/taskController');
const { protect }  = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { taskRules } = require('../utils/validation');

router.use(protect);
router.get('/',        getTasks);
router.delete('/all',  deleteAllTasks);
router.get('/:id',     getTask);
router.post('/',       taskRules, validate, createTask);
router.put('/:id',     updateTask);
router.patch('/:id',   patchTask);
router.delete('/:id',  deleteTask);

module.exports = router;