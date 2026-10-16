# SegmentedControl

Pick one of two to six options that apply right away – a pill on a gray track glides to the pick.

## When to use

- Views of the same content: 「预览 / 源码 / 改动」, a panel's tabs
- A setting that applies at once and whose every option should stay in sight: thinking effort, permission
- Filters with a count each: memory groups
- Tools of which one is on: 「箭头 / 画笔」

## When not to use

- More than six options, or labels longer than a few words – a select or a menu
- Options that need a line each to explain – a list of radios, like ComposerSettings' model list
- On or off – a switch
- Several at once – a `ToggleGroup` with `type="multiple"`
- A choice that waits for a Save button – radios in the form

## Anatomy

- Track – `muted`, rounded, 2px padding
- Pill – `raised` with a shadow and a hairline ring, under the picked option
- Option – an icon, the label, a gray count; the pick's label is semibold, the rest `muted-foreground`
- Fades – at an end that hides more options, when the row scrolls

## States

- Default
- With icons
- With counts – a count change widens the option and the pill follows
- Sizes – sm and md
- Full width – equal segments, long labels end with …
- Disabled – one option, or the whole control
- Tabs – `kind="tabs"`, each option controls a panel
- Too many to fit – scrolls sideways with fades; the pick scrolls into view
- Dimmed – an option with nothing in it is quieter but pickable
- Nothing picked – no pill; the first option holds the tab stop

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `options` | `SegmentOption[]` | – | `{ value, label?, icon?, count?, disabled?, dim?, ariaLabel?, title?, controls? }`; give icon-only options an `ariaLabel` |
| `value` | `string` | – | Controlled pick |
| `defaultValue` | `string` | first enabled | Uncontrolled start |
| `onChange` | `(value: string) => void` | – | On click and on arrow keys; never called with nothing |
| `size` | `"sm" \| "md"` | `"md"` | 24px or 28px options, 40px on touch screens |
| `fullWidth` | `boolean` | – | Fills its container with equal segments |
| `kind` | `"radio" \| "tabs"` | `"radio"` | A radiogroup, or a tablist that switches panels |
| `disabled` | `boolean` | – | Disables the whole control |
| `id` | `string` | – | With `kind="tabs"`, tab ids are `${id}-${value}` |
| `aria-label` | `string` | – | Names the group – or `aria-labelledby` |
| `className` | `string` | – | Classes on the root |

The key logic is `next` and `stop` in `lib/segmented-control.ts`.

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | Reaches the pick – one tab stop for the whole control |
| ← or → | Picks the previous or next option, wrapping; ↑ ↓ too as a radiogroup |
| Home or End | Picks the first or last option |
| Enter or Space | Picks the focused option |

Disabled options are skipped.

## Accessibility

- A `radiogroup` of `radio`s with `aria-checked`, or with `kind="tabs"` a `tablist` of `tab`s with `aria-selected` and `aria-controls`
- Roving tab stop: only the pick is in the tab order
- The semibold copy of a label is `aria-hidden`, so a name is read once; a count is part of the name
- Focus ring on the focused option, keyboard only
- Options are 40px tall on touch screens, so the track is 44px

## Motion

- The pill glides to the pick; the edge facing it leads in 200ms, the other follows in 300ms, `ease-out-strong` – it stretches a little and settles
- Labels cross-fade from regular to semibold in 150ms while the semibold copy holds the width
- Pressing scales the pill to 0.97
- A label or count that changes width moves the pill at once, with no glide
- Reduced motion – the pill fades in at its new place, no glide, no press

## Responsive behavior

- Too many for the width – it scrolls sideways: swipe, drag with a mouse, or turn the wheel; fades mark the ends that hide more
- A tap picks on lift, so a swipe to scroll never picks
- `fullWidth` fills its container; otherwise it is as wide as its options, up to the container
- Dark mode built in: `raised` sits a step above the track

## Notes for AI

- Use it for every pick-one row that applies right away; not `ToggleGroup type="single"` – that one lets people pick nothing and its arrows only move focus
- Two to six options, short labels; past that use a select
- `kind="tabs"` only when it switches panels; give each option `controls` and each panel `role="tabpanel"`
- Put explanations under the control, for the pick only – not inside the options
