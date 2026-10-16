# @wuwe1/ui

The component library shared by wuwe1's projects: theme, base components, AI product components. Public – no personal details.

## Commands

- `pnpm dev` – the showcase: every token, every state of every component
- `pnpm check` / `pnpm test` / `pnpm build`
- `pnpm gen` – regenerate `tokens.css` after a theme change

Done means check and test pass. A changed component or theme is checked on the showcase in every state, at phone width, in both modes.

## Layout

| Path | What |
|---|---|
| `src/theme/` | The theme – design in `docs/theme.md` |
| `src/components/` | One component per file, imported as `@wuwe1/ui/<file>` |
| `src/styles.css` | The entry projects import |
| `showcase/` | The showcase |
| `docs/` | `theme.md`; `principles.md` – level of finish and craft; `motion.md` – the motion vocabulary; `writing.md` – prose, naming, UI copy; `components/` – specs |
| `.claude/skills/component/` | How to build a component |

Each file says what it does in its first comment.

## Conventions

- Prose is English: docs, specs, comments, commit messages. UI copy is Chinese – our products are. Rules in `docs/writing.md`
- Components use tokens only; a signal color used as text is `-strong`
- Components take data, not services: props in, callbacks out
- Build components with `.claude/skills/component/SKILL.md`
- affectUI: look at its pages, never its code – understand, redesign, propose, then build (`.claude/skills/component`)
- Commit on main

## Writing AGENTS.md

- The root holds what every task needs: commands, layout, conventions
- Rules for one directory go in that directory's `AGENTS.md`, next to a one-line `CLAUDE.md`: `@AGENTS.md`
- Long explanations go in `docs/`, linked in one line
- Skip what the code shows; write only what was tried
- Under 200 lines each
