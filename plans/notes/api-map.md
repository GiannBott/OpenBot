# OpenCode API map (verified 2026-11-26)

Server: `http://localhost:4096` · API: v2 · OpenAPI: 3.1.0 · spec: `openapi.json` (130 paths).

Authentication is HTTP Basic: fixed username `opencode`; password is configured locally in `.env` and never logged.

| Capability | Method and path | Verified request / response |
|---|---|---|
| List sessions | `GET /api/session` | Supports pagination/filter query parameters; `200` returns `SessionsResponse` (`data`, `cursor`). |
| Create session | `POST /api/session` | JSON: optional `id`, `parentID`, `title`, `agent`, `model`, `location`, `metadata`, `permissions`; `200` returns `{ data: Session.Info }`. |
| Send prompt | `POST /api/session/{sessionID}/prompt` | JSON: `text` plus optional `id`, `files`, `agents`, `skills`, `metadata`, `delivery`, `resume`; `200`, with `409` possible when busy. |
| Abort | `POST /api/session/{sessionID}/interrupt` | No body; `200` returns `SessionInterruptResponse`. |
| List agents | `GET /api/agent` | Optional location query; `200` returns location + agent array. |
| List models | `GET /api/model` | `200` returns model list. `Model.Info` includes `capabilities`, `variants`, `enabled`, `status`, `limit` and cost/time metadata. |
| List providers | `GET /api/provider` | `200` returns provider list. |
| Switch agent | `POST /api/session/{sessionID}/agent` | JSON `{ agent }`; `204` without body. |
| Switch model / variant | `POST /api/session/{sessionID}/model` | JSON `{ model }`, where `Model.Ref` is `{ providerID, id, variant? }`; `204` without body. |
| MCP status | `GET /api/mcp` | `200` returns MCP server state. |
| SSE | `GET /api/event` | `text/event-stream`; optional `types` filter; first event is `server.connected`. Stream is volatile and must reconnect. |
| Pending questions | `GET /api/form` | `200` returns pending forms. |
| Answer question | `POST /api/session/{sessionID}/form/{formID}/reply` | JSON `Form.Reply` requiring `answer`; `204`. |
| Pending permissions | `GET /api/permission/request` or `GET /api/session/{sessionID}/permission` | `200` returns open permission requests. |
| Answer permission | `POST /api/session/{sessionID}/permission/{requestID}/reply` | JSON `{ decision, message? }`; `decision` is `once`, `always`, or `reject`; `204`. |
| Read workspace file | `GET /api/fs/read/*` | `200` file response; path is route suffix. |
| List workspace files | `GET /api/fs/list` | `200` directory listing. |
| Write workspace file | `POST /api/experimental/fs/write` | `200`; experimental endpoint, therefore implementation must retain a fallback. |

Notes:

- In this v2 build, `GET /doc` serves the web UI. The authenticated machine-readable OpenAPI document is `GET /openapi.json`.
- Relevant declared event families: `session.execution.*`, `session.step.*`, `session.text.*`, `session.reasoning.*`, `session.tool.*`, `filesystem.changed`, `form.*`, `permission.*`, and `mcp.*`.
- Every subsequent client call must validate only the fields it consumes against this saved specification and the live server.

## Existing OpenChamber notification integration

OpenChamber's default data directory is `C:\Users\gianl\.config\openchamber`. Its active settings enable native notifications for completion, errors, questions, pull requests, and subtasks; all notification templates are empty. No Discord webhook, bot script, or notification extension was installed in the default data directory.

`openchamber-extensions` documents that a non-native notification channel must be supplied by an extension with `service.provides: ["notifications"]` and, when it needs task events, `sessionEvents`. Therefore the existing “✅ Listo” Discord script is **MISSING** in this installation. Fallback: OpenBot owns Discord task-completion embeds in P5 and does not attempt to call or duplicate a nonexistent OpenChamber script.
