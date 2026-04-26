import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'Untitled',
      maxlength: 255,
    },
    icon: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page',
      default: null,
    },
    tags: [String],
    summary: String,
    wordCount: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
  },
  { timestamps: true }
);

pageSchema.index({ title: 'text', content: 'text' });
pageSchema.index({ parentId: 1 });

export default mongoose.model('Page', pageSchema);
