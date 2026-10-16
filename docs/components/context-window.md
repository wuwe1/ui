# ContextWindow

What fills an agent's context – a field of cells colored by part, a row per part, how much is left – and the one thing to do about it: compact.

## When to use

- Next to a composer, to see why a conversation got slow or forgetful, and to compact it before the window fills
- A session panel that explains a request: how much went to the system prompt, tools, memory files and history

## When not to use

- Plan usage over hours or weeks – a usage meter
- A plain 「72%」 – a ring or a bar says that with less
- More than about six parts – group the small ones; the grays have to stay apart

## Anatomy

- Card head – the title, the model as a tag on the right
- Big number – tokens used, `/ limit`, the percentage on the right; hovering a part rolls it to that part
- Field – 216 cells, 36 to a row; one cell is `limit / 216` tokens, a part with tokens gets at least one; empty cells are `muted`
- Rows – a swatch, the label, a › when it has items, the tokens; the compact part has 「压缩」 before its tokens
- Items – an open row lists them, monospace for paths and names
- Tray – 「剩余 X，到 N% 时自动压缩」; while compacting 「正在压缩消息…」; after, 「已压缩，省下 X」

## States

- Loading – `parts` is null: the card's shape in skeletons, so nothing jumps when the numbers land
- Default
- Near the limit – from `warnAt` the percentage turns amber
- Compact – the part's cells wave, the button shimmers 「压缩中」; when its tokens drop the cells clear left to right, the numbers roll down, the button turns into 「✓ 已压缩」 for 3 seconds
- Can't compact – 「压缩」 is off and says why (`compactDisabled`)
- Fresh – almost empty
- Narrow – below 310px, 24 cells to a row; 「压缩」 keeps only its icon

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `parts` | `ContextPart[] \| null` | – | null is loading. `{ id, label, tokens, items?, tone?, compact? }`, in the field's order. `tone` 0–3 is dark to light gray; `compact` makes the part blue and gives it 「压缩」 |
| `limit` | `number` | – | The window, in tokens |
| `title` | `string` | 「上下文」 | |
| `hideTitle` | `boolean` | – | The host already shows a heading: the title only names the group, and the model tag moves beside the big number |
| `model` | `string` | – | The tag in the head |
| `threshold` | `number` | – | Share where it compacts on its own, for the tray |
| `warnAt` | `number` | `0.8` | Share from which the percentage turns amber |
| `onCompact` | `(partId) => unknown` | – | Shows 「压缩」. A promise keeps it busy until it settles |
| `compactDisabled` | `string` | – | Why it can't compact now |
| `compacting` | `boolean` | – | The host knows a compaction is going |

`ContextItem`: `{ id, label, tokens, mono?, title? }`.

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | Through the rows that open, then 「压缩」 |
| Enter or Space | Opens or closes a row, presses 「压缩」 |

## Accessibility

- A group named by its title; one sentence for screen readers: 「已用 13.2 万 / 20 万，66%」. The big number and the field are `aria-hidden` – every number is in the rows
- Rows with items are buttons with `aria-expanded`
- The tray is `role="status"`: compacting, and how much it saved, are announced once
- A disabled 「压缩」 is named with its reason
- Rows are 40px tall on touch screens

## Motion

- Hovering a part (row or cells, mouse only) fades the other cells to 25% in 200ms and rolls the big number
- Compacting: a wave of opacity through the part's cells, left to right, until it's done
- Any change in the field sweeps left to right; numbers roll in 300ms
- Reduced motion: the cells stand at half opacity while compacting, numbers jump, nothing sweeps

## Responsive behavior

- Fills its container; from 310px down it puts 24 cells to a row
- Dark mode built in

## Notes for AI

- The card counts nothing – pass the numbers the model reports
- Mark the one part that grows as `compact`; give the rest tones from the bottom layer up: system 0, tools 1, memory 2, the rest 3
- In a popover or sheet, use `Popsheet` with `bare`: the card's head is the panel's head
- Keep the card open while compacting; pass `compacting` while the work runs and update the part's tokens when it's done – the card waits for them to drop
