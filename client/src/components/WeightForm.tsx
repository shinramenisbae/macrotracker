import { useState } from 'react';

interface Props {
  onSubmit: (weight: number, notes?: string) => void;
  loading?: boolean;
}

export default function WeightForm({ onSubmit, loading }: Props) {
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(weight);
    if (w <= 0) return;
    onSubmit(w, notes || undefined);
    setWeight('');
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h3 className="font-semibold">Log Weight</h3>
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="input-field"
            placeholder="Weight (kg)"
            inputMode="decimal"
            required
          />
        </div>
        <button type="submit" disabled={loading || !weight} className="btn-primary h-[46px]">
          {loading ? '...' : 'Log'}
        </button>
      </div>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="input-field"
        placeholder="Notes (optional)"
      />
    </form>
  );
}
