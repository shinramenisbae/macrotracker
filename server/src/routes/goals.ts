import { Router, Request, Response, NextFunction } from 'express';
import db from '../db';

const router = Router();

// GET /api/goals
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const goals = db.prepare('SELECT * FROM daily_goals WHERE id = 1').get();
    res.json({ goals });
  } catch (err) {
    next(err);
  }
});

// PUT /api/goals
router.put('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { calories, protein_g, carbs_g, fat_g } = req.body;

    const fields: string[] = [];
    const values: any[] = [];

    if (calories !== undefined) { fields.push('calories = ?'); values.push(calories); }
    if (protein_g !== undefined) { fields.push('protein_g = ?'); values.push(protein_g); }
    if (carbs_g !== undefined) { fields.push('carbs_g = ?'); values.push(carbs_g); }
    if (fat_g !== undefined) { fields.push('fat_g = ?'); values.push(fat_g); }
    if (req.body.goal_weight !== undefined) { fields.push('goal_weight = ?'); values.push(req.body.goal_weight); }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      db.prepare(`UPDATE daily_goals SET ${fields.join(', ')} WHERE id = 1`).run(...values);
    }

    const goals = db.prepare('SELECT * FROM daily_goals WHERE id = 1').get();
    res.json({ goals });
  } catch (err) {
    next(err);
  }
});

export default router;
