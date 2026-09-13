# KQuota

A lightweight, always-on-top desktop widget that shows how much of your **Claude** and **Codex** subscription usage you have left — 5-hour and weekly limits, live countdowns to reset — without opening claude.ai, ChatGPT, or any dashboard.

KQuota is local-first: everything runs on your own machine, reading from the CLIs you're already logged into. No accounts, no cloud service, no scraping, and no password or cookie handling of any kind.

## Features

- Real Claude usage (5-hour + weekly %, remaining, reset time) via Claude Code's own `/usage` command
- Real Codex usage (5-hour + weekly %, remaining, reset time) via Codex CLI's official `app-server` protocol
- Manual refresh + automatic refresh (60s), with per-provider caching so it never hammers either CLI
- Independent failure handling — if one provider is unavailable, the other keeps working
- Clear, specific guidance when a provider isn't set up yet (CLI not installed vs. not logged in vs. no data), with a one-click **Connect** button that opens that CLI's own official sign-in flow
- Frameless, draggable, always-on-top widget; detach either provider into its own small floating card (docked to the top, above the taskbar, or to the side)
- Settings for always-on-top, launch-at-startup, default dock position, and which providers to show

## How usage data is obtained

Anthropic and OpenAI don't publish a public API for the *subscription* usage window (as opposed to pay-per-token API billing, which is a different thing entirely). KQuota only uses sources that are officially shipped and supported by each CLI:

- **Claude**: `claude -p "/usage" --output-format json` — a built-in local command (marked `local_command` in its own response). It costs $0 and makes no model call; KQuota parses the percentages and reset times out of its text result.
- **Codex**: Codex's own `app-server` JSON-RPC protocol (the same one its VS Code/desktop clients use internally). KQuota calls the documented `account/rateLimits/read` method, whose schema is generated straight from the installed CLI via `codex app-server generate-json-schema`.

If a provider isn't installed or isn't logged in, KQuota says so explicitly instead of showing a fake `0%`.

## Architecture

```
Tauri + React widget  ──HTTP (127.0.0.1:8765)──>  FastAPI backend
                                                        │
                                                        ├── Claude usage adapter   (claude CLI)
                                                        ├── Codex usage adapter    (codex CLI)
                                                        ├── Anthropic status check (status.anthropic.com)
                                                        └── OpenAI status check    (status.openai.com)
```

The Rust side (`src-tauri`) is a thin shell: it manages the window and automatically spawns the FastAPI backend as a local subprocess bound to `127.0.0.1:8765` (never exposed externally). It is not a bundled sidecar yet — see [CONTRIBUTING.md](CONTRIBUTING.md) if you want to help with packaging.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain, for Tauri)
- [Python](https://www.python.org/) 3.12+
- To see real data:
  - [Claude Code CLI](https://www.npmjs.com/package/@anthropic-ai/claude-code) — `npm install -g @anthropic-ai/claude-code`, then run `claude` once and sign in
  - [Codex CLI](https://www.npmjs.com/package/@openai/codex) — `npm install -g @openai/codex`, then run `codex login`

You don't need either CLI installed to run KQuota itself — the widget will just show "not installed" / "not logged in" for whichever one is missing, with a **Connect** button to fix it from inside the app.

## Running it

```bash
# 1. Frontend dependencies
npm install

# 2. Backend virtual environment
cd backend
python -m venv .venv
./.venv/Scripts/pip install -r requirements.txt   # Windows
# .venv/bin/pip install -r requirements.txt       # macOS/Linux
cd ..

# 3. Run the desktop app (this also auto-launches the backend)
npm run tauri dev
```

## Project structure

```
kquota/
├── src/                    React + TypeScript frontend
│   ├── components/         ProviderCard, UsageBar, ResetTimer, WidgetHeader, ...
│   ├── pages/               Widget, Settings, DetachedProvider
│   ├── hooks/               useUsage, useCountdown
│   ├── services/            api.ts (HTTP client), windows.ts (floating cards), preferences.ts
│   └── types/                usage.ts (mirrors the backend's Pydantic models)
│
├── src-tauri/               Rust desktop shell (window management, spawns the backend)
│
└── backend/                 Local FastAPI service (127.0.0.1:8765 only)
    ├── api/                 usage.py, status.py, auth.py
    ├── services/
    │   ├── usage/            base.py (UsageProvider interface), claude.py, codex.py
    │   └── status/           anthropic.py, openai.py
    ├── models/               Pydantic response models
    └── core/                 config, TTL cache
```

## Privacy & security

- No KQuota account, no cloud backend, no analytics.
- The backend binds to `127.0.0.1` only — never reachable from the network.
- KQuota never sees, stores, or transmits your Claude/OpenAI password, session cookie, or API key. Signing in happens entirely inside `claude`/`codex login`'s own official flow; KQuota only reads the result the CLI already stored locally.

## License

Not yet decided.
