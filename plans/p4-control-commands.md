## P4 — Control commands
- [x] `/session new|use <id>`; active session per channel in `channel_state`.
- [x] `/model` with autocomplete (≤25, filter by typed text); apply per session or store for next prompt.
- [x] `/reasoning` with autocomplete limited to current model's supported variants; "no soportado" otherwise.
- [x] `/agent` with autocomplete.

> note: Verified against OpenCode v2.2.0: model and agent routes return `204 No Content`; the HTTP client accepts that response. A temporary live session confirmed model, reasoning variant, and agent persisted together.
- [x] Changes reflected in `/status` and in OpenChamber UI.

**Done when:** switching model/reasoning/agent from Discord is visible in OpenChamber and used by the next prompt.

> note: Live Discord smoke test passed after restarting the stale bot process. `/session new`, `/session use`, and `/model` now execute the intended actions.
