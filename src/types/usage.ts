export type ProviderId = "claude" | "codex";

export type ServiceStatus =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "unknown";

export type UsageSource =
  | "claude_code"
  | "codex_cli"
  | "anthropic_api"
  | "openai_api"
  | "unavailable";

export interface UsageWindow {
  window_hours: number | null;
  used_percent: number;
  remaining_percent: number;
  reset_at: string | null;
}

export interface UsageCapabilities {
  session_usage: boolean;
  weekly_usage: boolean;
  reset_time: boolean;
  service_status: boolean;
}

export interface ProviderUsage {
  provider: ProviderId;
  available: boolean;
  reason: string | null;
  session: UsageWindow | null;
  weekly: UsageWindow | null;
  status: ServiceStatus;
  usage_source: UsageSource;
  capabilities: UsageCapabilities;
  last_updated: string;
}

export type CombinedUsage = Record<ProviderId, ProviderUsage>;

export interface CliDetection {
  installed: boolean;
  version: string | null;
  logged_in: boolean;
}

export interface SystemInfo {
  claude_cli: CliDetection;
  codex_cli: CliDetection;
}
