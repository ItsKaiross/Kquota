import asyncio
import json
import shutil
import sys
from typing import Optional, TypedDict

# Without this, every CLI subprocess we launch (shell=True spawns cmd.exe,
# which is a console-subsystem program) pops up a visible console window,
# since our own frozen backend has no console of its own to attach it to.
_WINDOWS_NO_CONSOLE = {"creationflags": 0x08000000} if sys.platform == "win32" else {}


class CliDetection(TypedDict):
    installed: bool
    version: Optional[str]
    logged_in: bool


async def _run(binary: str, args: str, timeout: float = 10) -> str:
    proc = await asyncio.create_subprocess_shell(
        f'"{binary}" {args}',
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        **_WINDOWS_NO_CONSOLE,
    )
    stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    # `codex login status` (and possibly others) write to stderr rather than
    # stdout, so both streams are checked rather than assuming stdout only.
    return stdout.decode(errors="ignore") + stderr.decode(errors="ignore")


async def is_claude_logged_in(binary: str) -> bool:
    try:
        data = json.loads(await _run(binary, "auth status"))
        return bool(data.get("loggedIn"))
    except Exception:
        return False


async def is_codex_logged_in(binary: str) -> bool:
    try:
        output = await _run(binary, "login status")
        return "logged in" in output.lower()
    except Exception:
        return False


async def detect_cli(binary_name: str, version_args: tuple[str, ...] = ("--version",)) -> CliDetection:
    path = shutil.which(binary_name)
    if path is None:
        return {"installed": False, "version": None, "logged_in": False}

    try:
        proc = await asyncio.create_subprocess_exec(
            path,
            *version_args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            **_WINDOWS_NO_CONSOLE,
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)
        version = stdout.decode(errors="ignore").strip().splitlines()[0] if stdout else None
    except Exception:
        version = None

    if binary_name == "claude":
        logged_in = await is_claude_logged_in(path)
    elif binary_name == "codex":
        logged_in = await is_codex_logged_in(path)
    else:
        logged_in = False

    return {"installed": True, "version": version, "logged_in": logged_in}


async def start_login(provider: str) -> bool:
    """Fire-and-forget: launches the CLI's own login flow (opens the user's
    browser for OAuth). We never see or store credentials -- the CLI handles
    the entire exchange and writes its own local auth file, same as if the
    user ran the command themselves."""
    binary_name = "claude" if provider == "claude" else "codex"
    path = shutil.which(binary_name)
    if path is None:
        return False

    args = "auth login" if provider == "claude" else "login"
    proc = await asyncio.create_subprocess_shell(f'"{path}" {args}', **_WINDOWS_NO_CONSOLE)
    # Intentionally not awaited: the OAuth flow can take as long as the user
    # needs in the browser. We only care that it launched.
    asyncio.create_task(proc.wait())
    return True
