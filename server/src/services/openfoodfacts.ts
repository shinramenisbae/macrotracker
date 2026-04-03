import fetch from 'node-fetch';
import db from '../db';
import { AppError } from '../middleware/errorHandler';

const OFF_BASE_URL = 'https://world.openfoodfacts.org/api/v2/product';
const USER_AGENT = 'MacroTracker/1.0';

export interface BarcodeProduct {
  barcode: string;
  name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  serving_size: string | null;
}

export function getCachedBarcode(barcode: string): BarcodeProduct | null {
  const row = db.prepare(
    'SELECT barcode, name, calories, protein_g, carbs_g, fat_g, serving_size FROM barcode_cache WHERE barcode = ?'
  ).get(barcode) as BarcodeProduct | undefined;

  return row || null;
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct> {
  // Check cache first
  const cached = getCachedBarcode(barcode);
  if (cached) {
    return cached;
  }

  // Fetch from Open Food Facts
  const response = await fetch(`${OFF_BASE_URL}/${barcode}.json`, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new AppError(502, 'OFF_API_ERROR', 'Failed to fetch from Open Food Facts');
  }

  const data = await response.json() as any;

  if (data.status !== 1 || !data.product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product not found for barcode: ${barcode}`);
  }

  const product = data.product;
  const nutriments = product.nutriments || {};

  const result: BarcodeProduct = {
    barcode,
    name: product.product_name || 'Unknown product',
    calories: nutriments['energy-kcal_serving'] ?? nutriments['energy-kcal_100g'] ?? null,
    protein_g: nutriments['proteins_serving'] ?? nutriments['proteins_100g'] ?? null,
    carbs_g: nutriments['carbohydrates_serving'] ?? nutriments['carbohydrates_100g'] ?? null,
    fat_g: nutriments['fat_serving'] ?? nutriments['fat_100g'] ?? null,
    serving_size: product.serving_size || null,
  };

  // Cache the result
  db.prepare(`
    INSERT OR REPLACE INTO barcode_cache (barcode, name, calories, protein_g, carbs_g, fat_g, serving_size, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    result.barcode,
    result.name,
    result.calories,
    result.protein_g,
    result.carbs_g,
    result.fat_g,
    result.serving_size,
    JSON.stringify(data.product)
  );

  return result;
}
