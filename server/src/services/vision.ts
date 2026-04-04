import { AppError } from '../middleware/errorHandler';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const VISION_MODEL = 'gemini-2.5-flash';

const ANALYSIS_PROMPT = `Analyze this food photo. Estimate the nutritional content for the visible portion/serving.
Return ONLY valid JSON (no markdown, no code fences):
{
  "items": [
    {
      "name": "food name",
      "serving_size": "estimated portion description",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "confidence": "low|medium|high"
    }
  ]
}
IMPORTANT RULES:
- ALWAYS list each food component separately. Never combine into one item like "chicken rice bowl".
- For example, a plate with chicken, rice, and vegetables should be 3 separate items.
- Include sauces, sides, and garnishes as separate items if they have nutritional value.
- Be as accurate as possible with calorie and macro estimates based on typical serving sizes visible in the photo.`;

export interface FoodItem {
  name: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface AnalysisResult {
  items: FoodItem[];
}

export async function analyzeFood(imageBase64: string): Promise<AnalysisResult> {
  if (!GEMINI_API_KEY) {
    throw new AppError(500, 'CONFIG_ERROR', 'Gemini API key not configured');
  }

  // Clean base64 - remove data URL prefix if present
  let cleanBase64 = imageBase64;
  let mimeType = 'image/jpeg';

  if (imageBase64.startsWith('data:')) {
    const match = imageBase64.match(/^data:(image\/\w+);base64,/);
    if (match) {
      mimeType = match[1];
      cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64,
              },
            },
            {
              text: ANALYSIS_PROMPT,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Gemini API error:', response.status, errorBody);
    throw new AppError(502, 'AI_API_ERROR', `AI analysis failed: ${response.status}`);
  }

  const data = await response.json() as any;

  // Gemini 2.5 may return multiple parts (thinking + text). Concatenate all text parts.
  const parts = data.candidates?.[0]?.content?.parts || [];
  const textContent = parts
    .filter((p: any) => p.text)
    .map((p: any) => p.text)
    .join('');

  if (!textContent) {
    throw new AppError(502, 'AI_PARSE_ERROR', 'No text response from AI');
  }

  try {
    let jsonStr = textContent.trim();

    // Strip ALL code fences (greedy — handles nested or multiple)
    jsonStr = jsonStr.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

    // Try to find a JSON object
    let parsed: any;
    const objMatch = jsonStr.match(/(\{[\s\S]*\})/);
    const arrMatch = jsonStr.match(/(\[[\s\S]*\])/);

    if (objMatch) {
      parsed = JSON.parse(objMatch[1]);
    } else if (arrMatch) {
      // Bare array — wrap it
      parsed = { items: JSON.parse(arrMatch[1]) };
    } else {
      throw new Error('No JSON found in response');
    }

    // Normalize: if response is an array, wrap it
    if (Array.isArray(parsed)) {
      parsed = { items: parsed };
    }

    // If items key doesn't exist but the object has food-like properties, wrap it
    if (!parsed.items && parsed.name) {
      parsed = { items: [parsed] };
    }

    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error('Invalid response structure');
    }

    return parsed as AnalysisResult;
  } catch (e) {
    console.error('Failed to parse AI response:', textContent.substring(0, 500));
    throw new AppError(502, 'AI_PARSE_ERROR', 'Failed to parse AI nutrition response');
  }
}
