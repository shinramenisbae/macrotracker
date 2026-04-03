import { Router, Request, Response, NextFunction } from 'express';
import db from '../db';
import { AppError } from '../middleware/errorHandler';

const router = Router();

function nzToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

// GET /api/entries?date=YYYY-MM-DD
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = (req.query.date as string) || nzToday();

    const entries = db.prepare(
      'SELECT * FROM food_entries WHERE date = ? ORDER BY logged_at DESC'
    ).all(date);

    res.json({ entries });
  } catch (err) {
    next(err);
  }
});

// POST /api/entries
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, calories, protein_g, carbs_g, fat_g, serving_size, meal, source, barcode, image_path, date } = req.body;

    if (!name) {
      throw new AppError(400, 'MISSING_NAME', 'Food name is required');
    }

    const entryDate = date || nzToday();

    const result = db.prepare(`
      INSERT INTO food_entries (name, calories, protein_g, carbs_g, fat_g, serving_size, meal, source, barcode, image_path, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      calories || 0,
      protein_g || 0,
      carbs_g || 0,
      fat_g || 0,
      serving_size || null,
      meal || 'other',
      source || 'manual',
      barcode || null,
      image_path || null,
      entryDate
    );

    const entry = db.prepare('SELECT * FROM food_entries WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
});

// PUT /api/entries/:id
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM food_entries WHERE id = ?').get(Number(id));

    if (!existing) {
      throw new AppError(404, 'ENTRY_NOT_FOUND', `Entry ${id} not found`);
    }

    const fields: string[] = [];
    const values: any[] = [];
    const allowedFields = ['name', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'serving_size', 'meal', 'source', 'barcode', 'image_path', 'date'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (fields.length === 0) {
      throw new AppError(400, 'NO_FIELDS', 'No fields to update');
    }

    fields.push("updated_at = datetime('now')");
    values.push(Number(id));

    db.prepare(`UPDATE food_entries SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const entry = db.prepare('SELECT * FROM food_entries WHERE id = ?').get(Number(id));
    res.json({ entry });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/entries/:id
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM food_entries WHERE id = ?').run(Number(id));

    if (result.changes === 0) {
      throw new AppError(404, 'ENTRY_NOT_FOUND', `Entry ${id} not found`);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
