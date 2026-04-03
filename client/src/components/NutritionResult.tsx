import type { FoodItem } from '../types';

interface Props {
  items: FoodItem[];
  onLog: (item: FoodItem, index: number) => void;
  onEdit: (item: FoodItem, index: number) => void;
  logging?: number | null;
  loggedIndices?: Set<number>;
}

const confidenceColor: Record<string, string> = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-red-400',
};

export default function NutritionResult({ items, onLog, onEdit, logging, loggedIndices }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-dark-muted uppercase tracking-wider">
        Results
      </h3>
      {items.map((item, i) => {
        const isLogged = loggedIndices?.has(i) ?? false;
        const isLogging = logging === i;

        return (
          <div
            key={i}
            className={`card space-y-3 transition-opacity ${isLogged ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-lg">
                  {isLogged && <span className="text-green-400 mr-1">✓</span>}
                  {item.name}
                </h4>
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
              {isLogged ? (
                <div className="flex-1 text-center py-2.5 text-sm text-green-400 font-medium">
                  ✓ Logged
                </div>
              ) : (
                <button
                  onClick={() => onLog(item, i)}
                  disabled={isLogging || isLogged}
                  className="btn-primary flex-1 text-sm h-11"
                >
                  {isLogging ? '...' : '✓ Log This'}
                </button>
              )}
              {!isLogged && (
                <button
                  onClick={() => onEdit(item, i)}
                  className="btn-secondary text-sm h-11 px-4"
                >
                  ✏️
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
