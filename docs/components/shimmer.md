# Shimmer

A line of text that is still in progress – a light sweeps across it until the work is done.

## When to use

- The one line that says what is happening now: 「正在等待回复…」, 「正在压缩上下文…」
- The summary of a running step in a tool group – the name and the clock stay still
- A status line beside the action that started it: 「正在试跑…」

## When not to use

- Lists of sessions or tasks – the status dot already says running, and a column of sweeping rows is noise
- Content still loading – use `Skeleton` at its size
- An icon slot in a button or chip – use `Spinner`
- Paragraphs – the band crosses every line at once and reads as flicker; shimmer a short label
- Waits under half a second – the sweep would only flash

## Anatomy

- The text, in `muted-foreground`
- A band of `foreground` that crosses it, left to right

## States

- In progress – the band sweeps
- Running step – only the summary shimmers
- Long – cut with `…`; the ellipsis shimmers with the text
- Done – `active={false}`: plain text in the caller's color, same width, nothing moves

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `active` | `boolean` | `true` | `false` stops the sweep and leaves plain text |
| `className` | `string` | – | Classes on the `span` – truncation, font, size |

Other `span` props pass through, `role` included. The sweep is the `shimmer` utility in `theme/variants.css` – put it on any element; `shimmer-bg` is the same sweep on a background.

## Accessibility

- Silent on its own: give the line `role="status"` when a screen reader should hear it, and keep any clock `aria-hidden`
- The text stays real text – read in full, selectable, copyable
- Contrast holds in every frame: the dimmest is `muted-foreground` at 4.5:1, and the band only adds
- Forced colors – the band drops and the text takes the system color

## Motion

- The band sweeps left to right in 1.8s, linear, with no pause – steady work, not a heartbeat
- Done – the sweep stops and the text settles to its color, no fade
- With prefers-reduced-motion there is no band; the text is plain `muted-foreground`

## Responsive behavior

- Sizes to its text; inside `truncate` it cuts with `…` and keeps sweeping
- One pass per 1.8s at any width, so long text sweeps faster
- Dark mode built in: the band runs from `muted-foreground` to `foreground` in either mode

## Notes for AI

- Wrap the words in progress, not the row – names and clocks stay outside
- One `Shimmer` can hold several spans, and one band crosses them all; nothing inside may get its own layer – `opacity`, `transform`, `filter` – or its text drops out of the mask and vanishes. Dim with a color instead
- Turn `active` off when the work ends instead of swapping elements – the row keeps its width
- It fills glyphs with `-webkit-text-fill-color`, so a `text-*` class on the same element can't break it
- Pair a long wait with a clock: `tabular-nums`, `aria-hidden`
