## P9 — Hardening
- [ ] Global error handler; ephemeral `alerta` replies; pino logs without secrets.
- [ ] Rate-limit handling (discord.js queue) and SSE reconnect test (kill/restart server).
- [ ] Graceful shutdown (close SSE, close DB).
- [ ] DB backup note in README (copy file while bot stopped, or `.backup` API).
- [ ] Run as service (pm2 or systemd example in README).
- [ ] README final: setup, emoji ID tip (`\:name:`), env, commands, troubleshooting.

**Done when:** bot survives OpenCode restart and Discord reconnect without losing active sessions or pending questions.
