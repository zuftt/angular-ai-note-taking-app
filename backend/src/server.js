import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import pagesRouter from './routes/pages.js';
import foldersRouter from './routes/folders.js';
import aiRouter from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/notes-app';

app.use(express.json());
app.use(cors());

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✓ MongoDB connected'))
  .catch((err) => console.error('✗ MongoDB connection failed:', err.message));

app.use('/api/pages', pagesRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/ai', aiRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
