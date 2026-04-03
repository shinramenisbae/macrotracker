export interface FoodEntry {
  id: number;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size?: string;
  meal?: string;
  source?: string;
  barcode?: string;
  image_path?: string;
  logged_at: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size?: string;
  confidence?: 'low' | 'medium' | 'high';
}

export interface Goals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  goal_weight?: number;
}

export interface DailySummary {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface WeightEntry {
  id: number;
  weight_kg: number;
  date: string;
  notes?: string;
  photo_path?: string;
  created_at: string;
}

export interface AnalyzeResponse {
  items: FoodItem[];
}

export interface GoalWeight {
  goal_weight_kg: number;
}
