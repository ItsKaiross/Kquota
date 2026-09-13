from datetime import datetime, timezone


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat()


def unix_seconds_to_iso(seconds: int) -> str:
    return datetime.fromtimestamp(seconds, tz=timezone.utc).astimezone().isoformat()
