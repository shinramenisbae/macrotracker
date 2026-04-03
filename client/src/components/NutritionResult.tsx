import type { FoodItem } from '../types';

interface Props {
  items: FoodItem[];
  onLog: (item: FoodItem) => void;
  onEdit: (item: FoodItem) => void;
  logging?: boolean;
}

const confidenceColor: Record<string, string> = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-red-400',
};

export default function NutritionResult({ items, onLog, onEdit, logging }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-dark-muted uppercase tracking-wider">
        Results
      </h3>
      {items.map((item, i) => (
        <div key={i} className="card space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-lg">{item.name}</h4>
              {item.serving_size && (
                <p className="text-sm text-dark-muted">{item.serving_size}</p>
              )}
            </div>
            {item.confidence && (
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full bg-dark-bg ${
                  confidenceColor[item.confidence]
                }`}
              >
                {item.confidence}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-accent">{Math.round(item.calories)}</p>
              <p className="text-xs text-dark-muted">cal</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-400">{Math.round(item.protein_g)}</p>
              <p className="text-xs text-dark-muted">protein</p>
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-400">{Math.round(item.carbs_g)}</p>
              <p className="text-xs text-dark-muted">carbs</p>
            </div>
            <div>
              <p className="text-lg font-bold text-orange-400">{Math.round(item.fat_g)}</p>
              <p className="text-xs text-dark-muted">fat</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onLog(item)}
              disabled={logging}
              className="btn-primary flex-1 text-sm h-11"
            >
              {logging ? '...' : '✓ Log This'}
            </button>
            <button
              onClick={() => onEdit(item)}
              className="btn-secondary text-sm h-11 px-4"
            >
              ✏️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
