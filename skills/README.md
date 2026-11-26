# Skills

Knowledge the development agent loads on demand. One folder per skill, `SKILL.md` inside with `name` + `description` frontmatter (name = folder name, lowercase, hyphens).

| Skill | Covers |
|---|---|
| [plan-workflow](plan-workflow/SKILL.md) | Running, tracking, and closing phases in `plans/` |
| [opencode-api](opencode-api/SKILL.md) | OpenCode server API, versions, SSE events |
| [discord-ui](discord-ui/SKILL.md) | Commands, embeds, components, emojis, limits |
| [sqlite-data](sqlite-data/SKILL.md) | Schema, migrations, repository, pruning |
| [file-transfer](file-transfer/SKILL.md) | Uploads, downloads, diagrams, path safety |
| [agent-questions](agent-questions/SKILL.md) | Agent questions and permissions in Discord |

## Discovery
OpenCode doesn't scan a root `skills/` folder by default. Pick one:
- Register it as a skill source in `opencode.json` (OpenCode v2 supports custom skill paths).
- Symlink: `ln -s ../skills .opencode/skills`.
- No skill tool: the agent reads `skills/<name>/SKILL.md` directly (agent.md says so).
