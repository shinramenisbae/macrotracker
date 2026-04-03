import { Router, Request, Response, NextFunction } from 'express';
import db from '../db';

const router = Router();

// GET /api/summary?date=YYYY-MM-DD
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

    const totals = db.prepare(`
      SELECT
        COALESCE(SUM(calories), 0) as calories,
        COALESCE(SUM(protein_g), 0) as protein_g,
        COALESCE(SUM(carbs_g), 0) as carbs_g,
        COALESCE(SUM(fat_g), 0) as fat_g,
        COUNT(*) as entry_count
      FROM food_entries
      WHERE date = ?
    `).get(date);

    res.json({ totals, date });
  } catch (err) {
    next(err);
  }
});

export default router;
