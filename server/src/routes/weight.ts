import { Router, Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import db from '../db';
import { AppError } from '../middleware/errorHandler';

const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads'), 'progress');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const router = Router();

function nzToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

// GET /api/weight?days=30
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const today = nzToday();

    const entries = db.prepare(`
      SELECT * FROM weight_log
      WHERE date >= date(?, ?)
      ORDER BY date DESC
    `).all(today, `-${days} days`);

    res.json({ entries });
  } catch (err) {
    next(err);
  }
});

// POST /api/weight
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { weight_kg, date, notes } = req.body;

    if (!weight_kg || typeof weight_kg !== 'number' || weight_kg <= 0) {
      throw new AppError(400, 'INVALID_WEIGHT', 'weight_kg must be a positive number');
    }

    // Default to NZST date if none provided
const nzDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
const entryDate = date || nzDate;

    // Upsert: update if date exists, insert otherwise
    const existing = db.prepare('SELECT id FROM weight_log WHERE date = ?').get(entryDate) as any;

    // Handle progress photo
    let photoPath: string | null = null;
    const { photo } = req.body; // base64 string
    if (photo) {
      const filename = `progress-${entryDate}-${Date.now()}.jpg`;
      const filePath = path.join(UPLOADS_DIR, filename);
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      photoPath = `/uploads/progress/${filename}`;
    }

    if (existing) {
      if (photoPath) {
        db.prepare(`
          UPDATE weight_log SET weight_kg = ?, notes = ?, photo_path = ? WHERE date = ?
        `).run(weight_kg, notes || null, photoPath, entryDate);
      } else {
        db.prepare(`
          UPDATE weight_log SET weight_kg = ?, notes = ? WHERE date = ?
        `).run(weight_kg, notes || null, entryDate);
      }

      const entry = db.prepare('SELECT * FROM weight_log WHERE date = ?').get(entryDate);
      res.json({ entry });
    } else {
      const result = db.prepare(`
        INSERT INTO weight_log (weight_kg, date, notes, photo_path) VALUES (?, ?, ?, ?)
      `).run(weight_kg, entryDate, notes || null, photoPath);

      const entry = db.prepare('SELECT * FROM weight_log WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json({ entry });
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /api/weight/:id
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM weight_log WHERE id = ?').run(Number(id));

    if (result.changes === 0) {
      throw new AppError(404, 'WEIGHT_NOT_FOUND', `Weight entry ${id} not found`);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
