import { useState, useEffect, useRef, useId } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEntry, updateEntry, deleteEntry } from '../lib/api';
import type { FoodEntry } from '../types';

const SOURCE_LABELS: Record<string, string> = {
  ai_photo: '📷 AI Photo',
  barcode: '🔍 Barcode',
  manual: '✏️ Manual',
};

export default function FoodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const prefix = useId();
  const mountedRef = useRef(true);

  const [entry, setEntry] = useState<FoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [serving, setServing] = useState('');

  useEffect(() => {
    mountedRef.current = true;
    const load = async () => {
      try {
        const res = await getEntry(Number(id));
        if (!mountedRef.current) return;
        const e = res.entry;
        setEntry(e);
        setName(e.name);
        setCalories(String(e.calories ?? ''));
        setProtein(String(e.protein_g ?? ''));
        setCarbs(String(e.carbs_g ?? ''));
        setFat(String(e.fat_g ?? ''));
        setServing(e.serving_size ?? '');
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load entry');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };
    load();
    return () => { mountedRef.current = false; };
  }, [id]);

  const handleSave = async () => {
    if (!entry) return;
    setSaving(true);
    setError(null);
    try {
      await updateEntry(entry.id, {
        name: name.trim(),
        calories: Number(calories) || 0,
        protein_g: Number(protein) || 0,
        carbs_g: Number(carbs) || 0,
        fat_g: Number(fat) || 0,
        serving_size: serving || undefined,
      });
      navigate(-1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry || !confirm('Delete this entry?')) return;
    try {
      await deleteEntry(entry.id);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center py-8">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-dark-muted mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="page-container">
        <div className="text-center py-8 text-dark-muted">
          <p>{error || 'Entry not found'}</p>
          <button onClick={() => navigate('/')} className="text-accent mt-2">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="text-accent text-sm font-medium">
          ← Back
        </button>
        <h1 className="text-xl font-bold">Food Detail</h1>
        <div className="w-12" />
      </div>

      <div className="mb-4 text-sm text-dark-muted flex items-center gap-2">
        <span aria-hidden="true">{SOURCE_LABELS[entry.source || 'manual'] || '🍴'}</span>
        <span>·</span>
        <span>{new Date(entry.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      {error && (
        <div className="card border-red-500/30 mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor={`${prefix}-name`} className="block text-sm text-dark-muted mb-1">Name</label>
          <input
            id={`${prefix}-name`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
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
            placeholder="e.g. 1 plate"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : '💾 Save'}
          </button>
          <button onClick={handleDelete} aria-label="Delete entry" className="btn-danger px-6">
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
