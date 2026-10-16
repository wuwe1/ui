# DecisionInbox

An agent's open questions for a person, settled one at a time – one opens with its answers, an answer folds it into 「已定」, and the answers go back together.

## When to use

- An agent needs a person's call on a list before it goes on: keep or delete, merge or wait, this or that
- Each item takes one tap, or a tap and one sentence
- Up to a few dozen items – only the one in front is open

## When not to use

- One action waiting for a yes – `ApprovalCard`
- Which item goes with which – `MatchReview`; edits to a text – `InlineDiff`
- Answers that need a form or a paragraph – link to a page
- Hundreds of rows to sort and filter – `DataGrid`
- News with nothing to answer – a toast or `NotificationStack`

## Anatomy

- Tray – `label` in small gray: what is being decided; the card inside
- Head – a `waiting` dot, 「待定」 and the count, 「撤销」 once something is answered, 「采纳其余建议」 while two or more wait and some have proposals. All answered: 「已看完」, 「撤销」, 「完成」. Settled: 「已确认」 and the count
- Open decision – on a gray ground: the title, `detail` in gray, then 「建议<answer>：」 and `reason`, 「查看全文」 when there is `more`, and the answers in a row – the proposed one filled, each with its key on desktop
- Note field – an option with `note` opens it in place of the answers: 「取消」 and the option, Enter submits. The sentence is required, unless the option is the proposal – the reason says what to do, and the field says 「留空照建议」
- Waiting decision – one line, its title in gray
- Answered – the answers give way to ✓ and the answer for 500ms; then the decision folds and the next one opens where it was
- 已定 – under the waiting, folded behind ✓ and the count; open, a line each: the title and the note, the answer on the right, › to change it. All answered, these lines are the card's body

## States

- Default – the first decision open, its proposal filled; the rest one line each
- Answered – three in 已定, the fourth open
- Note – the note field open on the first decision, for an option that isn't the proposal
- All reviewed – everything answered; 「完成」 waits
- Settled – `answers` passed back, or 「完成」 went through: read only
- No proposals – every answer outlined, no reason line, no 「采纳其余建议」
- Final answers – no `onDone`: each answer is final when made – no 「撤销」, no ›; all answered, 「已全部处理」
- Loading – `decisions` null: the card's shape in skeletons
- Empty – 「暂无待定事项」 and `emptyNote`
- Long – titles wrap when open and truncate as lines; `more` scrolls inside 256px
- Many – 30 decisions: one open, 29 lines

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `decisions` | `Decision[] \| null` | – | null is loading |
| `label` | `ReactNode` | – | On the tray – what is being decided |
| `answers` | `DecisionAnswer[]` | – | Settled: shows these, read only |
| `onDecide` | `(a: DecisionAnswer) => void` | – | Each answer as it's made |
| `onDone` | `(all: DecisionAnswer[]) => unknown` | – | 「完成」 with every answer in the list's order. Given, answers can change until then; left out, each is final when made. A promise locks the card until it settles; a rejection unlocks it |
| `emptyNote` | `string` | 「需要你定的事会显示在这里」 | The line under 「暂无待定事项」 |
| `className` | `string` | – | |

`Decision`: `id`, `title`, `detail`, `more`, `options` (`DecisionOption[]`), `proposed` – an option id, `reason` – why the proposal.

`DecisionOption`: `{ id, label, note? }` – `note` makes the option ask for a sentence first, optional when it's the proposal; a string is the field's placeholder. The label gets 「…」 on its button.

`DecisionAnswer`: `{ decision, option, note?, proposed? }` – `proposed` is what the agent suggested, so the host can tell what the person changed.

## Keyboard interactions

| Key | Does |
|---|---|
| 1 2 3 | Pick that answer of the open decision; an option with `note` opens its field |
| ↑ ↓ | Open the previous or next waiting decision, wrapping |
| Home End | Open the first or last waiting decision |
| Enter | On a line, open it; in the note field, submit |
| Esc | Close the note field, back to its option |
| U or ⌘Z | Undo the last answer, 「采纳其余建议」 or reopen |
| ⌘Enter | 「完成」, once everything is answered |

## Accessibility

- A group named by `label`; waiting lines are buttons named by their title, `aria-expanded` false
- The proposed answer says 「建议」 to screen readers; each answer carries its key as text and in `aria-keyshortcuts`
- Answers, undo and 「完成」 are announced once in a polite live region: 「删除：UX Writing 统一，待定 5」
- Focus follows the open decision once the person has used the card, never on mount; while ✓ shows, the card holds focus so keys keep working
- A folded body and a decision on its way out are `inert`
- Answers, lines and the head's buttons are 44px tall on phones; 36px in the head

## Motion

- An answer: ✓ and the answer fade in over 150ms and hold for 500ms; the decision folds in 200ms with `ease-in-strong` while the next opens in 200ms with `ease-out-strong`
- 「采纳其余建议」 answers every waiting decision that has a proposal – one with a note goes without – and folds them at once
- Opening a line: its body unfolds in 200ms; the gray ground fades in over 150ms
- Reduced motion – a leaving decision fades in 200ms and then goes; bodies open at once

## Responsive behavior

- Fills its container
- Under 768px the answers share the row at 44px tall; from 768px they size to their labels at 32px and show their keys
- Dark mode built in

## Notes for AI

- Give a proposal and one sentence of why – people decide from the reason line more than from the detail
- Keep two or three options, the same set in the same order down the list – the same spot always means the same answer
- An answer that needs words – 「修改」 – gets `note`, with a placeholder that says what to write. Proposing it, put the change in `reason`: the person can take it as is
- Put long text in `more`, never in `detail`
- Feed `onDone`'s list back to the agent with `proposed`: say which proposals the person changed, and act only on what came back
