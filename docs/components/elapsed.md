# Elapsed

A clock counting up from a moment – 1.1 under 10 seconds, then 0:12, 2:13, 1:02:13.

## When to use

- How long something has been running: a tool call, a wait for the model, a background task

## When not to use

- A time in the past – use a relative time like 「5 分钟前」
- A countdown – it counts up only

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `since` | `number` | – | The start, in ms since the epoch |
| `className` | `string` | – | Classes on the `span` |

Other `span` props pass through. The format is `elapsed(ms)` in `lib/time.ts`.

## Accessibility

- Next to a status a screen reader already hears, give it `aria-hidden` – a number read every second is noise

## Motion

- Ticks every 0.1s under 10 seconds, then every second; `tabular-nums`, so digits don't jitter

## Notes for AI

- Count from when the thing started, kept outside the component – a refresh mustn't reset it
