import { getUsageLevel } from "../utils/usageLevel";
import type { ProviderId } from "../types/usage";

interface UsageBarProps {
  label: string;
  remainingPercent: number;
  provider: ProviderId;
}

export function UsageBar({ label, remainingPercent, provider }: UsageBarProps) {
  const clamped = Math.min(100, Math.max(0, remainingPercent));
  const level = getUsageLevel(clamped);

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-end justify-between text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-500"><strong className="text-[13px] font-semibold text-slate-200">{Math.round(clamped)}%</strong> left</span>
      </div>
      <div className="meter-track">
        <div
          className={`meter-fill meter-fill--${provider} meter-fill--${level}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
