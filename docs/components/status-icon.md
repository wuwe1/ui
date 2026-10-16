# StatusIcon

The one status mark – a dot or a ring in a 16px slot, beside a session, a step or a connection. Every place that shows a status uses it, so a color means the same thing everywhere.

## When to use

- A list of sessions or runs: sidebar, Inbox, a top bar
- A finished tool step: worked or failed
- A connection or a feature that may be off

## When not to use

- Progress inside a line of text – `Shimmer`
- A loading slot in a button – `Spinner`
- Anything decorative – a dot here always means a status

## Anatomy

- Solid dot – look at this: amber `waiting` (with a ripple), green `done` (finished, unseen), red `error`
- Blue dot with a ripple – `running`
- Blue ring with a ripple – `background`: tasks running while the agent idles
- Gray ring – `terminal`: open somewhere else
- Green or red dot – `ok` or `failed`: a finished step
- Faint gray dot – `off`: not connected, not in use

## States

- Every mark – all nine side by side, with their names

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `s` | `"waiting" \| "running" \| "background" \| "done" \| "error" \| "terminal" \| "ok" \| "failed" \| "off" \| null` | – | null draws an empty slot, so rows stay aligned |
| `label` | `string \| null` | the mark's name | The tooltip; null when words beside it already say it |
| `className` | `string` | – | |

`statusLabel(s)` gives the name: 「待确认」, 「运行中」…

## Accessibility

- Never color alone: the mark has a tooltip with its name, and the row it sits in says the status in words
- Pass `label={null}` when the words are right beside it, so screen readers don't hear it twice

## Motion

- `waiting`, `running` and `background` ripple outward, 1s, forever – something is live
- Reduced motion: the ripple stands still as a faint ring, so running still reads apart from a still dot

## Responsive behavior

- Always 16px; the dot 8px
- Dark mode built in

## Notes for AI

- Colors mean only this: amber needs you, red error, blue running, green finished, gray neutral – don't add a meaning
- Pass a status name, never app data; the app maps its own states onto these
