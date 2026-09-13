import { useEffect, useState } from "react";
import { WidgetHeader } from "../components/WidgetHeader";
import { ProviderCard } from "../components/ProviderCard";
import { CompactProvider } from "../components/CompactProvider";
import { useUsage } from "../hooks/useUsage";
import { openProviderCard } from "../services/windows";
import { getWindowPreferences } from "../services/preferences";

type WidgetMode = "normal" | "compact";

function secondsAgoLabel(iso: string | undefined, tick: number): string {
  if (!iso) return "--";
  void tick;
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
}

interface WidgetProps {
  onOpenSettings: () => void;
}

export function Widget({ onOpenSettings }: WidgetProps) {
  const preferences = getWindowPreferences();
  const [mode, setMode] = useState<WidgetMode>("normal");
  const [tick, setTick] = useState(0);
  const { usage, loading, error, refresh } = useUsage();

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const toggleMode = () =>
    setMode((prev) => (prev === "normal" ? "compact" : "normal"));

  const providers = usage ? Object.values(usage).filter((item) => item.provider === "claude" ? preferences.showClaude : preferences.showCodex) : [];
  const latestUpdate = providers
    .map((p) => p.last_updated)
    .sort()
    .at(-1);

  if (mode === "compact") {
    return (
      <div
        onDoubleClick={toggleMode}
        data-tauri-drag-region
        className="app-shell h-screen w-screen rounded-xl flex flex-col justify-center"
      >
        {providers.map((u) => (
          <CompactProvider key={u.provider} usage={u} />
        ))}
      </div>
    );
  }

  return (
    <div
      onDoubleClick={toggleMode}
      className="app-shell h-screen w-screen flex flex-col"
    >
      <WidgetHeader
        onRefresh={() => void refresh()}
        refreshing={loading}
        onOpenSettings={onOpenSettings}
      />

      <main className="flex-1 px-3.5 pb-3 space-y-2.5 overflow-y-auto">
        {loading && !usage && (
          <p className="text-xs text-neutral-500 px-1">Starting local service...</p>
        )}

        {error && !usage && (
          <p className="text-xs text-red-500 px-1">
            Could not reach the local usage service. Make sure the backend's Python
            virtual environment is set up on this machine (see README "Running it",
            step 2) — KQuota only auto-spawns it if <code>backend/.venv</code> already exists.
          </p>
        )}

        {providers.map((u) => (
          <ProviderCard key={u.provider} usage={u} onDetach={(provider, dock) => void openProviderCard(provider, dock)} />
        ))}
      </main>

      <div className="app-footer flex items-center justify-between px-4 py-2.5 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>Synced {secondsAgoLabel(latestUpdate, tick)}</span>
        <span>Double-click to compact</span>
      </div>
    </div>
  );
}
