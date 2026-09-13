import { useEffect, useState } from "react";

function format(ms: number): string {
  if (ms <= 0) return "now";

  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function useCountdown(resetAt: string | null): {
  label: string;
  remainingMs: number;
  expired: boolean;
} {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!resetAt) {
    return { label: "unknown", remainingMs: 0, expired: false };
  }

  const remainingMs = new Date(resetAt).getTime() - now;
  return {
    label: format(remainingMs),
    remainingMs,
    expired: remainingMs <= 0,
  };
}
