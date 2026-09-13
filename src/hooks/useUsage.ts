import { useCallback, useEffect, useRef, useState } from "react";
import { getCombinedUsage, refreshUsage } from "../services/api";
import type { CombinedUsage } from "../types/usage";

const AUTO_REFRESH_MS = 60_000;

export function useUsage() {
  const [usage, setUsage] = useState<CombinedUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const load = useCallback(async (): Promise<boolean> => {
    if (busy.current) return false;
    busy.current = true;
    try {
      const data = await getCombinedUsage();
      setUsage(data);
      setError(null);
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    } finally {
      busy.current = false;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const data = await refreshUsage();
      setUsage(data);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryId: ReturnType<typeof setTimeout>;

    const attempt = async () => {
      const ok = await load();
      if (cancelled) return;
      setLoading(false);
      if (!ok) {
        // Backend may still be starting up (spawned alongside the window).
        retryId = setTimeout(attempt, 2000);
      }
    };
    void attempt();

    return () => {
      cancelled = true;
      clearTimeout(retryId);
    };
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => void load(), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return { usage, loading, error, refresh };
}
