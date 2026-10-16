# Spinner

A busy mark for an icon slot – a dot with a ripple, in the text color.

## When to use

- A button whose action is running: stop, send, delete – it stands in for the icon
- A chip that's still working, like an upload
- Centered in a region with no known shape – `Loading` does this

## When not to use

- Next to a line of text – shimmer the text with `Shimmer`
- Content with a known shape – use `Skeleton`
- An agent run in a list – use `StatusIcon` `running`, the blue dot. Spinner takes the text color and means "this control is busy"

## Anatomy

- A dot half the box – 8px in the default 16px – in `currentColor`
- A ripple that grows from the dot and fades

## States

- In a button – replaces the icon; the button is disabled
- In a chip – before the file name, until the upload finishes

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `className` | `string` | – | Size (`size-3`) and color (`text-muted-foreground`) |
| `aria-label` | `string` | 「加载中」 | What is busy, when there's a better word: 「停止中」 |

Other `span` props pass through.

## Accessibility

- `role="status"`, named by `aria-label`
- A button keeps its own label; the spinner doesn't replace the name

## Motion

- The ripple scales out and fades in 1s, on a loop – Tailwind's `animate-ping`
- No rotation: the same shape as StatusIcon's running dot
- With prefers-reduced-motion the ripple stands still as a faint ring

## Responsive behavior

- A 16px box; scale it with `size-*`
- Takes the text color, so it reads on any surface in either mode

## Notes for AI

- Swap it in for the icon – don't add it beside one
- Disable the control while it shows
