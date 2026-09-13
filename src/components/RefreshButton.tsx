interface RefreshButtonProps { onRefresh: () => void; spinning?: boolean; }
export function RefreshButton({ onRefresh, spinning }: RefreshButtonProps) {
  return <button onClick={onRefresh} aria-label="Refresh" className="icon-button"><svg viewBox="0 0 20 20" className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} aria-hidden="true"><path d="M15.6 7.2A6 6 0 1 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M12.6 6.9h3.2V3.7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg></button>;
}
