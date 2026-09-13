import { getCurrentWindow } from "@tauri-apps/api/window";
import { KQuotaMark } from "./Brand";
import { RefreshButton } from "./RefreshButton";

interface WidgetHeaderProps { onRefresh: () => void; refreshing: boolean; onOpenSettings: () => void; }

const minimizeWindow = () => {
  if (!("__TAURI_INTERNALS__" in window)) return;
  void getCurrentWindow().minimize();
};

export function WidgetHeader({ onRefresh, refreshing, onOpenSettings }: WidgetHeaderProps) {
  return <header data-tauri-drag-region className="app-header flex items-center justify-between px-4 py-3 cursor-move">
    <div data-tauri-drag-region className="flex items-center gap-2.5"><KQuotaMark/><div data-tauri-drag-region className="leading-none"><div data-tauri-drag-region className="text-sm font-bold tracking-tight text-white">KQuota</div><div data-tauri-drag-region className="mt-1 text-[9px] font-medium uppercase tracking-[.18em] text-slate-500">AI usage</div></div></div>
    <div className="flex items-center gap-1">
      <RefreshButton onRefresh={onRefresh} spinning={refreshing}/>
      <button onClick={onOpenSettings} aria-label="Settings" className="icon-button"><svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true"><path d="M8.8 2.3h2.4l.5 1.8c.4.2.8.4 1.2.7l1.8-.5 1.2 2.1-1.3 1.3c.1.4.1.9 0 1.3l1.3 1.3-1.2 2.1-1.8-.5c-.4.3-.8.5-1.2.7l-.5 1.8H8.8l-.5-1.8c-.4-.2-.8-.4-1.2-.7l-1.8.5-1.2-2.1L5.4 9c-.1-.4-.1-.9 0-1.3L4.1 6.4l1.2-2.1 1.8.5c.4-.3.8-.5 1.2-.7l.5-1.8Z" fill="none" stroke="currentColor" strokeWidth="1.4"/><circle cx="10" cy="8.4" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.4"/></svg></button>
      <button onClick={minimizeWindow} aria-label="Minimize" title="Minimize" className="icon-button"><svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true"><path d="M4.5 10h11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></button>
    </div>
  </header>;
}
