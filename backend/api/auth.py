from fastapi import APIRouter, HTTPException

from utils.cli import start_login

router = APIRouter()

_PROVIDERS = {"claude", "codex"}


@router.post("/api/auth/{provider}/login")
async def login(provider: str) -> dict:
    if provider not in _PROVIDERS:
        raise HTTPException(status_code=404, detail="unknown_provider")

    started = await start_login(provider)
    if not started:
        raise HTTPException(status_code=409, detail=f"{provider}_cli_not_found")

    return {"started": True}
