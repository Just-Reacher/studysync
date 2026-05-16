/* routes/noteRoutes.js */
const router  = require('express').Router();
const { getNotes, getNote, createNote, updateNote, patchNote, deleteNote } = require('../controllers/noteController');
const { protect }  = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { noteRules } = require('../utils/validation');

router.use(protect);
router.get('/',       getNotes);
router.get('/:id',    getNote);
router.post('/',      noteRules, validate, createNote);
router.put('/:id',    updateNote);
router.patch('/:id',  patchNote);
router.delete('/:id', deleteNote);

module.exports = router;