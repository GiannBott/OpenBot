## P5 — Prompt + task lifecycle
- [x] `/ask <prompt>`: defer, send with current model/agent/variant.
- [x] `opencode/events.ts`: SSE listener with reconnect + backoff; route events by sessionId.

> note: Terminal and text event payloads were captured against OpenCode v2.2.0 and recorded in `plans/notes/events.md`.
- [x] Single status message per task: `cargando` → `correcto`/`alerta`; edit throttled ≥1.5s.
- [x] Final embed: summary (truncate ≤4096; full text as `.md` attachment if longer), tokens/cost for the task.
- [x] `/abort` → `pausa` + "abortado".
- [x] Integrate existing notify script: either bot takes over its embed, or both coexist without duplicate posts. Decide and note.

> note: No existing OpenChamber Discord notify script was found during P0. OpenBot owns the task-status embed, so duplicate posts cannot occur.

> note: Live Discord smoke test passed: prompt progress/final state and `/abort` behave correctly.

**Done when:** a prompt from Discord runs, shows progress, ends with correct final embed; abort works; no duplicate notifications.
