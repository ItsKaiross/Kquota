import type { ProviderUsage } from "../types/usage";
import { ProviderLogo } from "./Brand";

const PROVIDER_LABEL: Record<ProviderUsage["provider"], string> = {
  claude: "Claude",
  codex: "Codex",
};

interface CompactProviderProps {
  usage: ProviderUsage;
}

export function CompactProvider({ usage }: CompactProviderProps) {
  const remaining = usage.available && usage.session ? usage.session.remaining_percent : null;

  return (
    <div className="flex items-center justify-between text-xs px-2.5 py-1.5">
      <span className="flex items-center gap-1.5 font-medium w-18"><ProviderLogo provider={usage.provider} className="h-6 w-6"/>{PROVIDER_LABEL[usage.provider]}</span>
      {remaining === null ? (
        <span className="flex-1 mx-2 text-neutral-500">unavailable</span>
      ) : (
        <>
          <div className="flex-1 mx-2 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div
              className={`meter-fill meter-fill--${usage.provider}`}
              style={{ width: `${Math.min(100, remaining)}%` }}
            />
          </div>
          <span className="tabular-nums w-10 text-right">{Math.round(remaining)}%</span>
        </>
      )}
    </div>
  );
}
