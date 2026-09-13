import { useEffect, useState } from "react";
import { Widget } from "./pages/Widget";
import { Settings } from "./pages/Settings";
import { DetachedProvider } from "./pages/DetachedProvider";
import type { ProviderId } from "./types/usage";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getWindowPreferences } from "./services/preferences";
import { openProviderCard } from "./services/windows";

type View = "widget" | "settings";

function DashboardApp() {
  const [view, setView] = useState<View>("widget");

  useEffect(() => {
    const prefs = getWindowPreferences();
    if (!("__TAURI_INTERNALS__" in window)) return;
    void getCurrentWindow().setAlwaysOnTop(prefs.alwaysOnTop);
    if (prefs.showClaude && prefs.openClaudeCard) void openProviderCard("claude", prefs.defaultDock).catch((error) => console.error("Claude island failed", JSON.stringify(error)));
    if (prefs.showCodex && prefs.openCodexCard) void openProviderCard("codex", prefs.defaultDock).catch((error) => console.error("Codex island failed", JSON.stringify(error)));
  }, []);

  if (view === "settings") {
    return <Settings onClose={() => setView("widget")} />;
  }

  return <Widget onOpenSettings={() => setView("settings")} />;
}

function App() {
  const cardProvider = new URLSearchParams(window.location.search).get("card");
  if (cardProvider === "claude" || cardProvider === "codex") return <DetachedProvider provider={cardProvider as ProviderId}/>;
  return <DashboardApp/>;
}

export default App;
