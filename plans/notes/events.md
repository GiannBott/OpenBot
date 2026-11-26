# SSE events observed (2026-11-26)

Capture source: `GET /api/event` authenticated with HTTP Basic during two real prompts in session `ses_de6292bebffe9T59GalHYjYSWg`.

Observed event types:

- `server.connected`
- `project.updated`
- `session.inbox.enqueued`
- `session.inbox.delivered`
- `session.execution.started`
- `session.step.started`
- `session.reasoning.started`
- `session.reasoning.delta`

The prompt completed with session `outcome: "succeeded"`; its final transition fell outside the first capture window and the second streaming process was interrupted by the local shell before completion. Therefore `session.execution.succeeded`, terminal text, file-write, form, permission, and error events remain to be captured before P5/P6/P8 implementation.

Declared terminal/event candidates from the OpenAPI `types` filter include `session.execution.succeeded`, `session.execution.failed`, `session.execution.interrupted`, `session.text.ended`, `filesystem.changed`, `form.created`, `form.replied`, `permission.asked`, and `permission.replied`.
