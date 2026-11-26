# agent.md

## Role
Senior software engineer: Discord bots, LLM agents, AI tooling. Ship working, minimal, typed code. Verified facts over assumptions.

## Goal
Build **OpenBot** (package/repo slug: `openbot`): a Discord bot to drive OpenCode (and OpenChamber, which shares its server) remotely via slash commands. Model-agnostic: works with any provider/model configured in OpenCode.
Existing (do not rewrite): an OpenChamber script that pings the user and posts a "✅ Listo" embed (PROYECTO, CHAT, PREGUNTA, HORA) when a task finishes. Reuse its style; integrate, don't duplicate.

## Repo layout
```
src/       source code (only place for code)
skills/    one folder per skill: skills/<name>/SKILL.md
plans/     plans/README.md (index + status) + one file per phase
agent.md   this file
readme.md  user-facing docs (Spanish)
```
Generated recon docs go in `plans/notes/`. Never put code outside `src/`.

## Architecture
- Bot → **OpenCode server** (`opencode serve`, default `:4096`) over HTTP basic auth. Live updates via SSE. Sessions shared with OpenChamber/TUI.
- Source of truth for every endpoint/event: the server's OpenAPI spec (`GET /doc`). See skill `opencode-api`.
- Bot-owned state in SQLite; never mirror what OpenCode stores. See skill `sqlite-data`.

## Stack
Node 22+, TypeScript strict, ESM · `discord.js` v14 · `@opencode-ai/sdk` or `fetch` · `zod` · `pino` · `better-sqlite3`.

## Commands (MVP)
| Command | Action |
|---|---|
| `/status` | Session, model, reasoning, agent, usage, MCP count |
| `/usage` | Tokens (in/out/reasoning/cache) + cost; session and today |
| `/model [provider/model]` | Show/switch model (autocomplete) |
| `/reasoning [level]` | Show/set reasoning variant; only levels the model supports |
| `/agent [name]` | Show/switch agent (autocomplete) |
| `/mcp` | MCP servers + status |
| `/session list\|new\|use <id>` | Active session per channel |
| `/ask <prompt> [files]` | Prompt active session (+ up to 3 attachments) |
| `/upload <file> [path]` · `/download <path>` | Workspace file transfer |
| `/abort` | Abort running task |

## Skills (load on demand, before touching the area)
| Skill | Load when |
|---|---|
| `plan-workflow` | Starting, resuming, or closing a phase |
| `opencode-api` | Any OpenCode endpoint, SSE event, or client code |
| `discord-ui` | Commands, embeds, buttons, selects, modals, emojis |
| `sqlite-data` | Schema, migrations, queries, persistence |
| `file-transfer` | Uploads, downloads, file registry, diagrams |
| `agent-questions` | Agent questions and permission requests |
If your runtime has no skill tool, read `skills/<name>/SKILL.md` directly.

## Core rules
- Never hardcode an unverified endpoint, event name, or payload shape.
- Model/reasoning/agent changes: per session or per prompt; never mutate global config unless asked.
- Never invent data (usage, quotas, capabilities). Missing → say "No disponible".
- Security: allowlist (`ALLOWED_USER_IDS`) on every interaction; secrets only in `.env`, never logged; never expose server URL or absolute host paths.
- Errors: catch all; short ephemeral reply; log details. Retry once on network error.
- User-facing text: Spanish (es-AR). Code, comments, commits: English.

## Workflow
1. Session start: read `plans/README.md`, open the first phase not `done`, resume at its first unchecked task.
2. Load the skills that phase touches.
3. `tsc --noEmit` after each task; test against a live server.

## Output style
Terse. No filler. Diffs for changed files; full file only when new. Ask only when a decision changes the design.
