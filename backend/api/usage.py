from fastapi import APIRouter, HTTPException

from core.cache import TTLCache
from core.config import STATUS_CACHE_SECONDS, USAGE_CACHE_SECONDS
from models.status import StatusReport
from models.usage import ProviderUsage
from services.status.anthropic import AnthropicStatusProvider
from services.status.openai import OpenAIStatusProvider
from services.usage.claude import ClaudeSubscriptionProvider
from services.usage.codex import CodexSubscriptionProvider

router = APIRouter()

_usage_providers = {
    "claude": ClaudeSubscriptionProvider(),
    "codex": CodexSubscriptionProvider(),
}

_status_providers = {
    "claude": AnthropicStatusProvider(),
    "codex": OpenAIStatusProvider(),
}

_usage_cache = {pid: TTLCache[ProviderUsage](USAGE_CACHE_SECONDS) for pid in _usage_providers}
_status_cache = {pid: TTLCache[StatusReport](STATUS_CACHE_SECONDS) for pid in _status_providers}


async def _resolve(provider_id: str, force: bool = False) -> ProviderUsage:
    usage = await _usage_cache[provider_id].get_or_fetch(
        _usage_providers[provider_id].get_usage, force=force
    )
    status_report = await _status_cache[provider_id].get_or_fetch(
        _status_providers[provider_id].get_status, force=force
    )
    return usage.model_copy(update={"status": status_report.status})


@router.get("/api/usage")
async def get_combined_usage() -> dict[str, ProviderUsage]:
    return {pid: await _resolve(pid) for pid in _usage_providers}


@router.get("/api/usage/{provider_id}")
async def get_provider_usage(provider_id: str) -> ProviderUsage:
    if provider_id not in _usage_providers:
        raise HTTPException(status_code=404, detail="unknown_provider")
    return await _resolve(provider_id)


@router.post("/api/refresh")
async def refresh_usage() -> dict[str, ProviderUsage]:
    return {pid: await _resolve(pid, force=True) for pid in _usage_providers}
