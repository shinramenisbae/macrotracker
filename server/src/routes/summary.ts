import { Router, Request, Response, NextFunction } from 'express';
import db from '../db';

const router = Router();

function nzToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

// GET /api/summary?date=YYYY-MM-DD
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = (req.query.date as string) || nzToday();

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

// GET /api/summary/history?days=14
router.get('/history', (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 14;
    const today = (req.query.today as string) || nzToday();

    // Get all food entries in range
    const entries = db.prepare(`
      SELECT * FROM food_entries
      WHERE date >= date(?, ?)
      ORDER BY date DESC, logged_at DESC
    `).all(today, `-${days} days`) as any[];

    // Get summaries per day
    const summaries = db.prepare(`
      SELECT
        date,
        COALESCE(SUM(calories), 0) as calories,
        COALESCE(SUM(protein_g), 0) as protein_g,
        COALESCE(SUM(carbs_g), 0) as carbs_g,
        COALESCE(SUM(fat_g), 0) as fat_g,
        COUNT(*) as entry_count
      FROM food_entries
      WHERE date >= date(?, ?)
      GROUP BY date
    `).all(today, `-${days} days`) as any[];

    // Build map
    const summaryMap: Record<string, any> = {};
    for (const s of summaries) summaryMap[s.date] = s;

    const entryMap: Record<string, any[]> = {};
    for (const e of entries) {
      if (!entryMap[e.date]) entryMap[e.date] = [];
      entryMap[e.date].push(e);
    }

    res.json({ summaryMap, entryMap, today });
  } catch (err) {
    next(err);
  }
});

export default router;
