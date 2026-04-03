import { useState, useEffect, useCallback } from 'react';
import { getHistory, getWeightHistory } from '../lib/api';
import { todayStr, addDays, friendlyDate } from '../lib/utils';
import { useGoals } from '../hooks/useGoals';
import FoodEntryCard from '../components/FoodEntryCard';
import type { FoodEntry, DailySummary, WeightEntry } from '../types';

interface DayData {
  date: string;
  summary: DailySummary;
  entries: FoodEntry[];
}

export default function HistoryPage() {
  const { goals } = useGoals();
  const [days, setDays] = useState<DayData[]>([]);
  const [weightMap, setWeightMap] = useState<Record<string, WeightEntry>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loadDays = useCallback(async () => {
    setLoading(true);
    setError(null);
    const today = todayStr();

    try {
      // Single batch call instead of 28 individual calls
      const [historyRes, weightRes] = await Promise.all([
        getHistory(14, today),
        getWeightHistory(14).catch(() => ({ entries: [] as WeightEntry[] })),
      ]);

      // Build day list
      const dayList: DayData[] = [];
      for (let i = 0; i < 14; i++) {
        const date = addDays(today, -i);
        dayList.push({
          date,
          summary: historyRes.summaryMap[date] || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
          entries: historyRes.entryMap[date] || [],
        });
      }

      // Weight map
      const wMap: Record<string, WeightEntry> = {};
      for (const w of weightRes.entries) wMap[w.date] = w;

      setDays(dayList);
      setWeightMap(wMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDays();
  }, [loadDays]);

  // Day detail view
  if (selectedDate) {
    const day = days.find((d) => d.date === selectedDate);
    const weight = weightMap[selectedDate];

    return (
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setSelectedDate(null)}
            aria-label="Back to history"
            className="w-9 h-9 rounded-full bg-dark-card flex items-center justify-center active:bg-dark-border text-lg"
          >
            ‹
          </button>
          <div>
            <h1 className="text-xl font-bold">{friendlyDate(selectedDate)}</h1>
            <p className="text-xs text-dark-muted">{selectedDate}</p>
          </div>
        </div>

        {/* Macro summary card */}
        {day && day.summary.calories > 0 && (
          <div className="card mb-4">
            <h3 className="text-sm font-semibold text-dark-muted uppercase tracking-wider mb-3">
              Daily Totals
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-2xl font-bold text-accent">
                  {Math.round(day.summary.calories)}
                </p>
                <p className="text-xs text-dark-muted">cal</p>
                {goals.calories > 0 && (
                  <p className="text-xs text-dark-muted mt-0.5">
                    / {goals.calories}
                  </p>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {Math.round(day.summary.protein_g)}
                </p>
                <p className="text-xs text-dark-muted">protein</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">
                  {Math.round(day.summary.carbs_g)}
                </p>
                <p className="text-xs text-dark-muted">carbs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-400">
                  {Math.round(day.summary.fat_g)}
                </p>
                <p className="text-xs text-dark-muted">fat</p>
              </div>
            </div>
          </div>
        )}

        {/* Weight & progress photo */}
        {weight && (
          <div className="card mb-4">
            <h3 className="text-sm font-semibold text-dark-muted uppercase tracking-wider mb-3">
              Weight
            </h3>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold">{weight.weight_kg} kg</p>
              {weight.notes && (
                <p className="text-sm text-dark-muted">— {weight.notes}</p>
              )}
            </div>
            {weight.photo_path && (
              <img
                src={weight.photo_path}
                alt={`Progress photo for ${selectedDate}`}
                className="w-full aspect-[3/4] object-cover rounded-xl mt-3"
              />
            )}
          </div>
        )}

        {/* Food entries */}
        {day && day.entries.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-dark-muted uppercase tracking-wider mb-2">
              Food Log ({day.entries.length} items)
            </h3>
            {day.entries.map((entry) => (
              <FoodEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-dark-muted text-sm">
            No food logged this day
          </div>
        )}
      </div>
    );
  }

  // Day list view
  return (
    <div className="page-container">
      <h1 className="text-xl font-bold mb-4">History</h1>

      {loading && (
        <div className="flex flex-col items-center py-8">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-dark-muted mt-3">Loading...</p>
        </div>
      )}

      {error && (
        <div className="card border-red-500/30 mb-4">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={loadDays} className="text-accent text-sm mt-2">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-2">
          {days.map((day) => {
            const withinGoal = goals.calories > 0 && day.summary.calories <= goals.calories;
            const hasCals = day.summary.calories > 0;
            const weight = weightMap[day.date];
            const hasPhoto = !!weight?.photo_path;

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-dark-card border border-dark-border active:bg-dark-border transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg" role="img" aria-label={!hasCals ? 'No data' : withinGoal ? 'Within goal' : 'Over goal'}>
                    {!hasCals ? '⚪' : withinGoal ? '✅' : '⚠️'}
                  </span>
                  <div className="text-left">
                    <p className="font-medium text-sm">{friendlyDate(day.date)}</p>
                    <p className="text-xs text-dark-muted">{day.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-sm tabular-nums">
                      {hasCals ? `${Math.round(day.summary.calories)} cal` : '—'}
                    </p>
                    <p className="text-xs text-dark-muted">
                      {day.entries.length} {day.entries.length === 1 ? 'item' : 'items'}
                      {weight ? ` · ${weight.weight_kg}kg` : ''}
                      {hasPhoto ? ' 📸' : ''}
                    </p>
                  </div>
                  <span className="text-dark-muted text-sm" aria-hidden="true">›</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
