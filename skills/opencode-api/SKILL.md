---
name: opencode-api
description: How to discover and call the OpenCode server API and SSE events (sessions, prompts, models, reasoning variants, agents, MCP, questions, permissions, files). Load before writing or changing any code in src/opencode/ or anything that calls the server.
---

# opencode-api

## Source of truth
- The running server's OpenAPI spec: `GET <OPENCODE_URL>/doc`. Save to `plans/notes/openapi.json`.
- Verified endpoint/event map: `plans/notes/api-map.md`. Read it first; update it when you verify something new.
- Not in the spec or map → don't guess. Mark `MISSING` in the map, add a fallback, note it in the phase file.

## Versions
Two API shapes exist. Detect at startup, store in client, route all calls through one resolver.
| | v1 | v2 |
|---|---|---|
| Prefix | `/session`, `/config`, `/agent`, `/mcp`, `/provider` | `/api/...` |
| Model/agent switch | per prompt body (`model`, `agent`) | dedicated routes, e.g. `/api/session/{id}/model`, `/api/session/{id}/agent` |
Detection: probe a v2 route (e.g. `GET /api/session`) → 2xx = v2, else v1. Confirm against `/doc`.

## Auth & transport
- HTTP basic: user `OPENCODE_SERVER_USERNAME` (default `opencode`), pass `OPENCODE_SERVER_PASSWORD`.
- Timeout 30s for normal calls; none for SSE. Retry once on network error only (never on 4xx).
- Prefer `@opencode-ai/sdk` when it exposes the call; otherwise typed `fetch` wrapper in `src/opencode/client.ts`.
- Validate only the fields you use with `zod` (`.passthrough()`); don't model whole payloads.

## SSE (`/event` or SDK subscription)
- First event is a connection event; then bus events. Route by session id.
- Reconnect with backoff (1s → 2s → 5s → 10s cap). On reconnect, re-fetch state of active sessions (events may have been missed).
- Dump unknown event types once at debug level; add them to `plans/notes/events.md`.
- Interesting families (verify exact names): session status/idle/error, message part updates, file edits/writes, questions, permissions.

## Domain notes
- **Usage**: sum `tokens` (input, output, reasoning, cache read/write) and `cost` from assistant messages. Provider quotas usually aren't exposed → "No disponible".
- **Models**: from providers list (`provider/model` ids). Capabilities (image input, reasoning variants) come from model metadata; check before offering options.
- **Reasoning**: a per-model variant/effort field. Offer only what the model declares; else "no soportado".
- **Agents**: list from agents endpoint; hide agents marked hidden/subagent-only unless asked.
- **MCP**: status map `{name: status}`; show connected/failed/disabled.
- **Questions/permissions**: each has an id; reply via its matching endpoint with that id. See skill `agent-questions`.

## Checklist before merging client code
- [ ] Path, method, body, response verified in `/doc` and recorded in `api-map.md`.
- [ ] Works on the detected version; other version either works or fails with a clear log.
- [ ] No secrets or server URL in logs or Discord replies.
