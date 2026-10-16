# Placeholder

What fills a space that has nothing to show yet – an empty list says what will appear and how to start; a region still loading shows a spinner. The same file has the small pieces every view needs: `Chevron`, `Facts`, `Boundary`.

## When to use

- `Placeholder` – an empty list, panel or page: what shows up here, and a button to start
- `Loading` – a region whose shape isn't known yet
- `Chevron` – the › of anything that expands
- `Facts` – secondary facts in a row: count, time, status
- `Boundary` – around a page or panel, so a render error never leaves it blank

## When not to use

- Content with a known shape still loading – `Skeleton` at its size
- An error the user can act on in place – say it where it happened
- A line of text in progress – `Shimmer`

## Anatomy

- Placeholder – an icon in a tile (optional), a title (optional), one line on what will appear, buttons below
- Loading – a `Spinner` (a pinging dot) centered in its parent
- Chevron – a 12px ›, turned 90° when open
- Facts – items set apart by space, never by 「·」; empty ones skipped
- Boundary – 「页面出错」, the message, 「刷新」

## States

- Empty – icon, title, line, a button
- Text only – just the line
- Loading – the spinner

## API reference

| Export | Props | Description |
|---|---|---|
| `Placeholder` | `icon?`, `title?`, `text`, `children?` | Centers itself in its parent |
| `Loading` | `className?` | Fills its parent; give it a height where the parent has none |
| `Chevron` | `open?`, `className?` | Without `open` it follows the nearest `CHEVRON` group's Radix `data-state` |
| `Facts` | `items`, `className?` | Out of room, the last item truncates and the others keep their width |
| `Boundary` | `children`, `className?` | Catches render errors below it |

## Accessibility

- The empty line is plain text, read in order; the button inside is a real button
- `Chevron` is decoration – the button it sits in carries `aria-expanded`

## Motion

- `Chevron` turns in 150ms
- `Loading`'s spinner pings outward; with reduced motion it stands still as a faint ring

## Responsive behavior

- `Placeholder` centers in whatever height it's given; its line wraps to the container
- Dark mode built in

## Notes for AI

- Say what will appear, not that nothing is there: 「待确认、出错、运行中的会话会出现在这里」 beats 「没有数据」
- One `Boundary` per independent region, so one broken panel doesn't take the page
