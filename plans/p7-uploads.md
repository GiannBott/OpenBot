## P7 — Uploads
- [ ] Attachment options on `/ask` (up to 3) and `/upload <file> [path]`.
- [ ] "Adjuntar" button (`carga`) on task embeds → prompts user to send file in channel; capture next message from same user (timeout 5 min).
- [ ] Plain message with attachments in a session-bound channel → treated as upload + prompt text.
- [ ] Validate size/MIME; images/PDF as prompt file parts if model supports input type, else save to `UPLOAD_DIR` and reference path.
- [ ] Overwrite confirmation buttons; traversal guard.
- [ ] Register uploads in `files` (`direction='in'`); pending "Adjuntar" waits in `pending_interactions` (`kind='upload'`).
- [ ] Confirmation line: `carga` + name + size + destination.

**Done when:** uploading an image and a `.csv` via each entry point reaches the agent and it can read them.
