import type { DockPosition } from "./windows";

export interface WindowPreferences {
  alwaysOnTop: boolean;
  launchAtStartup: boolean;
  defaultDock: DockPosition;
  openClaudeCard: boolean;
  openCodexCard: boolean;
  showClaude: boolean;
  showCodex: boolean;
}

export const DEFAULT_PREFERENCES: WindowPreferences = {
  alwaysOnTop: true,
  launchAtStartup: false,
  defaultDock: "top",
  openClaudeCard: false,
  openCodexCard: false,
  showClaude: true,
  showCodex: true,
};

const KEY = "kquota.window-preferences";

export function getWindowPreferences(): WindowPreferences {
  try { return { ...DEFAULT_PREFERENCES, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; }
  catch { return DEFAULT_PREFERENCES; }
}

export function saveWindowPreferences(value: WindowPreferences) {
  localStorage.setItem(KEY, JSON.stringify(value));
}
