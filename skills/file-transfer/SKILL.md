---
name: file-transfer
description: Uploading files from Discord to the agent/workspace and delivering generated files (documents, images, diagrams) back via download buttons. Load before touching src/files/, upload/download commands, attachment handling, or output detection.
---

# file-transfer

## Path safety (both directions)
- Resolve every path against the workspace root; reject if the resolved path escapes it (`path.relative` starts with `..` or is absolute).
- Reject symlinks pointing outside the root. Never show absolute host paths to users; show workspace-relative paths.

## Upload: entry points
1. `/ask` attachment options (up to 3) and `/upload <file> [path]`.
2. "Adjuntar" button (`up:<pendingId>`, `EMOJI_CARGA`) on task embeds → bot asks the user to send the file; next message with attachments from the same user in that channel within 5 min is captured. Track in `pending_interactions` (`kind='upload'`).
3. Plain message with attachments in a channel bound to a session → upload + message text as prompt.

## Upload: flow
1. Auth guard. Validate size ≤ `MAX_FILE_MB` and MIME (from Discord `contentType` + extension check).
2. Download from Discord CDN (stream to disk; don't buffer large files in memory).
3. Route:
   - Image/PDF **and** current model declares that input modality → send as prompt file part (data URL + mime).
   - Otherwise → save to `UPLOAD_DIR` (default `./uploads/`, inside workspace) and reference the relative path in the prompt. If an image couldn't go to the model, say so.
4. Existing file at destination → confirm with `ow:` buttons; never overwrite silently.
5. Register in `files` (`direction='in'`). Confirm: `EMOJI_CARGA` + name + size + destination.

## Download: detecting outputs
- From SSE/message parts: tool file writes/edits, generated images, attachments in assistant parts. Verify event/part shapes via skill `opencode-api`.
- Deduplicate by path per task (last write wins). Register each in `files` (`direction='out'`).

## Download: delivery
- Final task embed lists outputs: `EMOJI_DESCARGA` + name + size.
- ≤5 files → one button each (`dl:<id>`, label = file name ≤80 chars). >5 → one string select (≤25) + "Descargar todo" (zip).
- Click: auth → `deferReply` → stat file (gone? → "El archivo ya no existe") → attach.
- Images: also show as embed image via `attachment://<name>`.
- Ephemeral replies when `channel` is shared and file may be sensitive (config flag).
- `/download <path>`: same delivery after path safety check.

## Diagrams
- Mermaid (`.mmd` or fenced ```mermaid in output) → render PNG with `mmdc` if available; attach PNG + source.
- PlantUML → render only if a renderer is installed; else attach source and note it.
- Never fail the task because rendering failed.

## Size limits
Over limit → zip (Node `zlib`/`archiver`). Still over → reply with relative path and "Supera el límite de Discord".
