---
name: agent-questions
description: Rendering agent questions (single/multi choice, free text, forms) and permission requests as Discord components, sending answers back to OpenCode, persisting them, timeouts, and restart recovery. Load before working on question/permission events or their interaction handlers.
---

# agent-questions

## Flow
1. SSE question/permission event arrives (verify names and payload via skill `opencode-api`).
2. **Persist first**: insert into `pending_interactions` (`status='open'`, `expires_at = now + QUESTION_TIMEOUT_MIN`).
3. Post embed: `EMOJI_ALERTA` + "Pregunta del agente" / "Permiso requerido", question text, options. Update `message_id`. Task status → `pausa`.
4. User answers → auth guard → send answer to the matching endpoint with the event's id.
5. Success → `status='answered'`, disable components, show "Respuesta: <answer>" + `EMOJI_CORRECTO`, task status → `cargando`.
6. API error → keep components enabled, ephemeral `alerta` with short reason.

## Question type → component
| Type | Component | customId |
|---|---|---|
| Single choice ≤5 | Buttons | `q:<id>:<index>` |
| Single choice 6–25 | String select | `q:<id>` |
| Multiple choice | String select with `minValues`/`maxValues` | `q:<id>` |
| Free text | "Responder" button → modal (Paragraph) | `q:<id>:open` |
| Form (fields) | Modal, ≤5 inputs; more → chain modals, store partial answers in `payload` | `q:<id>:open` |
| Choice + "other" allowed | Options + "Otra respuesta" button → modal | `q:<id>:open` |
| Permission | Buttons: Permitir una vez / Permitir siempre / Denegar | `perm:<id>:once\|always\|deny` |
- Free text also accepted as a Discord reply to the question message (match `message_id`).
- >25 options → paginate select with "Más…" option.
- Show permission details (tool, command/path) in a code block, truncated.

## Timeouts
At `expires_at`: edit embed to `EMOJI_PAUSA` + "Sin respuesta", `status='expired'`, keep components enabled. If the user answers later, still try the API; if the server rejects it (question gone), disable components and say "La pregunta ya no está vigente".

## Restart recovery
On boot, for each `open` row: check with the server whether the question/permission is still pending.
- Still pending → re-fetch message, ensure components are enabled (handlers are stateless by customId, so they keep working).
- Gone → mark `cancelled`, disable components, note "Cancelada".

## Rules
- Only `ALLOWED_USER_IDS` can answer; others get ephemeral denial.
- Never auto-answer or auto-approve. "Permitir siempre" only on explicit click.
- Idempotent: a second click on an answered question → ephemeral "Ya fue respondida".
