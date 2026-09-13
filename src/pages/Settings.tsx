import { useCallback, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { exit } from "@tauri-apps/plugin-process";
import { ProviderLogo } from "../components/Brand";
import { getSystemInfo, startLogin } from "../services/api";
import { getWindowPreferences, saveWindowPreferences, type WindowPreferences } from "../services/preferences";
import { closeProviderCard, openProviderCard } from "../services/windows";
import type { CliDetection, ProviderId, SystemInfo } from "../types/usage";

const LABEL = { claude: "Claude", codex: "Codex" } as const;
const INSTALL = { claude: "npm install -g @anthropic-ai/claude-code", codex: "npm install -g @openai/codex" } as const;

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`settings-toggle ${checked ? "settings-toggle--on" : ""}`}><span/></button>;
}

export function Settings({ onClose }: { onClose: () => void }) {
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [connecting, setConnecting] = useState<ProviderId | null>(null);
  const [prefs, setPrefs] = useState(getWindowPreferences);
  const [notice, setNotice] = useState("");
  const isTauri = "__TAURI_INTERNALS__" in window;
  const load = useCallback(async () => { try { setSystem(await getSystemInfo()); } catch { /* backend may be starting */ } }, []);

  useEffect(() => { void load(); const id = setInterval(() => void load(), 3000); return () => clearInterval(id); }, [load]);
  useEffect(() => { if (isTauri) void isEnabled().then((value) => setPrefs((p) => ({ ...p, launchAtStartup: value }))); }, [isTauri]);

  const flash = (message: string) => { setNotice(message); setTimeout(() => setNotice(""), 1800); };
  const update = async <K extends keyof WindowPreferences>(key: K, value: WindowPreferences[K]) => {
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      if (isTauri && key === "alwaysOnTop") await getCurrentWindow().setAlwaysOnTop(value as boolean);
      if (isTauri && key === "launchAtStartup") { if (value) await enable(); else await disable(); }
      if (isTauri && key === "openClaudeCard") { if (value) await openProviderCard("claude", next.defaultDock); else await closeProviderCard("claude"); }
      if (isTauri && key === "openCodexCard") { if (value) await openProviderCard("codex", next.defaultDock); else await closeProviderCard("codex"); }
      saveWindowPreferences(next); flash("Saved");
    } catch (error) { console.error(`Could not update ${key}`, error); setPrefs(previous); flash("Could not apply"); }
  };

  const visible = (provider: ProviderId) => provider === "claude" ? prefs.showClaude : prefs.showCodex;
  const setVisible = async (provider: ProviderId, show: boolean) => {
    const showKey = provider === "claude" ? "showClaude" : "showCodex";
    const openKey = provider === "claude" ? "openClaudeCard" : "openCodexCard";
    const next = { ...prefs, [showKey]: show, ...(!show ? { [openKey]: false } : {}) };
    setPrefs(next); saveWindowPreferences(next);
    if (!show && isTauri) await closeProviderCard(provider);
    flash(show ? `${LABEL[provider]} shown` : `${LABEL[provider]} hidden`);
  };

  const connect = async (provider: ProviderId) => { setConnecting(provider); try { await startLogin(provider); } finally { setTimeout(() => setConnecting(null), 5000); } };
  const rows: [ProviderId, CliDetection | undefined][] = [["claude", system?.claude_cli], ["codex", system?.codex_cli]];

  return <div className="app-shell h-screen w-screen flex flex-col">
    <header className="app-header flex items-center justify-between px-4 py-3"><div><h2 className="text-sm font-semibold text-white">Settings</h2><p className="mt-1 text-[9px] uppercase tracking-[.16em] text-slate-500">Preferences & connections</p></div><div className="flex items-center gap-2"><span className="text-[10px] text-emerald-400">{notice}</span><button onClick={onClose} className="icon-button text-lg" aria-label="Close settings">×</button></div></header>
    <main className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 text-xs">
      <section><h3 className="settings-heading">Window behavior</h3><div className="settings-panel">
        <div className="settings-row"><div><strong>Always on top</strong><p>Keep the dashboard above other windows.</p></div><Toggle label="Always on top" checked={prefs.alwaysOnTop} onChange={(v) => void update("alwaysOnTop", v)}/></div>
        <div className="settings-row"><div><strong>Launch with Windows</strong><p>Start KQuota when you sign in.</p></div><Toggle label="Launch with Windows" checked={prefs.launchAtStartup} onChange={(v) => void update("launchAtStartup", v)}/></div>
        <div className="settings-row"><div><strong>Default card position</strong><p>Where automatic cards appear.</p></div><select className="settings-select" value={prefs.defaultDock} onChange={(e) => void update("defaultDock", e.target.value as WindowPreferences["defaultDock"])}><option value="top">Top island</option><option value="taskbar">Taskbar</option><option value="side">Right side</option></select></div>
        {(["claude", "codex"] as ProviderId[]).map((provider) => <div className="settings-row" key={provider}><div><strong>Open {LABEL[provider]} card</strong><p>Show its detached card at startup.</p></div><Toggle label={`Open ${LABEL[provider]} card`} checked={provider === "claude" ? prefs.openClaudeCard : prefs.openCodexCard} onChange={(v) => void update(provider === "claude" ? "openClaudeCard" : "openCodexCard", v)}/></div>)}
      </div></section>
      <section><h3 className="settings-heading">Providers</h3><div className="space-y-2">{rows.map(([provider, cli]) => <div key={provider} className={`settings-account ${!visible(provider) ? "settings-account--hidden" : ""}`}>
        <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><ProviderLogo provider={provider} className="h-8 w-8"/><div><strong className="text-slate-200">{LABEL[provider]}</strong><p className="text-[10px] text-slate-500">{!cli ? "Checking CLI…" : cli.logged_in ? `Connected${cli.version ? ` · ${cli.version}` : ""}` : cli.installed ? "Ready to connect" : "CLI not installed"}</p></div></div><button className="provider-visibility" onClick={() => void setVisible(provider, !visible(provider))}>{visible(provider) ? "Hide" : "Show"}</button></div>
        {visible(provider) && cli?.installed && !cli.logged_in && <button className="connect-button !w-auto px-3 mt-2" onClick={() => void connect(provider)} disabled={connecting === provider}>{connecting === provider ? "Opening…" : "Connect"}</button>}
        {visible(provider) && cli && !cli.installed && <code className="mt-2 block overflow-hidden text-ellipsis whitespace-nowrap rounded bg-black/20 p-2 text-[9px] text-slate-500">{INSTALL[provider]}</code>}
      </div>)}</div></section>
      <section><h3 className="settings-heading">Application</h3><div className="settings-panel"><div className="settings-row"><div><strong>Quit KQuota</strong><p>Close all cards and stop the background process.</p></div><button className="quit-button" onClick={() => void exit(0)}>Quit app</button></div></div></section>
      <p className="pb-1 text-[10px] leading-relaxed text-slate-600">Authentication stays with the official local CLIs. KQuota does not store provider passwords.</p>
    </main>
  </div>;
}
