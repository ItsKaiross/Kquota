import httpx

from models.status import StatusReport
from utils.time import now_iso

STATUS_URL = "https://status.anthropic.com/api/v2/status.json"

INDICATOR_MAP = {
    "none": "operational",
    "minor": "degraded",
    "major": "partial_outage",
    "critical": "major_outage",
}


class AnthropicStatusProvider:
    async def get_status(self) -> StatusReport:
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
                resp = await client.get(STATUS_URL)
                resp.raise_for_status()
                data = resp.json()
                indicator = data.get("status", {}).get("indicator", "unknown")
                return StatusReport(
                    status=INDICATOR_MAP.get(indicator, "unknown"),
                    checked_at=now_iso(),
                )
        except (httpx.HTTPError, ValueError):
            return StatusReport(status="unknown", checked_at=now_iso())
