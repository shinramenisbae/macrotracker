import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEntries, updateEntry, deleteEntry } from '../lib/api';
import type { FoodEntry } from '../types';

export default function FoodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<FoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [serving, setServing] = useState('');

  useEffect(() => {
    // We need to find the entry. Since there's no direct get-by-id endpoint,
    // we'll search today's entries and recent dates.
    const findEntry = async () => {
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        try {
          const res = await getEntries(dateStr);
          const found = res.entries.find((e) => e.id === Number(id));
          if (found) {
            setEntry(found);
            setName(found.name);
            setCalories(String(found.calories));
            setProtein(String(found.protein_g));
            setCarbs(String(found.carbs_g));
            setFat(String(found.fat_g));
            setServing(found.serving_size || '');
            setLoading(false);
            return;
          }
        } catch {
          continue;
        }
      }
      setLoading(false);
    };
    findEntry();
  }, [id]);

  const handleSave = async () => {
    if (!entry) return;
    setSaving(true);
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
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    try {
      await deleteEntry(entry.id);
      navigate('/');
    } catch {
      // handle error
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="text-center py-8 text-dark-muted">Loading...</div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="page-container">
        <div className="text-center py-8 text-dark-muted">
          <p>Entry not found</p>
          <button onClick={() => navigate('/')} className="text-accent mt-2">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const sourceLabel: Record<string, string> = {
    ai_photo: '📷 AI Photo',
    barcode: '🔍 Barcode',
    manual: '✏️ Manual',
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="text-accent text-sm font-medium">
          ← Back
        </button>
        <h1 className="text-xl font-bold">Food Detail</h1>
        <div className="w-12" />
      </div>

      <div className="mb-4 text-sm text-dark-muted flex items-center gap-2">
        <span>{sourceLabel[entry.source || 'manual'] || '🍴'}</span>
        <span>·</span>
        <span>{new Date(entry.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-dark-muted mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-dark-muted mb-1">Calories</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="input-field"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-muted mb-1">Protein (g)</label>
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="input-field"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-muted mb-1">Carbs (g)</label>
            <input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="input-field"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-muted mb-1">Fat (g)</label>
            <input
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="input-field"
              inputMode="numeric"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-dark-muted mb-1">Serving Size</label>
          <input
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
          <button onClick={handleDelete} className="btn-danger px-6">
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
