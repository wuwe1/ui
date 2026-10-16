# MatchReview

An agent's proposal of which item on the left goes with which on the right, settled by a person pair by pair – matched parts tinted, pairs that share an item grouped, keys all the way.

## When to use

- An agent matched two lists and needs a yes per pair: a shop's variants to a supplier's, orders to purchase orders, statement lines to invoices
- The answer becomes a rule the agent keeps – what the person settles is fed back, accepted, changed or rejected
- Most pairs are sure and only a few need a look; the sure ones fold away

## When not to use

- One item takes several on the other side, or many-to-many – tagging, splitting a payment; a pick list does that
- A single yes or no – `ApprovalCard`
- Edits to one text – an inline diff
- Hundreds of pairs to sort and filter – a table

## Anatomy

- Tray – `label` in small gray, the card inside
- Head – the count waiting and 「待确认」, previous and next, 「全部接受」. All reviewed: 「已看完」, 「撤销」, 「完成」. Settled: 「已确认」 and the count kept
- Columns – the two names from `columns`, over their columns
- Row – a pair: the left label, the right label; matched parts tinted green on both, a mismatch (`ok: false`) red, the rest gray; a `note` at the end. Accepted rows lose their tint and get ✓; rejected ones strike the right label
- Group – pairs that point at the same right item, together on a faint ground: their left labels stacked, the item once with ×N in amber
- Focused pair – the right column spreads into its candidates, the chosen one as is and the rest dimmed, `signals` as thin bars at the end; a dot marks a candidate another pair already has; 「都不是」 under them
- Focused group – the left label not chosen dims
- Bar – one dark bar floats over the focused row: 「对 Y」「不对 N」 for a pair, 「留这个 Y」「都要 A」 for a group
- 已对上 – the sure pairs, folded under a count; open, they show their matched parts

## States

- Default – a pair focused, its candidates spread; a group below; the sure ones folded
- Conflict – a group focused, the pair not chosen dimmed
- All reviewed – every row settled; 「完成」 waits
- Settled – `decisions` passed back: read only
- No images – no thumbnails anywhere; the labels carry it
- Loading – `pairs` null: the card's shape in skeletons
- Empty – 「没有要对照的」
- Long – labels truncate in a row and show whole on hover; the bar stays on the right

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `pairs` | `MatchPair[] \| null` | – | null is loading |
| `signals` | `MatchSignal[]` | `[]` | `{ id, label }` – the scores each candidate carries, as bars in this order |
| `columns` | `[string, string]` | – | Names of the two columns |
| `label` | `ReactNode` | – | On the tray – what is being matched |
| `decisions` | `MatchDecision[]` | – | Settled: shows these, read only |
| `onDecide` | `(d: MatchDecision) => void` | – | Each pair decided, a group's item kept |
| `onDone` | `(all: MatchDecision[]) => unknown` | – | 「完成」 with a decision for every pair, sure ones as proposed. A promise locks the card until it settles; a rejection reopens it |
| `className` | `string` | – | |

`MatchPair`: `id`, `left` and `right` (`MatchItem` – `{ id, label, image? }`; `right` null for no match), `links`, `confidence` (`"sure"` folds it, `"unsure"` waits), `candidates` (`{ item, scores?, links? }[]`, the proposal first), `note`.

`MatchLink`: `{ left: [start, end], right: [start, end], ok? }` – a part of each label, `ok: false` for same place, different value. The host computes them.

`MatchDecision`: `{ pair, right, proposed }` – `right` equal to `proposed` is accepted, different is changed, null is rejected. A group's item kept by one moves the others to their next candidate; kept by all, they all point at it.

## Keyboard interactions

| Key | Does |
|---|---|
| ← → | Previous or next row waiting |
| ↑ ↓ | Among a focused pair's candidates, or a group's pairs |
| Y or Enter | Accept the chosen candidate; in a group, keep the item for the chosen pair |
| N or Backspace | Reject the pair |
| A | In a group, all keep it |
| U or ⌘Z | Undo |
| ⌘Enter | 「完成」, once all are reviewed |
| Esc | Leave the row |

## Accessibility

- A group named by `label`; each row is a button that reads both labels and its state – 「03,60*90 对 kitty猫款式5，已确认」
- A focused pair's candidates and a group's pairs are radio groups; ×N reads 「2 个对到这一项」
- Tinted parts are never the only cue: matched parts sit beside gray ones, a mismatch is red text too
- Decisions, keeps and undo are announced once in a polite live region
- The bar's buttons carry their keys as text

## Motion

- The bar glides to the focused row in 200ms
- Dimming fades in 150ms; a tint deepens on hover in 150ms
- Reduced motion – the bar jumps, nothing fades

## Responsive behavior

- Fills its container; the two columns split the width and truncate
- Thumbnails only when some item has an image
- Dark mode built in

## Notes for AI

- Compute `links` and `scores` in the host – the card draws them, it doesn't guess. Without links a label is plain
- Put the proposal first in `candidates`; keep them few – three is plenty
- Feed `MatchDecision` back as the answer: accepted pairs become rules, changed ones correct the proposal, rejected ones should not be proposed again
- A group isn't an error: two variants can share one supplier item. Let the person keep it for one or for all
