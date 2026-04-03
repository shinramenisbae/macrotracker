import db from '../db';
import { AppError } from '../middleware/errorHandler';

const USER_AGENT = 'MacroTracker/1.0 (stephen@macrotracker.app)';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface BarcodeProduct {
  barcode: string;
  name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  serving_size: string | null;
  source?: string;
}

export function getCachedBarcode(barcode: string): BarcodeProduct | null {
  const row = db.prepare(
    'SELECT barcode, name, calories, protein_g, carbs_g, fat_g, serving_size FROM barcode_cache WHERE barcode = ?'
  ).get(barcode) as BarcodeProduct | undefined;

  return row || null;
}

// Source 1: Open Food Facts (global, largest free DB)
async function tryOpenFoodFacts(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!response.ok) return null;
    const data = await response.json() as any;
    if (data.status !== 1 || !data.product) return null;

    const product = data.product;
    const n = product.nutriments || {};

    return {
      barcode,
      name: product.product_name || product.product_name_en || 'Unknown product',
      calories: n['energy-kcal_serving'] ?? n['energy-kcal_100g'] ?? null,
      protein_g: n['proteins_serving'] ?? n['proteins_100g'] ?? null,
      carbs_g: n['carbohydrates_serving'] ?? n['carbohydrates_100g'] ?? null,
      fat_g: n['fat_serving'] ?? n['fat_100g'] ?? null,
      serving_size: product.serving_size || (n['energy-kcal_serving'] ? 'per serving' : 'per 100g'),
      source: 'Open Food Facts',
    };
  } catch {
    return null;
  }
}

// Source 2: Open Food Facts (NZ-specific database)
async function tryOpenFoodFactsNZ(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?cc=nz`, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!response.ok) return null;
    const data = await response.json() as any;
    if (data.status !== 1 || !data.product) return null;

    const product = data.product;
    const n = product.nutriments || {};

    if (!product.product_name && !product.product_name_en) return null;

    return {
      barcode,
      name: product.product_name || product.product_name_en || 'Unknown product',
      calories: n['energy-kcal_serving'] ?? n['energy-kcal_100g'] ?? null,
      protein_g: n['proteins_serving'] ?? n['proteins_100g'] ?? null,
      carbs_g: n['carbohydrates_serving'] ?? n['carbohydrates_100g'] ?? null,
      fat_g: n['fat_serving'] ?? n['fat_100g'] ?? null,
      serving_size: product.serving_size || (n['energy-kcal_serving'] ? 'per serving' : 'per 100g'),
      source: 'Open Food Facts NZ',
    };
  } catch {
    return null;
  }
}

// Source 3: UPC Item DB (free, community-maintained)
async function tryUpcItemDb(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!response.ok) return null;
    const data = await response.json() as any;
    if (!data.items || data.items.length === 0) return null;

    const item = data.items[0];
    return {
      barcode,
      name: item.title || 'Unknown product',
      calories: null, // UPC Item DB doesn't have nutrition
      protein_g: null,
      carbs_g: null,
      fat_g: null,
      serving_size: null,
      source: 'UPC Item DB',
    };
  } catch {
    return null;
  }
}

// Source 4: AI fallback — ask Gemini to identify the product from barcode
async function tryGeminiFallback(barcode: string): Promise<BarcodeProduct | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Identify this product by its barcode/EAN number: ${barcode}

If you can identify the product, return ONLY valid JSON (no markdown, no code fences):
{
  "name": "product name",
  "calories": estimated calories per serving (number),
  "protein_g": protein in grams (number),
  "carbs_g": carbs in grams (number),
  "fat_g": fat in grams (number),
  "serving_size": "serving description"
}

If you cannot identify the product, return: {"name": null}

Common barcode prefixes: 94 = New Zealand, 93 = Australia. Consider NZ/AU products.`
          }]
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json() as any;

    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.filter((p: any) => p.text).map((p: any) => p.text).join('');
    if (!text) return null;

    let jsonStr = text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();
    else {
      const jsonMatch = jsonStr.match(/(\{[\s\S]*\})/);
      if (jsonMatch) jsonStr = jsonMatch[1];
    }

    const result = JSON.parse(jsonStr);
    if (!result.name) return null;

    return {
      barcode,
      name: result.name,
      calories: result.calories ?? null,
      protein_g: result.protein_g ?? null,
      carbs_g: result.carbs_g ?? null,
      fat_g: result.fat_g ?? null,
      serving_size: result.serving_size ?? null,
      source: 'AI Estimate',
    };
  } catch {
    return null;
  }
}

function cacheProduct(product: BarcodeProduct): void {
  db.prepare(`
    INSERT OR REPLACE INTO barcode_cache (barcode, name, calories, protein_g, carbs_g, fat_g, serving_size, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    product.barcode,
    product.name,
    product.calories,
    product.protein_g,
    product.carbs_g,
    product.fat_g,
    product.serving_size,
    JSON.stringify({ source: product.source })
  );
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct> {
  // Check cache first
  const cached = getCachedBarcode(barcode);
  if (cached) return cached;

  // Try sources in order of reliability
  console.log(`Barcode lookup: ${barcode}`);

  // 1. Open Food Facts (global)
  let product = await tryOpenFoodFacts(barcode);
  if (product && product.name !== 'Unknown product') {
    console.log(`  Found in Open Food Facts`);
    cacheProduct(product);
    return product;
  }

  // 2. Open Food Facts NZ
  product = await tryOpenFoodFactsNZ(barcode);
  if (product) {
    console.log(`  Found in Open Food Facts NZ`);
    cacheProduct(product);
    return product;
  }

  // 3. UPC Item DB (may not have nutrition but at least gets the name)
  const upcProduct = await tryUpcItemDb(barcode);

  // 4. Gemini AI fallback
  product = await tryGeminiFallback(barcode);
  if (product) {
    // If UPC gave us a better name, use it
    if (upcProduct && upcProduct.name !== 'Unknown product') {
      product.name = upcProduct.name;
    }
    console.log(`  Found via AI: ${product.name}`);
    cacheProduct(product);
    return product;
  }

  // 5. If UPC found the name but no nutrition, return it anyway
  if (upcProduct) {
    console.log(`  Found name in UPC Item DB (no nutrition)`);
    cacheProduct(upcProduct);
    return upcProduct;
  }

  throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product not found for barcode: ${barcode}`);
}
