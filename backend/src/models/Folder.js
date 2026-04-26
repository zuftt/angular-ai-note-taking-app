import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
  },
  { timestamps: true }
);

folderSchema.index({ parentId: 1 });

export default mongoose.model('Folder', folderSchema);
