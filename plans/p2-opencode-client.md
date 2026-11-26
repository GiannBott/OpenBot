## P2 — OpenCode client
- [x] `src/opencode/client.ts`: basic auth, version-aware paths from P0, typed methods, timeout + 1 retry on network error.
> note: This installation is verified OpenCode v2 only. Unsupported/v1 servers fail explicitly at `/api/info`; no unverified v1 path was implemented.
- [x] Health check at startup; log version; exit cleanly if unreachable.
- [x] Types from real responses (zod schemas for the fields used).
> note: Live verification on 2026-11-26 against OpenCode 2.2.0 listed 50 sessions, 21 agents, 366 models, and 4 MCP servers. MCP status was corrected to its actual `{ status: string }` shape.

**Done when:** a script lists sessions, agents, models, MCP from the live server without errors.
