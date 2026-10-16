# InlineDiff

An agent's edit to a text, shown in place – removed words struck in red, added words in green – and settled change by change.

## When to use

- An agent rewrote text a person owns – a prompt, a product description, a reply – and each edit needs a yes
- 「改短一点」「改得正式些」: edits that are small and scattered through the text
- A review step where nothing changes without an explicit yes

## When not to use

- Code and other line-based files – a line diff with line numbers
- A full rewrite where almost every word changes – show the new text beside the old
- Suggestions while typing – this reviews a finished suggestion; it isn't a text field
- Which item goes with which – `MatchReview`; one yes or no – `ApprovalCard`

## Anatomy

- Tray – `label` in small gray: who suggested it, what was asked
- Head – the count waiting and 「待确认」, previous and next, 「全部拒绝」「全部接受」. All reviewed: 「已看完」, 「撤销」, 「完成」. Settled: 「已确认」 and how many were accepted and rejected
- Text – running text, line breaks kept. A change is its removed words – `removed`, struck, tinted – then its added words in `added`, tinted. The change in focus rings
- Bar – one dark bar floats over the change in focus: 「接受 Y」「拒绝 N」
- A decided change turns into plain text: its new words, or its old ones

## States

- Default – changes waiting, nothing in focus
- Deciding – a change in focus with the bar over it; decided ones plain
- All reviewed – every change decided; 「完成」 waits and 「撤销」 steps back
- Settled – `decisions` passed in, or 「完成」 done: the final text, read only
- Read only – `readOnly`: the marks, no head, no decisions
- Writing – `suggested` null: 「正在改写…」 shimmers in the head over the original in gray
- No changes – the suggestion equals the original: 「暂无修改」
- Long – the head sticks to the top while the text scrolls; a change wraps across lines with its tint

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `original` | `string` | `""` | The text as it is |
| `suggested` | `string \| null` | – | The agent's version, compared word by word. null – still writing |
| `segments` | `DiffSegment[]` | – | Changes worked out elsewhere – `{ type: "equal", text }` or `{ type: "change", remove, insert }` – instead of the two texts |
| `label` | `ReactNode` | – | On the tray above the card; names the region |
| `decisions` | `DiffDecision[]` | – | Settled: one per change, `"accept"` or `"reject"`, read only |
| `onChange` | `(text: string, decisions: (DiffDecision \| null)[]) => void` | – | After each decision and undo; changes still open keep the old words |
| `onDone` | `(text: string, decisions: DiffDecision[]) => unknown` | – | 「完成」. A promise locks the card until it settles; a rejection reopens it |
| `readOnly` | `boolean` | – | Only the marks |
| `className` | `string` | – | Classes on the root |

The logic is in `lib/inline-diff.ts`: `diffWords`, `resolve`, `describe`.

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | The head's buttons, then the changes waiting, in order |
| ← or → | The previous or next change waiting, wrapping |
| Y or Enter | Accept the change in focus and move to the next |
| N or Backspace | Reject it and move to the next |
| U or ⌘Z | Undo |
| ⌘Enter | 「完成」, once all are reviewed |
| Esc | Leave the change |

## Accessibility

- A `group` named by the label. Each change waiting is a button that reads 「第 2 处，共 6 处：把「写蝦皮」改成「为蝦皮台湾站写」。按 Y 接受，N 拒绝」
- Removed words are `del`, added words `ins`; once decided, only the words kept are left in the text
- Decisions, both 全部 buttons, 撤销 and 完成 are announced in a polite live region with how many are left
- After the last decision focus moves to 「完成」, so the keyboard is never stranded
- The bar's buttons carry their keys as text and never take focus – it stays on the change
- Color is never the only cue: removed words are struck through
- The change in focus carries `data-escape="local"`, so Esc leaves it without closing a `Popsheet` around the card

## Motion

- Deciding fades the dropped words and the kept words' tint in 150ms; then the text closes up
- The bar glides from change to change in 200ms, `ease-out-strong`, and fades in where it first shows
- ‹ › and decisions scroll the next change into view when it is out of sight
- Reduced motion – decisions apply at once; the bar jumps

## Responsive behavior

- Fills its container; the text wraps, and a change across two lines keeps its tint on both
- The bar stays inside the card down to 320px: above the change, or below it when above would cover the head
- Touch screens – tap a change to bring the bar; its buttons grow to 40px and drop the key hints
- Under 360px the arrows step aside; tap the changes instead
- Dark mode built in

## Notes for AI

- Pass the person's text as `original` and the agent's version as `suggested`. Chinese is compared by words, so an edit doesn't take the whole sentence with it
- Ask the model to keep unchanged sentences word for word – the fewer stray edits, the easier the review
- Write back what `onDone` hands over. Changes left open keep the old words
- For a long document, compare it paragraph by paragraph on the server and pass `segments`; keep the array stable – new segments start the review over
