# ThinkingLoader

The line an agent UI shows while the model works – a shimmering label and a clock, no spinner.

## When to use

- The wait between sending a message and the first token or tool call
- A phase the product actually knows: 「正在压缩上下文…」, 「正在读取 12 个文件…」
- Inside a chat bubble or next to a button – the pill variant

## When not to use

- Steps people should see one by one – use ToolCallGroup
- Content with a known shape on its way – use Skeleton
- Phases made up on a timer – show only what the product knows
- Waits under half a second – it would only flash

## Anatomy

- Label – shimmers while working
- Clock – Elapsed, counting from `since`
- Pill – a bordered capsule around both
- Done – a check and the done label; the clock goes

## States

- Waiting – the label sweeps, the clock ticks
- Phase change – the old label rolls up and out, the new one rolls in, the width glides
- Pill
- Done – 「想了 4 秒」 after a check

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | 「正在等待回复…」 | What the model is doing now |
| `since` | `number` | – | When the wait began, in ms since the epoch – shows the clock |
| `done` | `boolean` | `false` | Stops the sweep and the clock, shows the done label |
| `doneLabel` | `string \| (seconds: number) => string` | `(s) => 「想了 ${s} 秒」` | The label once done – a function gets whole seconds since `since` |
| `variant` | `"plain" \| "pill"` | `"plain"` | A line in the conversation, or a capsule |
| `className` | `string` | – | Classes on the root |

## Accessibility

- `role="status"`: screen readers hear each new label and the done label, once
- The clock, the check and a label on its way out are `aria-hidden`

## Motion

- The label sweeps – Shimmer, 1.8s a pass
- A new label: the old one rolls up and blurs out, the new one rolls in from below, 200ms, and the box glides to its width
- Done: the check fades and grows in, 200ms; the sweep stops where it is
- With prefers-reduced-motion labels switch at once and nothing sweeps

## Responsive behavior

- Sizes to its label – keep labels to one short line
- Dark mode built in

## Notes for AI

- Drive `label` from real events; never cycle phases on a timer
- Set `since` to the last thing that happened, not to mount time – a refresh mustn't reset the clock
- Unmount it when the first token lands, or set `done` where a record of the wait helps
