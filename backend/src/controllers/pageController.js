import Page from '../models/Page.js';

const countWords = (text) => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const buildTree = async (parentId = null, folderId = undefined) => {
  const filter = { parentId };
  if (folderId !== undefined) filter.folderId = folderId;
  const pages = await Page.find(filter).sort({ updatedAt: -1 }).lean();
  return Promise.all(
    pages.map(async (page) => ({
      ...page,
      children: await buildTree(page._id),
    }))
  );
};

const deleteDescendants = async (pageId) => {
  const children = await Page.find({ parentId: pageId }).lean();
  for (const child of children) {
    await deleteDescendants(child._id);
  }
  await Page.deleteMany({ parentId: pageId });
};

export const getPageTree = async (req, res) => {
  try {
    const { folderId } = req.query;
    const folderFilter = folderId === 'null' ? null : folderId;
    const tree = await buildTree(null, folderFilter);
    res.json({ success: true, data: tree });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPages = async (req, res) => {
  try {
    const { parentId, folderId } = req.query;
    const filter = parentId ? { parentId } : { parentId: null };
    if (folderId !== undefined) filter.folderId = folderId === 'null' ? null : folderId;
    const pages = await Page.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, data: pages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, error: 'Page not found' });
    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createPage = async (req, res) => {
  try {
    const { title = 'Untitled', content = '', parentId = null, icon = '', tags = [], folderId = null } = req.body;
    const wordCount = countWords(content);
    const page = await Page.create({ title, content, parentId, icon, tags, wordCount, folderId });
    res.status(201).json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePage = async (req, res) => {
  try {
    const { title, content, icon, tags, summary, isPinned, folderId } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (icon !== undefined) update.icon = icon;
    if (content !== undefined) {
      update.content = content;
      update.wordCount = countWords(content);
    }
    if (tags !== undefined) update.tags = tags;
    if (summary !== undefined) update.summary = summary;
    if (isPinned !== undefined) update.isPinned = isPinned;
    if (folderId !== undefined) update.folderId = folderId;

    const page = await Page.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!page) return res.status(404).json({ success: false, error: 'Page not found' });
    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, error: 'Page not found' });

    await deleteDescendants(req.params.id);
    await Page.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { deletedId: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const movePage = async (req, res) => {
  try {
    const { parentId } = req.body;
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      { parentId: parentId || null },
      { new: true }
    );
    if (!page) return res.status(404).json({ success: false, error: 'Page not found' });
    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const searchPages = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json({ success: true, data: [] });
    const pages = await Page.find({ $text: { $search: query } }).sort({ score: { $meta: 'textScore' } });
    res.json({ success: true, data: pages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
