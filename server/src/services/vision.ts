import { AppError } from '../middleware/errorHandler';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const VISION_MODEL = 'claude-sonnet-4-20250514';

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
  if (!ANTHROPIC_API_KEY) {
    throw new AppError(500, 'CONFIG_ERROR', 'Anthropic API key not configured');
  }

  // Detect media type from base64 header or default to jpeg
  let mediaType = 'image/jpeg';
  let cleanBase64 = imageBase64;

  if (imageBase64.startsWith('data:')) {
    const match = imageBase64.match(/^data:(image\/\w+);base64,/);
    if (match) {
      mediaType = match[1];
      cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    }
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: cleanBase64,
              },
            },
            {
              type: 'text',
              text: ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Anthropic API error:', response.status, errorBody);
    throw new AppError(502, 'AI_API_ERROR', `AI analysis failed: ${response.status}`);
  }

  const data = await response.json() as any;

  const textContent = data.content?.find((c: any) => c.type === 'text');
  if (!textContent?.text) {
    throw new AppError(502, 'AI_PARSE_ERROR', 'No text response from AI');
  }

  try {
    // Try to parse JSON, handling possible markdown code fences
    let jsonStr = textContent.text.trim();
    jsonStr = jsonStr.replace(/^```json?\s*\n?/, '').replace(/\n?```\s*$/, '');
    const result: AnalysisResult = JSON.parse(jsonStr);

    if (!result.items || !Array.isArray(result.items)) {
      throw new Error('Invalid response structure');
    }

    return result;
  } catch (e) {
    console.error('Failed to parse AI response:', textContent.text);
    throw new AppError(502, 'AI_PARSE_ERROR', 'Failed to parse AI nutrition response');
  }
}
