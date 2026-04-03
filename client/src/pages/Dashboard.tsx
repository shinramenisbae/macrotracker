import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CalorieRing from '../components/CalorieRing';
import MacroBar from '../components/MacroBar';
import FoodEntryCard from '../components/FoodEntryCard';
import { useGoals } from '../hooks/useGoals';
import { getEntries, getSummary } from '../lib/api';
import { todayStr, addDays, friendlyDate } from '../lib/utils';
import type { FoodEntry, DailySummary } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { goals } = useGoals();
  const [date, setDate] = useState(todayStr());
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [summary, setSummary] = useState<DailySummary>({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const [entryRes, summaryRes] = await Promise.all([getEntries(d), getSummary(d)]);
      setEntries(entryRes.entries);
      setSummary(summaryRes.totals);
    } catch {
      // API may not be running yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(date);
  }, [date, loadData]);

  const prevDay = () => setDate((d) => addDays(d, -1));
  const nextDay = () => {
    const next = addDays(date, 1);
    if (next <= todayStr()) setDate(next);
  };

  return (
    <div className="page-container">
      {/* Header with date nav */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">MacroTracker</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevDay} className="w-9 h-9 rounded-full bg-dark-card flex items-center justify-center active:bg-dark-border">
            ‹
          </button>
          <span className="text-sm font-medium min-w-[90px] text-center">
            {friendlyDate(date)}
          </span>
          <button
            onClick={nextDay}
            disabled={date === todayStr()}
            className="w-9 h-9 rounded-full bg-dark-card flex items-center justify-center active:bg-dark-border disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>

      {/* Calorie ring */}
      <CalorieRing current={summary.calories} goal={goals.calories} />

      {/* Macro bars */}
      <div className="card space-y-3 mb-4">
        <MacroBar label="P" current={summary.protein_g} goal={goals.protein_g} color="#60a5fa" />
        <MacroBar label="C" current={summary.carbs_g} goal={goals.carbs_g} color="#fbbf24" />
        <MacroBar label="F" current={summary.fat_g} goal={goals.fat_g} color="#fb923c" />
      </div>

      {/* Quick add buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => navigate('/scan')}
          className="btn-primary flex-1 flex items-center justify-center gap-2 h-12"
        >
          <span>📷</span> Scan Food
        </button>
        <button
          onClick={() => navigate('/scan?manual=1')}
          className="btn-secondary flex-1 flex items-center justify-center gap-2 h-12"
        >
          <span>＋</span> Add Manual
        </button>
      </div>

      {/* Food log */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-dark-muted uppercase tracking-wider">
          Today's Log
        </h2>
        {loading ? (
          <div className="text-center py-8 text-dark-muted">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-dark-muted">
            <p className="text-3xl mb-2">🍽️</p>
            <p>No food logged yet</p>
            <p className="text-sm mt-1">Scan or add your first meal</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <FoodEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
