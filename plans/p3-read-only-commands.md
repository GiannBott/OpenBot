## P3 - Read-only commands

- [x] `ui/embeds.ts`: base builder matching the existing "Listo" style.
- [x] `/status`: session, model, reasoning, agent, usage summary, MCP count.
- [x] `/usage`: tokens (in/out/reasoning/cache) + cost; per session and today. "No disponible" for missing data.
- [x] `/mcp`: servers + status, emoji per state (`correcto` ok, `alerta` failed, `pausa` disabled).
- [x] `/session list`.

> note: `/usage` uses `GET /api/experimental/session/stats` with the America/Argentina/Buenos_Aires day range. It was verified against OpenCode v2.2.0.
> note: Commands were registered and OpenBot restarted. Pending the user's live Discord smoke test before closing the phase.

**Done when:** all four commands return correct data matching OpenChamber UI.
