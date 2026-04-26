import Note from '../models/Note.js';

const countWords = (text) => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export const getNotes = async (req, res) => {
  try {
    const { folderId } = req.query;
    const filter = folderId ? { folderId } : { folderId: null };
    const notes = await Note.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createNote = async (req, res) => {
  try {
    const { title, content = '', folderId = null, tags = [] } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Title required' });

    const wordCount = countWords(content);
    const note = await Note.create({
      title,
      content,
      folderId,
      tags,
      wordCount,
    });
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { title, content, tags, summary, isPinned } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (content !== undefined) {
      update.content = content;
      update.wordCount = countWords(content);
    }
    if (tags !== undefined) update.tags = tags;
    if (summary !== undefined) update.summary = summary;
    if (isPinned !== undefined) update.isPinned = isPinned;

    const note = await Note.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
    res.json({ success: true, data: { deletedId: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const moveNote = async (req, res) => {
  try {
    const { folderId } = req.body;
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { folderId },
      { new: true }
    );
    if (!note) return res.status(404).json({ success: false, error: 'Note not found' });
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const searchNotes = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json({ success: true, data: [] });
    const notes = await Note.find({ $text: { $search: query } }).sort({ score: { $meta: 'textScore' } });
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
