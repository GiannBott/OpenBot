## P6 — Downloads
- [ ] Register outputs in `files` (`direction='out'`); prune >7 days.
- [ ] Detect output files from events/message parts (tool writes, images, docs, diagrams).
- [ ] Final embed lists files (`descarga` + name + size) + buttons `dl:<id>` (select menu if >5).
- [ ] Button handler: defer → attach file; images also as embed image.
- [ ] Mermaid/PlantUML → PNG if renderer available; else source + note.
- [ ] Over `MAX_FILE_MB` → zip; still over → path message.
- [ ] `/download <path>` with path-traversal guard.

**Done when:** asking the agent to create a doc, an image, and a Mermaid diagram yields three working download buttons.
