import { pct } from '../lib/utils';

interface Props {
  current: number;
  goal: number;
}

export default function CalorieRing({ current, goal }: Props) {
  const percentage = pct(current, goal);
  const radius = 70;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const isOver = current > goal;

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Background ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth={stroke}
          />
          {/* Progress ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={isOver ? '#ef4444' : '#10b981'}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{Math.round(current)}</span>
          <span className="text-dark-muted text-sm">/ {goal} cal</span>
        </div>
      </div>
      <div className="mt-2 text-sm text-dark-muted">
        {goal - current > 0
          ? `${Math.round(goal - current)} remaining`
          : `${Math.round(current - goal)} over`}
      </div>
    </div>
  );
}
