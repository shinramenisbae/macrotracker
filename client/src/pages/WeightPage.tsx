import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import WeightForm from '../components/WeightForm';
import { getWeightHistory, logWeight, deleteWeight, getGoals, updateGoals } from '../lib/api';
import { todayStr } from '../lib/utils';
import type { WeightEntry } from '../types';

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [logging, setLogging] = useState(false);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await getWeightHistory(90);
      setEntries(res.entries);
    } catch {
      // API may not be running
    }
  }, []);

  useEffect(() => {
    load();
    // Load goal weight from server
    getGoals().then((res) => {
      if (res.goals?.goal_weight != null && res.goals.goal_weight > 0) {
        setGoalWeight(res.goals.goal_weight);
      }
    }).catch(() => {});
  }, [load]);

  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const handleLog = async (weight: number, notes?: string, photo?: string) => {
    setLogging(true);
    try {
      await logWeight(weight, todayStr(), notes, photo);
      await load();
    } catch {
      // handle error
    } finally {
      setLogging(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWeight(id);
      await load();
    } catch {
      // handle error
    }
  };

  const handleGoalSave = async () => {
    const g = Number(goalInput);
    if (g > 0) {
      setGoalWeight(g);
      try {
        await updateGoals({ goal_weight: g });
      } catch {
        // fallback
      }
    }
    setEditingGoal(false);
  };

  const chartData = [...entries]
    .reverse()
    .map((e) => ({
      date: e.date.slice(5), // MM-DD
      weight: e.weight_kg,
    }));

  const latest = entries[0];

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold mb-4">Weight</h1>

      {/* Current weight card */}
      <div className="card mb-4 flex items-center justify-between">
        <div>
          <p className="text-dark-muted text-sm">Current</p>
          <p className="text-3xl font-bold">
            {latest ? `${latest.weight_kg} kg` : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-dark-muted text-sm">Goal</p>
          {editingGoal ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="input-field w-20 text-sm py-1"
                placeholder="kg"
                inputMode="decimal"
              />
              <button onClick={handleGoalSave} className="text-accent text-sm font-medium">
                ✓
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setGoalInput(goalWeight ? String(goalWeight) : '');
                setEditingGoal(true);
              }}
              className="text-2xl font-bold text-accent"
            >
              {goalWeight ? `${goalWeight} kg` : 'Set'}
            </button>
          )}
        </div>
      </div>

      {/* Weight chart */}
      {chartData.length >= 1 && (
        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-dark-muted mb-3">Trend (90 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                stroke="#888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={['dataMin - 1', 'dataMax + 1']}
                stroke="#888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
                activeDot={{ r: 5 }}
              />
              {goalWeight && (
                <ReferenceLine
                  y={goalWeight}
                  stroke="#fbbf24"
                  strokeDasharray="5 5"
                  label={{ value: 'Goal', fill: '#fbbf24', fontSize: 10 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log form */}
      <WeightForm onSubmit={handleLog} loading={logging} />

      {/* Recent entries */}
      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold text-dark-muted uppercase tracking-wider">
          Recent
        </h3>
        {entries.length === 0 ? (
          <p className="text-center py-4 text-dark-muted text-sm">No weight entries yet</p>
        ) : (
          entries.slice(0, 10).map((e) => (
            <div
              key={e.id}
              className="p-3 rounded-xl bg-dark-card border border-dark-border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{e.weight_kg} kg</span>
                  <span className="text-dark-muted text-sm ml-2">{e.date}</span>
                  {e.notes && (
                    <span className="text-dark-muted text-xs ml-2">— {e.notes}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {e.photo_path && (
                    <button
                      onClick={() => setViewingPhoto(e.photo_path!)}
                      className="text-accent text-sm p-2"
                    >
                      📸
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="text-dark-muted text-sm active:text-red-400 p-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {e.photo_path && viewingPhoto === e.photo_path && (
                <img
                  src={e.photo_path}
                  alt="Progress"
                  className="w-full aspect-[3/4] object-cover rounded-xl mt-3 cursor-pointer"
                  onClick={() => setViewingPhoto(null)}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
