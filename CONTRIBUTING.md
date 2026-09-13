# Contributing to KQuota

Thanks for wanting to help. KQuota is small on purpose — please keep changes focused and avoid adding abstractions or dependencies the project doesn't need yet.

## Project layout

See the "Project structure" section in [README.md](README.md) for the directory tree. In short:

- `src/` — React/TypeScript UI (Tauri webview)
- `src-tauri/` — Rust: window management only, spawns the Python backend as a subprocess
- `backend/` — FastAPI service on `127.0.0.1:8765`, the only place usage data is fetched/normalized

## Setting up a dev environment

Follow "Running it" in the README. For backend-only iteration (no need to rebuild the desktop shell every time):

```bash
cd backend
./.venv/Scripts/python main.py   # Windows
# .venv/bin/python main.py       # macOS/Linux
```

Then hit `http://127.0.0.1:8765/api/usage` directly with curl/your browser while you work. The frontend (`npm run dev`) will pick up backend changes on its own refresh cycle; **the backend does not hot-reload** — restart it after editing any `backend/*.py` file.

## The most important rule: no fabricated data

If you're adding or touching a usage provider, the priority order is:

1. Official API
2. Official CLI structured output (e.g. Codex's `app-server` JSON-RPC, generated via `codex app-server generate-json-schema` — not guessed)
3. Official CLI documented command (e.g. Claude's `/usage`, invoked non-interactively)
4. Explicitly reported as unavailable

**Never** scrape claude.ai or chatgpt.com, never guess at an undocumented endpoint, and never show a fabricated `0%`/`100%` when the real number isn't known — return `available: false` with a specific `reason` instead. Before wiring up any new source, verify it actually exists on your installed CLI version first (`--help`, `doctor`, shipped type definitions, a real invocation) rather than assuming from memory or documentation that might be stale.

## Adding a new usage provider

1. Implement `UsageProvider` in `backend/services/usage/` (see `base.py`). Return a `ProviderUsage` (in `backend/models/usage.py`) with accurate `capabilities` flags — don't claim `weekly_usage: true` if you don't actually have it.
2. Register it in `backend/api/usage.py`'s `_usage_providers` dict.
3. Add its `ProviderId` to `src/types/usage.ts` and wire up any provider-specific label/branding in `src/components/Brand.tsx`.
4. Update the README's "How usage data is obtained" section with what you found and how.

## Security expectations

- Never store or transmit a user's password, session cookie, or long-lived token. Authentication happens through the provider's own CLI login flow (`claude`, `codex login`); KQuota only reads the result.
- The FastAPI backend must stay bound to `127.0.0.1` — don't change this without a very good reason and a note in the PR explaining why.
- Don't add telemetry, analytics, or any outbound call that isn't either (a) the provider CLI itself, or (b) the provider's official public status page.

## Before opening a PR

- `npm run build` (frontend type-checks + builds)
- `cargo check` inside `src-tauri/`
- Manually launch the app (`npm run tauri dev`) and confirm the change actually renders/behaves as expected — this project doesn't have an automated test suite yet, so a screenshot or a description of what you clicked and saw is genuinely useful in the PR description.
- If you touched a usage provider, paste the actual JSON your changed endpoint returns (redact your email/org id if present).

## Style

- No unnecessary comments — code should read clearly on its own. Comment only non-obvious constraints (see `backend/services/usage/codex.py` for an example: the Windows `.CMD` shim / `create_subprocess_shell` note).
- Match existing formatting rather than introducing a new convention in one file.
- Keep the widget genuinely lightweight — think twice before adding a new runtime dependency.
