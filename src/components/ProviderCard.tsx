import { useState } from "react";
import type { ProviderUsage } from "../types/usage";
import { startLogin } from "../services/api";
import { ProviderLogo } from "./Brand";
import { UsageBar } from "./UsageBar";
import { ResetTimer } from "./ResetTimer";
import type { DockPosition } from "../services/windows";

const LABEL = { claude: "Claude", codex: "Codex" } as const;
const COMPANY = { claude: "Anthropic", codex: "OpenAI" } as const;
const REASON: Record<string, string> = {
  claude_cli_not_found: "Claude Code CLI not found. Install it to track usage.",
  claude_not_logged_in: "Sign in through the Claude CLI to continue.",
  subscription_usage_unavailable: "Subscription usage is not available from a local source.",
  codex_cli_not_found: "Codex CLI not found. Install it to track usage.",
  codex_not_logged_in: "Sign in through the Codex CLI to continue.",
  codex_subscription_usage_unavailable: "Codex did not return usage data. Try refreshing.",
};

export function ProviderCard({ usage, onDetach }: { usage: ProviderUsage; onDetach?: (provider: ProviderUsage["provider"], dock: DockPosition) => void }) {
  const [connecting, setConnecting] = useState(false);
  const needsLogin = usage.reason?.endsWith("_not_logged_in") ?? false;
  const handleConnect = async () => { setConnecting(true); try { await startLogin(usage.provider); } finally { setTimeout(() => setConnecting(false), 5000); } };

  return <section className={`provider-card provider-card--${usage.provider}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5"><ProviderLogo provider={usage.provider}/><div><h3 className="text-sm font-semibold text-slate-100">{LABEL[usage.provider]}</h3><p className="mt-0.5 text-[10px] text-slate-500">{COMPANY[usage.provider]}</p></div></div>
      <div className="flex items-center gap-1.5"><label className="detach-button" title="Open this provider as a separate always-on-top card"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2.5h6l-1 4 2 2H4l2-2-1-4ZM8 8.5v5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg><select aria-label={`Detach ${LABEL[usage.provider]} card`} defaultValue="" onChange={(event) => { const dock = event.target.value as DockPosition; if (dock) onDetach?.(usage.provider, dock); event.target.value = ""; }}><option value="" disabled>Detach</option><option value="top">Top island</option><option value="taskbar">Above taskbar</option><option value="side">Right side</option></select></label><span className={`status-pill ${usage.available ? "status-pill--online" : "status-pill--offline"}`}><span className="status-dot"/>{usage.available ? "Live" : "Offline"}</span></div>
    </div>
    {!usage.available ? <div className="mt-3 space-y-2"><p className="text-xs font-medium text-slate-300">{usage.reason?.endsWith("_cli_not_found") ? "CLI not installed" : needsLogin ? "Not logged in" : "Usage unavailable"}</p><p className="text-[10px] leading-relaxed text-slate-500">{(usage.reason && REASON[usage.reason]) ?? "Not available"}</p>{needsLogin && <button onClick={() => void handleConnect()} disabled={connecting} className="connect-button">{connecting ? "Check your browser..." : "Connect account"}</button>}</div> :
      <div className="mt-3 space-y-3.5">
        {usage.capabilities.session_usage && usage.session ? <div><UsageBar label="5 hour limit" remainingPercent={usage.session.remaining_percent} provider={usage.provider}/>{usage.capabilities.reset_time && <ResetTimer resetAt={usage.session.reset_at}/>}</div> : <p className="text-xs text-slate-500">5 hour usage unavailable</p>}
        {usage.capabilities.weekly_usage && usage.weekly ? <div><UsageBar label="Weekly limit" remainingPercent={usage.weekly.remaining_percent} provider={usage.provider}/>{usage.capabilities.reset_time && <ResetTimer resetAt={usage.weekly.reset_at}/>}</div> : <p className="text-xs text-slate-500">Weekly usage unavailable</p>}
      </div>}
  </section>;
}
