from typing import Literal

from pydantic import BaseModel

ServiceStatus = Literal["operational", "degraded", "partial_outage", "major_outage", "unknown"]


class StatusReport(BaseModel):
    status: ServiceStatus
    checked_at: str
