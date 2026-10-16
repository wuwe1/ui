# Outline

A long scroll's table of contents as a column of ticks on its right edge – one per item, the ones in view long and dark, so you always know where you are and can get anywhere in one move.

## When to use

- A conversation: one tick per message you sent
- A long document beside its content: one tick per section
- A page of many stacked examples: one tick per example

## When not to use

- Under two items, or content that fits on one screen – there's nowhere to go
- Navigation between pages – a sidebar
- A handful of items that always fit – put them on screen as tabs or links

## Anatomy

- Column – absolute, the full height the ticks may use; the ticks center in it and never push the content aside
- Ticks – 2px tall, 8px apart (12 for a finger), packed tighter when they don't fit; under 4px apart only every few are drawn, plus those in view and the pointed one
- Tick widths – out of view 6px faint, in view 16px, pointed 20px in `foreground`
- List – the title, a description, then every item: a number (`numbered`), the label in two lines at most; lines in view dark, the rest muted
- Floating item – while a finger drags: the number and up to three lines, above-left of the finger; dragged far left, 「松开取消跳转」

## States

- Default
- Few – three items: roomy ticks
- Many – 240 items: packed, every few drawn
- Long lines – the list clamps to two lines, the floating item to three

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `{ id, label }[]` | – | In order |
| `view` | `{ a, b } \| null` | – | The items in view, a through b |
| `onJump` | `(index) => void` | – | Scroll there |
| `title` | `string` | – | Names the ticks and the list: 「目录」 |
| `description` | `string` | – | Under the list's title: 「你的 12 条消息」 |
| `scroller` | `RefObject<HTMLElement>` | – | The wheel over the ticks scrolls it |
| `numbered` | `boolean` | `true` | Numbers in the list and the floating item |
| `className` | `string` | – | Positions the column: `absolute top-2 right-0 bottom-2` |

`useInView(scroller, targets, deps)` returns `{ view, long }` for items that are elements: `targets` lists them in order; `long` is whether the box scrolls at all.

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | Reaches the ticks |
| ↑ ↓ | On the ticks: jumps to the previous or next item |
| Home End | On the ticks: the first or last item |
| Enter or Space | Opens the list, focus on where you are |
| ↑ ↓ Home End | In the list: move focus |
| Esc | Closes the list, focus back on the ticks |

## Accessibility

- The ticks are one button named by the title and description; its shortcuts in `aria-keyshortcuts`
- The list is a `nav`; where you are carries `aria-current="location"`
- A jump is announced once: 「第 7 条：补 StatusIcon 的规格」
- Hover and tap open the list without moving focus – someone may be typing; only the keyboard moves it in

## Motion

- Ticks grow and darken in 150ms as the view moves or the pointer passes
- The list fades in beside the ticks (a sheet from the bottom on phones)
- Reduced motion: ticks change at once

## Responsive behavior

- Desktop: hover the ticks 150ms to open the list, leave both for 200ms to close; a click on a tick jumps without opening it
- Phones: hold 300ms or start dragging to scrub, let go to jump, drag 48px left first to cancel; a tap opens the list as a sheet; a sideways swipe is left to whatever owns it
- Fingers get 12px between ticks

## Notes for AI

- Render it only when there are two or more items and the content is longer than its box (`long`)
- Leave room for it: `pr-8` or so on the scrolling content
- Scroll only the box when jumping – `scrollIntoView` also moves outer scrollers and hides sticky heads
- A host whose items aren't single elements (a conversation's turns) reckons `view` itself
