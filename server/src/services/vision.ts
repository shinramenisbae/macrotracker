import { AppError } from '../middleware/errorHandler';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const VISION_MODEL = 'gemini-2.0-flash';

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
If multiple distinct foods are visible, list each separately.
Be as accurate as possible with calorie and macro estimates based on typical serving sizes visible in the photo.`;

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
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Gemini API error:', response.status, errorBody);
    throw new AppError(502, 'AI_API_ERROR', `AI analysis failed: ${response.status}`);
  }

  const data = await response.json() as any;

  const textContent = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
  if (!textContent) {
    throw new AppError(502, 'AI_PARSE_ERROR', 'No text response from AI');
  }

  try {
    // Try to parse JSON, handling possible markdown code fences
    let jsonStr = textContent.trim();
    jsonStr = jsonStr.replace(/^```json?\s*\n?/, '').replace(/\n?```\s*$/, '');
    const result: AnalysisResult = JSON.parse(jsonStr);

    if (!result.items || !Array.isArray(result.items)) {
      throw new Error('Invalid response structure');
    }

    return result;
  } catch (e) {
    console.error('Failed to parse AI response:', textContent);
    throw new AppError(502, 'AI_PARSE_ERROR', 'Failed to parse AI nutrition response');
  }
}
