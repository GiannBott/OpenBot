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
- `session.text.started`
- `session.text.delta`
- `session.text.ended` (final assistant text in `data.text`)
- `session.step.ended` (tokens, cost, generated files)
- `session.usage.updated`
- `session.execution.succeeded`

The full prompt completion was captured on session `ses_de5a4a252ffer4GmVPp3EMVYSJ`: `session.text.ended` carries `{ sessionID, text }`, `session.step.ended` carries `{ tokens, cost, files }`, and `session.execution.succeeded` carries `{ sessionID }`.

Declared terminal/event candidates from the OpenAPI `types` filter include `session.execution.succeeded`, `session.execution.failed`, `session.execution.interrupted`, `session.text.ended`, `filesystem.changed`, `form.created`, `form.replied`, `permission.asked`, and `permission.replied`.
