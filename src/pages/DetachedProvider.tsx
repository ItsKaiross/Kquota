import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ProviderLogo } from "../components/Brand";
import { useUsage } from "../hooks/useUsage";
import type { DockPosition } from "../services/windows";
import type { ProviderId } from "../types/usage";

const LABEL = { claude: "Claude", codex: "Codex" } as const;

function IslandMetric({ label, percent, provider }: { label: string; percent: number; provider: ProviderId }) {
  const value = Math.min(100, Math.max(0, percent));
  return <div className="island-metric"><div className="island-metric__label"><span>{label}</span><strong>{Math.round(value)}%</strong></div><div className="island-meter"><span className={`meter-fill meter-fill--${provider}`} style={{ width: `${value}%` }}/></div></div>;
}

export function DetachedProvider({ provider }: { provider: ProviderId }) {
  const { usage } = useUsage();
  const data = usage?.[provider];
  const dockParam = new URLSearchParams(window.location.search).get("dock");
  const dock: DockPosition = dockParam === "side" || dockParam === "taskbar" ? dockParam : "top";

  useEffect(() => {
    const card = getCurrentWindow();
    void card.setAlwaysOnTop(true);
    let cleanup: (() => void) | undefined;
    void card.onFocusChanged(({ payload }) => { if (payload) void card.setAlwaysOnTop(true); }).then((fn) => { cleanup = fn; });
    return () => cleanup?.();
  }, []);

  return <div className={`floating-card floating-card--${provider} floating-card--${dock}`}><div data-tauri-drag-region className="floating-card__content">
    <div data-tauri-drag-region className="island-brand"><ProviderLogo provider={provider} className="h-8 w-8"/><div data-tauri-drag-region><strong data-tauri-drag-region>{LABEL[provider]}</strong><span data-tauri-drag-region><i className={data?.available ? "is-online" : ""}/>{data?.available ? "Live" : "Waiting"}</span></div></div>
    <div data-tauri-drag-region className="island-divider"/>
    {!data?.available ? <div className="island-unavailable">Usage unavailable</div> : <div className="island-metrics">{data.session && <IslandMetric label="5 hour" percent={data.session.remaining_percent} provider={provider}/>} {data.weekly && <IslandMetric label="Weekly" percent={data.weekly.remaining_percent} provider={provider}/>}</div>}
    <button className="floating-close" aria-label="Close card" title="Close" onClick={() => void getCurrentWindow().close()}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 5 6 6m0-6-6 6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
  </div></div>;
}
