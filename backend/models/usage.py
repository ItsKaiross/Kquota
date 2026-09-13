from typing import Literal, Optional

from pydantic import BaseModel

ProviderId = Literal["claude", "codex"]
ServiceStatus = Literal["operational", "degraded", "partial_outage", "major_outage", "unknown"]
UsageSource = Literal["claude_code", "codex_cli", "anthropic_api", "openai_api", "unavailable"]


class UsageWindow(BaseModel):
    window_hours: Optional[float] = None
    used_percent: int
    remaining_percent: int
    reset_at: Optional[str] = None


class UsageCapabilities(BaseModel):
    session_usage: bool
    weekly_usage: bool
    reset_time: bool
    service_status: bool


class ProviderUsage(BaseModel):
    provider: ProviderId
    available: bool
    reason: Optional[str] = None

    session: Optional[UsageWindow] = None
    weekly: Optional[UsageWindow] = None

    status: ServiceStatus = "unknown"
    usage_source: UsageSource
    capabilities: UsageCapabilities
    last_updated: str
