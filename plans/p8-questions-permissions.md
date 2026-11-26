## P8 — Questions & permissions
- [ ] Handle question events: embed `alerta` "Pregunta del agente", status `pausa`; store in `pending_interactions` before posting.
- [ ] On boot: reload open `pending_interactions`, verify against server, re-enable or close their messages.
- [ ] Single choice → buttons/select; multi → select `maxValues`; free text → "Responder" button → modal (Paragraph) + accept reply-to-message; multi-field → modal(s) ≤5 inputs each.
- [ ] Permission events → Permitir una vez / Permitir siempre / Denegar.
- [ ] Send answer to API; disable components; show answer + `correcto`; resume `cargando`.
- [ ] Timeout (`QUESTION_TIMEOUT_MIN`) → "sin respuesta", keep components active.
- [ ] Only allowlisted users can answer.

**Done when:** each question type and a permission request can be answered from Discord and the agent continues.
