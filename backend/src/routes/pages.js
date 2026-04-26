import express from 'express';
import {
  getPageTree,
  getPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  movePage,
  searchPages,
} from '../controllers/pageController.js';

const router = express.Router();

router.get('/tree', getPageTree);
router.get('/search', searchPages);
router.get('/', getPages);
router.get('/:id', getPage);
router.post('/', createPage);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);
router.post('/:id/move', movePage);

export default router;
