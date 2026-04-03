import { useNavigate } from 'react-router-dom';
import type { FoodEntry } from '../types';

interface Props {
  entry: FoodEntry;
}

const mealEmoji: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥪',
  dinner: '🍽️',
  snack: '🍌',
  other: '🍴',
};

export default function FoodEntryCard({ entry }: Props) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/entry/${entry.id}`)}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark-card border border-dark-border active:bg-dark-border transition-colors text-left"
    >
      <span className="text-2xl w-8 text-center">
        {mealEmoji[entry.meal || 'other'] || '🍴'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.name}</p>
        <p className="text-xs text-dark-muted">
          P:{Math.round(entry.protein_g)}g · C:{Math.round(entry.carbs_g)}g · F:{Math.round(entry.fat_g)}g
        </p>
      </div>
      <span className="text-sm font-semibold text-accent tabular-nums">
        {Math.round(entry.calories)}
      </span>
    </button>
  );
}
