# Theme

Turn a few knobs; every color follows. Tests hold text contrast. Themes and modes apply to any subtree.

## Three layers

Knobs (`themes.ts`) → tokens (derived in `roles.ts`, generated into `tokens.css`) → Tailwind names (`theme.css`).

Components use only the last layer: `bg-background`, `text-muted-foreground`, `text-waiting-strong`. Never `amber-500`, `#fff` or `text-[13px]`.

## Knobs

| Knob | Controls |
|---|---|
| `neutral` | The gray tint, per mode |
| `signals` | Seven colors with fixed meanings: `waiting` needs you, `unread` new or running, `success`, `destructive`, `added`, `modified`, `renamed` |
| `series` | Eight chart colors, checked for color blindness |
| `radius` | The base corner radius |

## How colors are derived

- Surfaces – fixed lightness steps: `sidebar` < `background` < `card`
- Text – muted text and every `*-strong` are solved for contrast: only lightness moves in OKLCH, until every surface gives 4.5:1
- Layers – `muted` and `accent` are translucent black or white, so they show on any surface
- Signals – three shades: solid for dots and icons, `-strong` for text, `-subtle` for tints
- Wide gamut – colors inside P3 ship as they are; only colors beyond P3 are pulled in

## Change a theme

1. Drag the knobs on the showcase's Theme page; watch both previews and the contrast column
2. Copy, then paste into `themes.ts`
3. `pnpm gen`, `pnpm test`

## Apply a theme

- `data-theme="paper"` – that subtree switches theme
- `.dark` / `.light` – that subtree pins a mode. Neither – it follows the OS, with no white flash
- `applyMode("system")` – sets the class on `<html>`, which Tailwind's `dark:` needs
- `applyTheme(theme, el)` – applies a user-tuned theme

Built on `light-dark()`: Safari 17.5+, Chrome 123+, Firefox 120+.

- Build CSS for those browsers – Vite's `build.cssTarget`. Lower targets make Lightning CSS rewrite `light-dark()` into variables fixed at `:root`, and `.dark` / `.light` on a block stop working
- `dark:` utilities see `.dark` on any ancestor, so they still apply inside a `.light` block on a dark page. Components lean on tokens, which follow the block

## Versus before

| | Before – hand-picked, after affectUI | Now |
|---|---|---|
| Values | One hex set per mode | Derived from knobs |
| Contrast | Muted text on the sidebar 4.3:1, amber text 2.1:1 | Held by tests, all ≥ 4.5:1 |
| Signal as text | The dot's shade | Its own `-strong` |
| Scope | Whole page | Any subtree |

Kept: four grays brightening inward, translucent hover layers, grayscale by default.

## Open questions

- Input borders – 1.2:1 today; WCAG 1.4.11 asks 3:1
- Focus ring – translucent, under 3:1
- Density – 44px rows on phones, 32px on desktop; a knob or not
