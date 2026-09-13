import asyncio
import json
import re
import shutil
from datetime import datetime
from typing import Optional
from zoneinfo import ZoneInfo

from models.usage import ProviderUsage, UsageCapabilities, UsageWindow
from utils.cli import is_claude_logged_in
from utils.time import now_iso

from .base import UsageProvider

_NO_CAPABILITIES = UsageCapabilities(
    session_usage=False,
    weekly_usage=False,
    reset_time=False,
    service_status=True,
)

_MONTHS = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
}

# e.g. "Sep 13, 2:40pm (Asia/Singapore)" or "Sep 17, 8pm (Asia/Singapore)"
_RESET_RE = re.compile(
    r"([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*\(([^)]+)\)",
    re.IGNORECASE,
)

_SESSION_RE = re.compile(r"Current session:\s*(\d+)%\s*used\s*·\s*resets\s*(.+)")
_WEEKLY_RE = re.compile(r"Current week[^:]*:\s*(\d+)%\s*used\s*·\s*resets\s*(.+)")


def _parse_reset(text: str, now: datetime) -> Optional[str]:
    match = _RESET_RE.search(text)
    if not match:
        return None
    mon, day, hour, minute, ampm, tzname = match.groups()
    month = _MONTHS.get(mon[:3].title())
    if month is None:
        return None

    hour = int(hour) % 12
    if ampm.lower() == "pm":
        hour += 12

    try:
        tz = ZoneInfo(tzname)
    except Exception:
        return None

    candidate = datetime(now.year, month, int(day), hour, int(minute or 0), tzinfo=tz)
    now_in_tz = now.astimezone(tz)
    if candidate < now_in_tz.replace(hour=0, minute=0, second=0, microsecond=0):
        candidate = candidate.replace(year=now.year + 1)

    return candidate.isoformat()


def _window(match: Optional[re.Match], now: datetime) -> Optional[UsageWindow]:
    if match is None:
        return None
    used = int(match.group(1))
    reset_at = _parse_reset(match.group(2), now)
    return UsageWindow(
        used_percent=used,
        remaining_percent=max(0, 100 - used),
        reset_at=reset_at,
    )


class ClaudeSubscriptionProvider(UsageProvider):
    """Uses Claude Code's own `/usage` local command (invoked non-interactively
    via `claude -p "/usage" --output-format json`) -- an officially supported
    CLI feature (marked `local_command: "usage"` in its own JSON response,
    handled entirely locally with $0 cost and no API call), not a scraped or
    guessed endpoint. Falls back to honestly reporting unavailable if the CLI
    isn't installed, isn't logged in, or ever changes this output shape.
    """

    provider_id = "claude"

    async def get_usage(self) -> ProviderUsage:
        binary = shutil.which("claude")

        if binary is None:
            return self._unavailable("claude_cli_not_found")

        if not await is_claude_logged_in(binary):
            return self._unavailable("claude_not_logged_in")

        try:
            proc = await asyncio.create_subprocess_exec(
                binary,
                "-p",
                "/usage",
                "--output-format",
                "json",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=30)
            data = json.loads(stdout.decode(errors="ignore"))
            result_text = data.get("result", "")
        except Exception:
            return self._unavailable("subscription_usage_unavailable")

        now = datetime.now().astimezone()
        session = _window(_SESSION_RE.search(result_text), now)
        weekly = _window(_WEEKLY_RE.search(result_text), now)

        if session is None and weekly is None:
            return self._unavailable("subscription_usage_unavailable")

        return ProviderUsage(
            provider="claude",
            available=True,
            session=session,
            weekly=weekly,
            usage_source="claude_code",
            capabilities=UsageCapabilities(
                session_usage=session is not None,
                weekly_usage=weekly is not None,
                reset_time=True,
                service_status=True,
            ),
            last_updated=now_iso(),
        )

    def _unavailable(self, reason: str) -> ProviderUsage:
        return ProviderUsage(
            provider="claude",
            available=False,
            reason=reason,
            usage_source="unavailable",
            capabilities=_NO_CAPABILITIES,
            last_updated=now_iso(),
        )
