import { useState, useId } from 'react';
import type { FoodItem } from '../types';

interface Props {
  initial?: Partial<FoodItem>;
  onSubmit: (item: FoodItem & { meal?: string }) => void;
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
}

export default function FoodForm({ initial, onSubmit, onCancel, submitLabel = 'Save', loading }: Props) {
  const prefix = useId();
  const [name, setName] = useState(initial?.name ?? '');
  const [calories, setCalories] = useState(String(initial?.calories ?? ''));
  const [protein, setProtein] = useState(String(initial?.protein_g ?? ''));
  const [carbs, setCarbs] = useState(String(initial?.carbs_g ?? ''));
  const [fat, setFat] = useState(String(initial?.fat_g ?? ''));
  const [serving, setServing] = useState(initial?.serving_size ?? '');
  const [meal, setMeal] = useState((initial as any)?.meal ?? 'other');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim() || 'Unknown food',
      calories: Number(calories) || 0,
      protein_g: Number(protein) || 0,
      carbs_g: Number(carbs) || 0,
      fat_g: Number(fat) || 0,
      serving_size: serving || undefined,
      meal,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor={`${prefix}-name`} className="block text-sm text-dark-muted mb-1">Food Name</label>
        <input
          id={`${prefix}-name`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          placeholder="e.g. Grilled chicken"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${prefix}-cal`} className="block text-sm text-dark-muted mb-1">Calories</label>
          <input
            id={`${prefix}-cal`}
            type="number"
            min="0"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="input-field"
            placeholder="0"
            inputMode="numeric"
          />
        </div>
        <div>
          <label htmlFor={`${prefix}-pro`} className="block text-sm text-dark-muted mb-1">Protein (g)</label>
          <input
            id={`${prefix}-pro`}
            type="number"
            min="0"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="input-field"
            placeholder="0"
            inputMode="numeric"
          />
        </div>
        <div>
          <label htmlFor={`${prefix}-carb`} className="block text-sm text-dark-muted mb-1">Carbs (g)</label>
          <input
            id={`${prefix}-carb`}
            type="number"
            min="0"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            className="input-field"
            placeholder="0"
            inputMode="numeric"
          />
        </div>
        <div>
          <label htmlFor={`${prefix}-fat`} className="block text-sm text-dark-muted mb-1">Fat (g)</label>
          <input
            id={`${prefix}-fat`}
            type="number"
            min="0"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            className="input-field"
            placeholder="0"
            inputMode="numeric"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${prefix}-srv`} className="block text-sm text-dark-muted mb-1">Serving Size</label>
        <input
          id={`${prefix}-srv`}
          type="text"
          value={serving}
          onChange={(e) => setServing(e.target.value)}
          className="input-field"
          placeholder="e.g. 1 plate, 200g"
        />
      </div>

      <div>
        <label htmlFor={`${prefix}-meal`} className="block text-sm text-dark-muted mb-1">Meal</label>
        <select
          id={`${prefix}-meal`}
          value={meal}
          onChange={(e) => setMeal(e.target.value)}
          className="input-field"
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
      </div>
    </form>
  );
}
