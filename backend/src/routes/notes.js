import express from 'express';
import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  moveNote,
  searchNotes,
} from '../controllers/noteController.js';

const router = express.Router();

router.get('/', getNotes);
router.get('/search', searchNotes);
router.get('/:id', getNote);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);
router.post('/:id/move', moveNote);

export default router;
