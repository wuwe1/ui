# Tray

A gray shell around a white card: the card holds the content, the tray holds what the system says about it – a label on top, status and actions below.

## When to use

- An agent's item that needs a look or an answer: a request (`ApprovalCard`), open questions (`DecisionInbox`), a proposal (`MatchReview`, `InlineDiff`)
- Something with a status and one thing to do about it: a connection (`ConnectionCard`), usage (`UsageMeter`), the context window (`ContextWindow`)
- A panel a person works in for a while: `PromptLibrary`

## When not to use

- Plain content with nothing to say about it – a `Card`
- A menu or popover – those float on their own surface, `PopoverContent`
- Rows in a long list – lines, not trays

## Anatomy

- Tray – `muted`, 4px padding, radius `--radius` × 1.8 (18px)
- Label – optional, `TrayLabel`: small gray words over the card, lined up with the card's text
- Card – `TrayCard`: `card`, `border`, `shadow-rest`; its radius is the tray's less 4px (14px), so the corners are concentric in every theme
- Below the card – whatever the tray says: time left, a status, the buttons

Rows inside the card, inset 4px, take the card's radius less 4px (10px, `rounded-lg`).

## States

- Default – a label, a card, a row of actions under it
- Card only – no label, nothing under it
- Several cards – one tray, a card each, 12px apart: accounts in `UsageMeter`
- Floating – `float`: over the page, the tray lifts as a whole – `shadow-float`, a hairline ring, an opaque ground
- Paper theme – a smaller radius, still concentric

## API reference

| Part | Props | Notes |
|---|---|---|
| `Tray` | `float`, `className`, `div` props | A column, 4px between its parts; `float` for a tray over the page |
| `TrayLabel` | `div` props | Truncates to one line; give it an `id` to name the group |
| `TrayCard` | `div` props | Padding is yours – `p-3` lines its text up with the label |

## Accessibility

- No roles of its own – the component inside names the group: `role="group"` and `aria-label` or `aria-labelledby` the label's `id`
- The label is text, read before the card

## Motion

None of its own. A tray folds as the component decides – `ApprovalCard` folds its card into one line when answered.

## Responsive behavior

- As wide as its container; the card fills the tray
- Dark mode built in: `muted` is a translucent layer, so the tray shows on any surface; a floating tray puts `background` under it

## Notes for AI

- Build an agent component as a tray: content in the card, the system's voice on the tray. Don't draw `rounded-2xl bg-muted p-1.5` by hand
- Lifts are two: `shadow-rest` under what rests on a surface, `shadow-float` under what floats over the page. `test/elevation.test.ts` fails on Tailwind's `shadow-sm`, `shadow-md` and the rest
- Nest radii by subtracting the padding: tray 18, card 14, a row inset 4px inside the card 10
