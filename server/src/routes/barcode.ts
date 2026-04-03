import { Router, Request, Response, NextFunction } from 'express';
import { lookupBarcode } from '../services/openfoodfacts';

const router = Router();

// GET /api/barcode/:code
router.get('/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.params.code as string;

    if (!code || !/^\d{4,14}$/.test(code)) {
      res.status(400).json({
        error: 'Invalid barcode format. Expected 4-14 digit number.',
        code: 'INVALID_BARCODE',
      });
      return;
    }

    const product = await lookupBarcode(code);
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

export default router;
