const express = require('express');
const {
  createNote,
  listNotes,
  getNote,
  updateNote,
  deleteNote
} = require('../controllers/noteController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Every notes route requires a valid JWT.
router.use(verifyToken);

router.post('/', createNote);
router.get('/', listNotes);
router.get('/:id', getNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
