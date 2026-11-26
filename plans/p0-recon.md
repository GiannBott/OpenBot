## P0 — Recon (no bot code)
- [x] Fetch `GET /doc` from the running OpenCode server; save to `plans/notes/openapi.json`.
> note: The v2 server serves the web UI at `/doc`; its authenticated machine-readable specification is `GET /openapi.json` (OpenAPI 3.1.0, 130 paths), saved at `plans/notes/openapi.json`.
- [x] Detect API version (v1 `/session` vs v2 `/api/session`). Note it.
> note: Verified v2: `GET /api/session` is the authenticated session route. See `plans/notes/api-map.md`.
- [x] Locate in spec and note path + body + response for: list/create session, send message/prompt, abort, list agents, list providers/models, switch model/agent per session, model variants/reasoning, MCP status, events SSE, question reply, permission reply, file read/write in workspace.
> note: All requested endpoint families are mapped in `plans/notes/api-map.md`; workspace write is marked experimental and needs a fallback in P7.
- [x] Subscribe to `/event` for one real task; dump event types to `plans/notes/events.md` (task start/progress/finish, file writes, questions, permissions, errors).
> note: Captured a real prompt and documented observed event types in `plans/notes/events.md`. Terminal, file, form, permission, and error events are MISSING from the capture; P5 must use `session.execution.succeeded|failed|interrupted` plus a state re-fetch fallback after reconnect.
- [x] Read the existing notify script; note embed fields/colors and how it detects completion.
> note: MISSING — OpenChamber's default data directory has native notifications enabled but no Discord script, webhook, or notification extension. The verified fallback is for OpenBot to own its completion embed in P5; see `plans/notes/api-map.md`.

**Done when:** `plans/notes/api-map.md` lists every endpoint/event above with verified shape, or marks it `MISSING` with a fallback.
