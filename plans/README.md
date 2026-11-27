# Plans — OpenBot

Rules:
- Work one phase at a time, in order. Don't start phase N+1 until phase N passes its **Done when**.
- Tick `[x]` as tasks finish; add `> note:` lines for deviations, discovered API shapes, or blockers.
- Each phase ends with `tsc --noEmit` clean + manual test on a live server + one commit (`feat(pN): ...`).
- If a task needs a decision that changes design, stop and ask. Otherwise decide and note it.
- Update the Status column here when a phase starts (`wip`) or passes Done when (`done`).
- Load skill `plan-workflow` before starting or closing a phase.

| Phase | Scope | Status |
|---|---|---|
| [P0](p0-recon.md) | Recon (no bot code) | done |
| [P1](p1-scaffold.md) | Scaffold | done |
| [P2](p2-opencode-client.md) | OpenCode client | done |
| [P3](p3-read-only-commands.md) | Read-only commands | done |
| [P4](p4-control-commands.md) | Control commands | done |
| [P5](p5-prompt-task-lifecycle.md) | Prompt + task lifecycle | todo |
| [P6](p6-downloads.md) | Downloads | todo |
| [P7](p7-uploads.md) | Uploads | todo |
| [P8](p8-questions-permissions.md) | Questions & permissions | todo |
| [P9](p9-hardening.md) | Hardening | todo |
| [Backlog](backlog.md) | Only after P9 | — |
