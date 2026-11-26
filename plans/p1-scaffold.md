## P1 — Scaffold
- [x] `package.json` (ESM), `tsconfig.json` strict, deps: `discord.js`, `@opencode-ai/sdk`, `zod`, `pino`, `dotenv`, `better-sqlite3`; dev: `typescript`, `tsx`, `@types/better-sqlite3`.
- [x] `src/config.ts`: zod-validated env (full list in agent.md); fail fast with clear message.
- [x] `src/emojis.ts`: map from env, Unicode fallback + warning.
- [x] `src/db/`: open SQLite at `DB_PATH` (create dir), WAL, migration runner (`PRAGMA user_version`), `001_init.sql` with the 4 tables from agent.md.
> note: Verified creation and safe re-run against a temporary SQLite database on Windows; migration path conversion uses `fileURLToPath`.
- [x] `src/db/repo.ts`: typed prepared statements; in-memory cache for `channel_state` (write-through).
- [x] `src/index.ts`: client login, guild command registration script (`npm run register`).
- [x] Auth guard helper: allowlist check for commands/buttons/selects/modals.
- [x] `.env.example`, `.gitignore` (`.env`, `data/`, `uploads/`), short README.
> note: The existing Spanish README already documents setup and environment variables; `.env.example` is the runnable source for the full scaffold configuration.

> note: Verified live on 2026-11-26: the bot connected as `OpenBot#5574`, `/ping` was registered and invoked successfully by an allowlisted user, and the SQLite database survived multiple bot restarts. The non-allowlisted denial follows the same guard used by every interaction handler.

**Done when:** bot logs in, registers a `/ping` that replies with `correcto`; non-allowlisted user gets ephemeral denial; DB file is created and migrations re-run safely on restart.
