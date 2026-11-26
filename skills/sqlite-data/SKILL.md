---
name: sqlite-data
description: Bot persistence with SQLite (better-sqlite3) - schema, migrations, repository pattern, caching, pruning, backups. Load before changing schema, adding queries, or persisting any bot state.
---

# sqlite-data

## Scope
Store only bot-owned state. Never mirror OpenCode data (sessions, messages, tokens, cost, agents, MCP): query the server.

## Setup (`src/db/index.ts`)
- Path `DB_PATH` (default `./data/openbot.db`); create dir if missing.
- On open: `journal_mode = WAL`, `foreign_keys = ON`, `busy_timeout = 5000`.
- Run migrations, then prune.

## Schema (`src/db/migrations/001_init.sql`)
| Table | Key columns | Purpose |
|---|---|---|
| `channel_state` | `channel_id` PK, `session_id`, `model`, `agent`, `variant`, `updated_at` | Active session + selections per channel |
| `pending_interactions` | `id` PK, `kind` (question/permission/upload/overwrite), `session_id`, `event_id`, `channel_id`, `message_id`, `payload` JSON, `status` (open/answered/expired/cancelled), `created_at`, `expires_at` | Survive restarts |
| `files` | `id` PK, `session_id`, `path`, `mime`, `size`, `direction` (in/out), `created_at` | Upload/download registry |
| `usage_daily` | PK(`date`,`model`), `tokens_in`, `tokens_out`, `tokens_reasoning`, `tokens_cache`, `cost` | Optional daily report |
Ids: short random strings (e.g. 10-char nanoid) to keep `customId`s small. Timestamps: unix ms integers.

## Migrations
- Files `NNN_description.sql`, applied in order inside a transaction.
- Version in `PRAGMA user_version`; apply only files with number > version.
- Never edit an applied migration; add a new one.
- Re-running on startup must be a no-op.

## Repository (`src/db/repo.ts`)
- All access goes through typed functions with prepared statements (prepare once at module load).
- No SQL strings elsewhere in the codebase.
- `channel_state`: in-memory `Map` cache, write-through on every change, loaded at startup.
- Multi-step writes → `db.transaction(...)`.
- JSON columns: `JSON.stringify` on write, zod-parse on read.

## Pruning
On startup and every 24h: delete `files` older than 7 days and `pending_interactions` with status ≠ `open` older than 7 days. Mark `open` rows past `expires_at` as `expired` (see skill `agent-questions` for UI handling).

## Backup
Bot stopped → copy the `.db` file. Bot running → `db.backup(<path>)`. Document in `readme.md`. `data/` is gitignored.
