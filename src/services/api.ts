import type { CombinedUsage, ProviderUsage, SystemInfo } from "../types/usage";

const BASE_URL = "http://127.0.0.1:8765";

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getCombinedUsage(): Promise<CombinedUsage> {
  return getJson<CombinedUsage>("/api/usage");
}

export function getProviderUsage(provider: "claude" | "codex"): Promise<ProviderUsage> {
  return getJson<ProviderUsage>(`/api/usage/${provider}`);
}

export function refreshUsage(): Promise<CombinedUsage> {
  return getJson<CombinedUsage>("/api/refresh", { method: "POST" });
}

export function getSystemInfo(): Promise<SystemInfo> {
  return getJson<SystemInfo>("/api/system");
}

export function startLogin(provider: "claude" | "codex"): Promise<{ started: boolean }> {
  return getJson<{ started: boolean }>(`/api/auth/${provider}/login`, { method: "POST" });
}
