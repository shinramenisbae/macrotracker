import { pct } from '../lib/utils';

interface Props {
  label: string;
  current: number;
  goal: number;
  color: string;
}

export default function MacroBar({ label, current, goal, color }: Props) {
  const percentage = pct(current, goal);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-dark-muted w-8 text-right font-medium">{label}</span>
      <div className="flex-1 h-3 bg-dark-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm text-dark-text w-20 text-right tabular-nums">
        {Math.round(current)}/{goal}g
      </span>
    </div>
  );
}
