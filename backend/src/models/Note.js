import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 255,
    },
    content: {
      type: String,
      default: '',
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
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
  },
  { timestamps: true }
);

noteSchema.index({ title: 'text', content: 'text' });
noteSchema.index({ folderId: 1 });

export default mongoose.model('Note', noteSchema);
