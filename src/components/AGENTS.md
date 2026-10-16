# src/components

Level of finish: `docs/principles.md`. Process: `.claude/skills/component/SKILL.md`.

- Import siblings by relative path with the extension: `./button.tsx`. No `@/` – projects have their own aliases
- Signals: solid `bg-waiting` for dots and icons, `text-waiting-strong` for text, `bg-waiting-subtle` for tints
- Type sizes are `text-2xs` 11px, `text-xs` 12px, `text-md` 13px, `text-sm` 14px, `text-lg` 18px – `cn` drops other names as colors
- Icon buttons: Button `size="icon-xs"` 24px, `"icon-sm"` 28px, `"icon"` 32px
- Every state has a story in `showcase/stories.tsx`. Anything that isn't shadcn as shipped has a spec: `docs/components/<file>.md`
- Copied from shadcn/ui – the first comment says what changed
- End with one `export { … }` – mixer's block test reads it to check its kit
