from fastapi import APIRouter

from core.cache import TTLCache
from core.config import STATUS_CACHE_SECONDS
from models.status import StatusReport
from services.status.anthropic import AnthropicStatusProvider
from services.status.openai import OpenAIStatusProvider
from utils.cli import detect_cli

router = APIRouter()

_anthropic_status = AnthropicStatusProvider()
_openai_status = OpenAIStatusProvider()

_anthropic_cache = TTLCache[StatusReport](STATUS_CACHE_SECONDS)
_openai_cache = TTLCache[StatusReport](STATUS_CACHE_SECONDS)


@router.get("/api/status/claude")
async def get_claude_status() -> StatusReport:
    return await _anthropic_cache.get_or_fetch(_anthropic_status.get_status)


@router.get("/api/status/openai")
async def get_openai_status() -> StatusReport:
    return await _openai_cache.get_or_fetch(_openai_status.get_status)


@router.get("/api/system")
async def get_system_info() -> dict:
    return {
        "claude_cli": await detect_cli("claude"),
        "codex_cli": await detect_cli("codex"),
    }
