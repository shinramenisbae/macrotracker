import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './db';
import { errorHandler } from './middleware/errorHandler';
import analyzeRouter from './routes/analyze';
import barcodeRouter from './routes/barcode';
import entriesRouter from './routes/entries';
import goalsRouter from './routes/goals';
import summaryRouter from './routes/summary';
import weightRouter from './routes/weight';

const app = express();
const PORT = parseInt(process.env.PORT || '5010', 10);

// Initialize database on startup
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' })); // Large enough for base64 images
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/analyze', analyzeRouter);
app.use('/api/barcode', barcodeRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/summary', summaryRouter);
app.use('/api/weight', weightRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MacroTracker API running on port ${PORT}`);
});

export default app;
