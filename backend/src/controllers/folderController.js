import Folder from '../models/Folder.js';
import Note from '../models/Note.js';

const buildTree = async (parentId = null) => {
  const folders = await Folder.find({ parentId }).lean();
  return Promise.all(
    folders.map(async (folder) => ({
      ...folder,
      children: await buildTree(folder._id),
    }))
  );
};

export const getFolderTree = async (req, res) => {
  try {
    const tree = await buildTree();
    res.json({ success: true, data: tree });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getFolders = async (req, res) => {
  try {
    const { parentId } = req.query;
    const filter = parentId ? { parentId } : { parentId: null };
    const folders = await Folder.find(filter).sort({ name: 1 });
    res.json({ success: true, data: folders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createFolder = async (req, res) => {
  try {
    const { name, parentId = null } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Folder name required' });

    const folder = await Folder.create({ name, parentId });
    res.status(201).json({ success: true, data: folder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateFolder = async (req, res) => {
  try {
    const { name } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;

    const folder = await Folder.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!folder) return res.status(404).json({ success: false, error: 'Folder not found' });
    res.json({ success: true, data: folder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const { moveToParent } = req.body;
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ success: false, error: 'Folder not found' });

    if (moveToParent) {
      await Folder.updateMany({ parentId: folder._id }, { parentId: folder.parentId });
      await Note.updateMany({ folderId: folder._id }, { folderId: folder.parentId });
    } else {
      await Folder.deleteMany({ parentId: folder._id });
      await Note.deleteMany({ folderId: folder._id });
    }

    await Folder.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { deletedId: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
