import express from 'express';
import {
  getFolderTree,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from '../controllers/folderController.js';

const router = express.Router();

router.get('/tree', getFolderTree);
router.get('/', getFolders);
router.post('/', createFolder);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);

export default router;
