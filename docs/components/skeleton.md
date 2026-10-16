# Skeleton

The shape of content still on its way – a muted block at its final size, swept by the same light as Shimmer.

## When to use

- Content with a known shape: list rows, messages, a diff, a chart
- A panel's first load, before its data arrives

## When not to use

- A line of text in progress – use `Shimmer`
- An icon slot in a button or chip – use `Spinner`
- A region with no known shape – use `Loading` from `placeholder.tsx`
- Waits under half a second – it would only flash

## Anatomy

- A block in `muted`, `rounded-md`; the caller sets size and radius
- A band of `foreground` at 9% that crosses it, left to right

## States

- List – a dot and two lines per row, as tall as a loaded row
- Text – lines at 40–80% width
- Block – one box at the height of what's coming

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `className` | `string` | – | Size and radius: `h-3 w-3/5`, `size-2 rounded-full` |

Other `div` props pass through.

## Accessibility

- Empty, so screen readers skip it; put `aria-busy="true"` on the container that's loading
- Same heights and gaps as the loaded layout – scroll and focus stay put when content lands

## Motion

- Shimmer's sweep: 1.8s, linear, left to right
- Each skeleton sweeps its own width, so lines of different widths are out of phase
- Content replaces it with no transition
- With prefers-reduced-motion the block stands still in `muted`

## Responsive behavior

- Takes the size it's given; fractions (`w-3/5`) scale with the container
- Dark mode built in: `muted` and the band follow the mode

## Notes for AI

- Copy the loaded layout: same padding, same gaps, one skeleton per line of text
- Three rows are enough for a list – don't fill the screen
- A placeholder for a status dot is `size-2 rounded-full` inside a `size-4` slot
