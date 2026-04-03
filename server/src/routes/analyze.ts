import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { analyzeFood } from '../services/vision';
import { AppError } from '../middleware/errorHandler';
import fs from 'fs';
import path from 'path';

const router = Router();

// Configure multer for image uploads
const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only image files are allowed') as any);
    }
  },
});

// POST /api/analyze
// Accepts either { image: base64string } in JSON body or multipart file upload
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let imageBase64: string;

    if (req.body?.image) {
      // Base64 string in JSON body
      imageBase64 = req.body.image;
    } else {
      // Try multipart upload
      await new Promise<void>((resolve, reject) => {
        upload.single('image')(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      if (!req.file) {
        throw new AppError(400, 'NO_IMAGE', 'No image provided. Send base64 in body or upload a file.');
      }

      imageBase64 = req.file.buffer.toString('base64');
    }

    const result = await analyzeFood(imageBase64);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
