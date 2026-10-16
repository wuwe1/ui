# src/theme

Design: `docs/theme.md`.

- `tokens.css` is generated: change `themes.ts` or `roles.ts`, then `pnpm gen`. Commit it stale – CI fails
- A new token goes in `roles.ts` with a `doc`; a text or line token also gets `needs` (body 7:1, secondary 4.5:1, lines in `LINE`). Then its Tailwind name goes in `theme.css`
- Colors are derived in OKLCH, never hand-picked hex. Series colors are the exception – a palette checked for color blindness
- `theme.css` and `variants.css` hold Tailwind directives and keyframes only – mixer compiles every block's classes against them
- Modes ride on `light-dark()` – Safari 17.5+. No compound selectors like `.dark [data-theme]`
