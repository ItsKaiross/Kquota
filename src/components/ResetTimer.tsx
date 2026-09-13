import { useCountdown } from "../hooks/useCountdown";

interface ResetTimerProps {
  resetAt: string | null;
}

export function ResetTimer({ resetAt }: ResetTimerProps) {
  const { label } = useCountdown(resetAt);

  return (
    <span className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500">
      <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor"/><path d="M8 4.5V8l2.3 1.5" fill="none" stroke="currentColor" strokeLinecap="round"/></svg> Resets in {label}
    </span>
  );
}
