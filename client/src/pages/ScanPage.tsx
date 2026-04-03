import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import BarcodeScanner from '../components/BarcodeScanner';
import NutritionResult from '../components/NutritionResult';
import FoodForm from '../components/FoodForm';
import { analyzePhoto, lookupBarcode, createEntry } from '../lib/api';
import { todayStr } from '../lib/utils';
import type { FoodItem } from '../types';

type Tab = 'photo' | 'barcode';

export default function ScanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showManual = searchParams.get('manual') === '1';

  const [tab, setTab] = useState<Tab>('photo');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loggedIndices, setLoggedIndices] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [manualMode, setManualMode] = useState(showManual);

  const handlePhotoCapture = useCallback(async (base64: string) => {
    setAnalyzing(true);
    setError(null);
    setResults([]);
    setLoggedIndices(new Set());
    try {
      const res = await analyzePhoto(base64);
      setResults(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleBarcodeScan = useCallback(async (code: string) => {
    setAnalyzing(true);
    setError(null);
    setResults([]);
    setLoggedIndices(new Set());
    try {
      const res = await lookupBarcode(code);
      setResults([res.product]);
    } catch {
      setError(`Product not found for barcode: ${code}`);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleLog = useCallback(
    async (item: FoodItem, index: number) => {
      setLogging(index);
      try {
        await createEntry({
          name: item.name,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
          serving_size: item.serving_size,
          source: tab === 'barcode' ? 'barcode' : 'ai_photo',
          date: todayStr(),
        });
        setLoggedIndices((prev) => new Set(prev).add(index));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to log');
      } finally {
        setLogging(null);
      }
    },
    [tab]
  );

  const allLogged = results.length > 0 && loggedIndices.size === results.length;

  const handleManualSubmit = useCallback(
    async (item: FoodItem & { meal?: string }) => {
      setLogging(-1);
      try {
        await createEntry({
          ...item,
          source: 'manual',
          date: todayStr(),
        });
        navigate('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to log');
      } finally {
        setLogging(null);
      }
    },
    [navigate]
  );

  const handleEditSubmit = useCallback(
    async (item: FoodItem & { meal?: string }) => {
      if (editingIndex === null) return;
      setLogging(editingIndex);
      try {
        await createEntry({
          ...item,
          source: tab === 'barcode' ? 'barcode' : 'ai_photo',
          date: todayStr(),
        });
        // Update results with edited values
        setResults((prev) =>
          prev.map((r, i) => (i === editingIndex ? { ...r, ...item } : r))
        );
        setLoggedIndices((prev) => new Set(prev).add(editingIndex));
        setEditingIndex(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to log');
      } finally {
        setLogging(null);
      }
    },
    [editingIndex, tab]
  );

  // Manual entry mode
  if (manualMode) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Add Food</h1>
        </div>
        <FoodForm
          onSubmit={handleManualSubmit}
          onCancel={() => setManualMode(false)}
          submitLabel="Log Food"
          loading={logging === -1}
        />
        {error && <p className="text-sm text-red-400 mt-3 text-center">{error}</p>}
      </div>
    );
  }

  // Edit mode — edit a scanned/photo item before logging
  if (editingIndex !== null && results[editingIndex]) {
    const item = results[editingIndex];
    return (
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Edit Food</h1>
        </div>
        <FoodForm
          initial={item}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingIndex(null)}
          submitLabel="Log Food"
          loading={logging === editingIndex}
        />
        {error && <p className="text-sm text-red-400 mt-3 text-center">{error}</p>}
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Scan Food</h1>
        <button
          onClick={() => setManualMode(true)}
          className="text-sm text-accent font-medium"
        >
          + Manual
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-card rounded-xl p-1 mb-4">
        {(['photo', 'barcode'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setResults([]);
              setLoggedIndices(new Set());
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-accent text-white' : 'text-dark-muted'
            }`}
          >
            {t === 'photo' ? '📷 Photo' : '🔍 Barcode'}
          </button>
        ))}
      </div>

      {/* Camera / Scanner */}
      {tab === 'photo' ? (
        <CameraCapture onCapture={handlePhotoCapture} disabled={analyzing} />
      ) : (
        <BarcodeScanner onScan={handleBarcodeScan} active={tab === 'barcode'} />
      )}

      {/* Loading */}
      {analyzing && (
        <div className="flex flex-col items-center py-8">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-dark-muted mt-3">Analyzing...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card mt-4 border-red-500/30">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      <div className="mt-4">
        <NutritionResult
          items={results}
          onLog={handleLog}
          onEdit={(_item, index) => setEditingIndex(index)}
          logging={logging}
          loggedIndices={loggedIndices}
        />
      </div>

      {/* Done button */}
      {allLogged && (
        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 btn-primary h-14 text-lg font-semibold"
        >
          ✅ Done — View Dashboard
        </button>
      )}

      {loggedIndices.size > 0 && !allLogged && (
        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 btn-secondary h-12 text-sm"
        >
          Done ({loggedIndices.size}/{results.length} logged) — View Dashboard
        </button>
      )}
    </div>
  );
}
