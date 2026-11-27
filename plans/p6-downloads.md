## P6 — Downloads
- [x] Register outputs in `files` (`direction='out'`); prune >7 days.
- [x] Detect output files from events/message parts (tool writes, images, docs, diagrams).
- [x] Final embed lists files (`descarga` + name + size) + buttons `dl:<id>` (select menu if >5).
- [x] Button handler: defer → attach file; images also as embed image.
- [x] Mermaid/PlantUML → PNG if renderer available; else source + note.
  > note: Mermaid via `mmdc`/`mmdc.cmd`, PlantUML via `plantuml`; missing renderer attaches source. Fenced ```mermaid/plantuml``` saved under `.openbot/diagrams/`. Rendering never fails the task.
- [x] Over `MAX_FILE_MB` → zip; still over → path message.
  > note: Zip uses archiver v8 `ZipArchive`. Oversize after zip replies with the workspace-relative path and "supera el límite de Discord incluso comprimido".
- [x] `/download <path>` with path-traversal guard.
  > note: `workspaceFile` resolves against cwd, rejects absolute/`..` paths, and rejects symlinks whose realpath leaves the workspace.

**Done when:** asking the agent to create a doc, an image, and a Mermaid diagram yields three working download buttons.
