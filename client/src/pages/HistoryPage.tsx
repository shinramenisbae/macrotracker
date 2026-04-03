import { useState, useEffect, useCallback } from 'react';
import { getEntries, getSummary } from '../lib/api';
import { todayStr, addDays, friendlyDate } from '../lib/utils';
import { useGoals } from '../hooks/useGoals';
import FoodEntryCard from '../components/FoodEntryCard';
import type { FoodEntry, DailySummary } from '../types';

interface DayData {
  date: string;
  summary: DailySummary;
  entries: FoodEntry[];
  expanded: boolean;
}

export default function HistoryPage() {
  const { goals } = useGoals();
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDays = useCallback(async () => {
    setLoading(true);
    const today = todayStr();
    const dayList: DayData[] = [];

    // Load last 14 days
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, -i);
      try {
        const [entryRes, summaryRes] = await Promise.all([
          getEntries(date),
          getSummary(date),
        ]);
        dayList.push({
          date,
          summary: summaryRes.totals,
          entries: entryRes.entries,
          expanded: false,
        });
      } catch {
        dayList.push({
          date,
          summary: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
          entries: [],
          expanded: false,
        });
      }
    }

    setDays(dayList);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDays();
  }, [loadDays]);

  const toggleDay = (idx: number) => {
    setDays((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, expanded: !d.expanded } : d))
    );
  };

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold mb-4">History</h1>

      {loading ? (
        <div className="text-center py-8 text-dark-muted">Loading...</div>
      ) : (
        <div className="space-y-2">
          {days.map((day, idx) => {
            const withinGoal = day.summary.calories <= goals.calories;
            const hasCals = day.summary.calories > 0;
            return (
              <div key={day.date}>
                <button
                  onClick={() => toggleDay(idx)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-dark-card border border-dark-border active:bg-dark-border transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {!hasCals ? '⚪' : withinGoal ? '✅' : '⚠️'}
                    </span>
                    <div className="text-left">
                      <p className="font-medium text-sm">{friendlyDate(day.date)}</p>
                      <p className="text-xs text-dark-muted">{day.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm tabular-nums">
                      {hasCals ? `${Math.round(day.summary.calories)} cal` : '—'}
                    </p>
                    <p className="text-xs text-dark-muted">
                      {day.entries.length} {day.entries.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </button>

                {day.expanded && day.entries.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1 mb-2">
                    {day.entries.map((entry) => (
                      <FoodEntryCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
