---
name: plan-workflow
description: How to start, execute, track, and close a phase from plans/. Load at session start, when resuming work, or before marking a phase done.
---

# plan-workflow

## Start / resume
1. Read `plans/README.md`. Pick the first phase whose Status is not `done`.
2. Set its Status to `wip`. Open `plans/<phase>.md`.
3. Resume at the first unchecked `[ ]` task. Read the phase's **Done when** before coding.
4. Load the skills the phase touches (see `agent.md` skills table).

## During
- One task at a time. After each: `tsc --noEmit` clean, then tick `[x]`.
- Record anything non-obvious right under the task:
  `> note: <deviation | real API shape | decision | blocker>`
- Discovered work that belongs to a later phase → add as `[ ]` in that phase file, don't do it now.
- Out-of-scope ideas → `plans/backlog.md`.
- Blocked by a design-changing decision → stop, ask, write `> note: BLOCKED — <question>`.

## Close
A phase is done only when all hold:
- [ ] All tasks `[x]` (or explicitly moved, with a note).
- [ ] **Done when** verified manually against a live OpenCode server.
- [ ] `tsc --noEmit` clean; no `TODO` left without a note.
- [ ] `readme.md` updated if commands, env vars, or setup changed.
Then: Status → `done` in `plans/README.md`, one commit:
```
feat(pN): <scope in imperative, ≤60 chars>

- <key change>
- <key change>
```

## Don't
- Don't start phase N+1 while N is `wip`.
- Don't rewrite plan files wholesale; edit tasks in place.
- Don't delete notes; they are the project history.
