# ComposerSettings

How the next message runs – model, thinking effort, permission – behind one chip in a Composer's control row, instead of three icons nobody can read.

## When to use

- A few choices that shape the next run and stay put between messages
- One of them a long list (models), the others short rows (effort, permission)

## When not to use

- One choice – a plain dropdown
- Choices about the conversation's state, not the next message – the Composer's tray
- Something that needs explaining first – a dialog

## Anatomy

- Chip – a sliders icon, the summary (the main pick, the rest muted, no separators), a chevron
- Panel – a popover above the chip on desktop, a sheet on phones; no title bar
- List section – a label, one option per line with a description, a check on the pick; rarer options under 「更多版本」, open by itself when one of them is picked
- Segmented section – a label, a `SegmentedControl` across the panel, the pick's description under it

## States

- Default
- Not the defaults – a pinned version picked: 「更多版本」 opens by itself; the chip shows effort and permission muted
- No effort – a model without effort levels: that section is left out

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `sections` | `SettingsSection[]` | – | `{ id, label, kind: "list", value, onChange, options, more? }` or `{ id, label, kind: "segmented", value, onChange, options }` |
| `summary` | `ReactNode` | – | On the chip |
| `label` | `string` | 「运行设置」 | Names the chip and the panel |
| `onOpenChange` | `(open) => void` | – | Refresh the options when it opens |

`SettingsOption`: `{ value, label, description?, icon?, badge? }`.

## Keyboard interactions

| Key | Does |
|---|---|
| ↑ ↓ on the chip | Opens the panel |
| ↑ ↓ Home End in a list | Moves and picks |
| ← → in a segmented row | Moves and picks |
| Tab | From section to section |
| Esc | Closes, focus back on the chip |

## Accessibility

- A list is a `radiogroup` with one tab stop – the pick; each line is a `radio`
- A segmented row is a `SegmentedControl` – a radiogroup named by its section
- 「更多版本」 is a button with `aria-expanded`

## Motion

- The panel fades in beside the chip; on phones the sheet slides up
- 「更多版本」's chevron turns; its options fade in
- Reduced motion: no movement

## Responsive behavior

- Desktop: 320px wide, above the chip
- Phones: a full-width sheet; lines and segments are 40px tall
- The chip truncates its summary before it squeezes the controls next to it

## Notes for AI

- Put the most important pick first in the summary and mute the rest; leave defaults out
- Keep descriptions to what the pick does, not what it is: 「改文件、运行命令前都请求确认」
