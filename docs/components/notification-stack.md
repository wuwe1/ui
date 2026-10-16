# NotificationStack

A few notices that stay until dismissed, stacked behind each other – dismiss the front one to see the next.

## When to use

- Notices in a corner of the app that wait for someone: a new version to reload into, a release, maintenance
- In the page's flow – the foot of a sidebar, above a usage line

## When not to use

- What just happened and can go by itself – `toast`
- Anything that needs an answer before going on – a dialog or an approval card
- More than three or four at once – an inbox or activity list

## Anatomy

- Head – a `StatusIcon` dot and a short tag (「新版本」「已完成」), close. An agent that finished is `ok`, the green dot
- Title – what it's about
- Text – up to three lines, gray
- Action – a footer row under a hairline: the label, then `›`
- Behind – the next card peeks out 30px above – its whole head line, set by the content, not the width – and is 10px narrower per side, the card's padding, so its edges line up with the front card's content. Inset, not scaled: the peeking line keeps its size. More wait unseen
- About 200px wide in a sidebar: 10px padding, 12px corners

## States

- One – nothing above
- Two or more – the next head line above the front card; screen readers hear how many
- Long – the title wraps, the text clamps to three lines, both break anywhere
- Empty – renders nothing

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `notices` | `Notice[]` | – | Front first. `{ id, mark?, tag?, title, text?, action?: { label, onClick } }` |
| `onDismiss` | `(notice) => void` | – | The close button; drop the notice from `notices` |
| `label` | `string` | 「通知」 | The region's name |
| `className` | `string` | – | On the region |

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | Moves through the front card's close and action |
| Enter or Space | Presses them |

## Accessibility

- The stack is a region named 「通知」; each card is an article named by its title
- Only the front card is read and focusable – the ones behind are `inert`
- With more than one, the front card is described as 「第 1 条，共 3 条」; close is 「关闭「标题」」

## Motion

- A dismissed card sinks 6px and fades, 150ms `ease-in-strong`; at the same time the next one moves down 30px and its inset closes to full width, 200ms `ease-out-strong`
- Reduced motion: it goes at once, nothing moves

## Responsive behavior

- Fills its container – a sidebar's width
- Buttons keep their touch size inside a phone drawer

## Notes for AI

- Keep the list in your state; `onDismiss` removes one, and the next becomes the front
- For something that leaves on its own, use `toast` instead
