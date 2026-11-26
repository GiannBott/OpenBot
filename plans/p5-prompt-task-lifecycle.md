## P5 — Prompt + task lifecycle
- [ ] `/ask <prompt>`: defer, send with current model/agent/variant.
- [ ] `opencode/events.ts`: SSE listener with reconnect + backoff; route events by sessionId.
- [ ] Single status message per task: `cargando` → `correcto`/`alerta`; edit throttled ≥1.5s.
- [ ] Final embed: summary (truncate ≤4096; full text as `.md` attachment if longer), tokens/cost for the task.
- [ ] `/abort` → `pausa` + "abortado".
- [ ] Integrate existing notify script: either bot takes over its embed, or both coexist without duplicate posts. Decide and note.

**Done when:** a prompt from Discord runs, shows progress, ends with correct final embed; abort works; no duplicate notifications.
