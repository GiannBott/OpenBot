---
name: discord-ui
description: Discord UI conventions for this bot - slash commands, autocomplete, embeds, buttons, select menus, modals, customId scheme, custom emojis, task status lifecycle, and Discord limits. Load before creating or changing any command, interaction handler, or embed.
---

# discord-ui

## Emojis (custom, mandatory)
Load from env as full strings (`<:name:id>` static, `<a:name:id>` animated). Never resolve by name. Missing ID → Unicode fallback + one warning log.
| Env key | Type | Use | Fallback |
|---|---|---|---|
| `EMOJI_CORRECTO` | animated | Done, success, answer accepted | ✅ |
| `EMOJI_ALERTA` | animated | Question, permission, error, warning | ⚠️ |
| `EMOJI_CARGANDO` | animated | Working, streaming | ⏳ |
| `EMOJI_PAUSA` | static | Waiting on user, aborted, idle | ⏸️ |
| `EMOJI_DESCARGA` | static | Download buttons, "file ready" | 📥 |
| `EMOJI_CARGA` | static | Upload buttons, "file received" | 📤 |
Buttons take emojis via `.setEmoji({ id, animated })` parsed from the env string.

## Task status lifecycle
One message per task, edited in place (throttle ≥1.5s, always flush the final state):
`cargando` → (`alerta` input needed → `pausa` waiting → `cargando`) → `correcto` | `alerta` (error) | `pausa` (aborted).
Title line: `<emoji> <Estado> — <chat/title>`. Keep the existing "Listo" embed fields: PROYECTO, CHAT, PREGUNTA, HORA.

## Embeds (`src/ui/embeds.ts`)
- Single builder; colors: success green, warning amber, working blurple, paused gray.
- Footer: model · agent · reasoning. Timestamp always.
- Long text → truncate with "…" and attach full text as `respuesta.md`.

## customId scheme (≤100 chars, never raw paths or secrets)
| Prefix | Meaning | Payload |
|---|---|---|
| `dl:` | download file | `files.id` |
| `up:` | request upload | `pending_interactions.id` |
| `q:` | answer question | `<pendingId>:<optionIndex>` or `<pendingId>:open` |
| `perm:` | permission | `<pendingId>:once\|always\|deny` |
| `ow:` | overwrite confirm | `<pendingId>:yes\|no` |
Router in `src/interactions/index.ts` dispatches by prefix.

## Interaction rules
- Ack within 3s: `deferReply()` (commands) / `deferUpdate()` (components) before any API call. Modals must be shown **without** deferring first.
- Auth guard first on every interaction (`ALLOWED_USER_IDS`); deny ephemerally.
- After a component is used: disable it (edit message), don't delete.
- Errors → ephemeral, `alerta` + one short sentence in Spanish.

## Autocomplete
Respond ≤25 choices, filter case-insensitive by typed text, ≤3s, no defer. Cache lists (models, agents) 60s.

## Limits
| Item | Limit |
|---|---|
| Embed description | 4096 |
| Field value / name | 1024 / 256 |
| Fields per embed | 25 |
| Total embed chars | 6000 |
| Action rows / buttons per row | 5 / 5 |
| Select options | 25 |
| Modal text inputs | 5 |
| Button label | 80 |
| Bot upload | assume 10 MB unless guild boost allows more |

## Command registration
Guild commands via `npm run register` (instant). Global only for release. One file per command in `src/commands/` exporting `{ data, execute, autocomplete? }`.
