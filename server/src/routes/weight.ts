import { Router, Request, Response, NextFunction } from 'express';
import db from '../db';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/weight?days=30
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const entries = db.prepare(`
      SELECT * FROM weight_log
      WHERE date >= date('now', ?)
      ORDER BY date DESC
    `).all(`-${days} days`);

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

    const entryDate = date || new Date().toISOString().split('T')[0];

    // Upsert: update if date exists, insert otherwise
    const existing = db.prepare('SELECT id FROM weight_log WHERE date = ?').get(entryDate) as any;

    if (existing) {
      db.prepare(`
        UPDATE weight_log SET weight_kg = ?, notes = ? WHERE date = ?
      `).run(weight_kg, notes || null, entryDate);

      const entry = db.prepare('SELECT * FROM weight_log WHERE date = ?').get(entryDate);
      res.json({ entry });
    } else {
      const result = db.prepare(`
        INSERT INTO weight_log (weight_kg, date, notes) VALUES (?, ?, ?)
      `).run(weight_kg, entryDate, notes || null);

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
