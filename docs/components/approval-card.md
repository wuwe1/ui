# ApprovalCard

An agent asks before it acts – a white card says what, a gray tray under it holds the decision, and once answered it folds into one line.

## When to use

- A tool call that waits for a person: run a command, change a file, open a page
- Anything hard to undo that an agent wants to do on someone's behalf
- Requests with a deadline – the tray counts it down

## When not to use

- Actions the person started themselves – a plain confirm dialog fits better
- Harmless, reversible actions – do them and offer undo
- A question with several answers – put the options in the card body and leave out `onApprove`, or build a question card

## Anatomy

- Tray label – optional, above the card: where the request comes from
- Header – a 32px tile with the tool's icon, the action as the title, one line on its object; an optional risk badge
- Preview panel – code, or a richer preview like a diff, then key facts as rows
- 「完整参数」 – the full arguments, folded
- 「始终允许」 – an optional checkbox
- Tray – time left, then 「拒绝…」 and 「允许」, with their shortcuts on desktop
- Reason field – 「拒绝…」 opens it; Enter denies with the reason
- Outcome – one line: 「已允许」, 「已拒绝」, 「已自动拒绝」 or 「已取消」, the action and its object

## States

- Pending
- Diff – a richer preview
- Expiring – the last minute ticks every second, in amber
- From elsewhere – a label on the tray
- Optional parts – risk, 「始终允许」, 「编辑」
- Busy – after a click, the card locks and the pressed button shows a Spinner until the host answers
- Answered – the four outcomes

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | – | The action – 「运行命令」; also the card's accessible name |
| `description` | `ReactNode` | – | Its object or the agent's note, one line |
| `icon` | `LucideIcon` | Shield | In the header tile |
| `label` | `ReactNode` | – | On the tray above the card |
| `risk` | `"low" \| "medium" \| "high"` | – | A badge: gray, amber, red |
| `code` | `string` | – | A command or content, monospace |
| `preview` | `ReactNode` | – | Anything richer, like a diff |
| `details` | `{ label, value }[]` | – | Key facts as rows |
| `args` | `string` | – | Full arguments behind 「完整参数」 |
| `children` | `ReactNode` | – | More inside the card – a plan, questions |
| `until` | `number` | – | Deadline in ms since the epoch: 「剩 N 分钟」, then seconds |
| `status` | `"pending" \| "approved" \| "denied" \| "expired" \| "cancelled"` | `"pending"` | Anything but pending folds the card into its outcome |
| `onApprove` | `({ always }) => unknown` | – | Leave out to hide 「允许」. A promise locks the card until it settles; a rejection unlocks it |
| `onDeny` | `({ reason }) => unknown` | – | Same locking |
| `approveLabel`, `approveIcon`, `approveDisabled` | | 「允许」, Check | The primary button |
| `denyLabel` | `string` | 「拒绝」 | Gets 「…」 when it opens the reason field |
| `reason` | `string \| false` | 「说明原因（可选）」 | The reason field's placeholder; false denies at once |
| `always` | `string` | – | Shows a checkbox with this label; `onApprove` gets it |
| `onEdit` | `() => void` | – | Shows 「编辑」 |
| `keys` | `"focus" \| "global" \| "none"` | `"focus"` | Where ⌘↵ and Esc work |
| `quick` | `boolean` | `true` | ⌘↵ approves; false for requests that need a look first |

## Keyboard interactions

| Key | Does |
|---|---|
| ⌘↵ or Ctrl+↵ | Approves – with focus in the card, or anywhere with `keys="global"` |
| Esc | Opens the reason field; again, closes it and returns focus to 「拒绝…」 |
| Enter | In the reason field, denies with the reason |
| Tab | 「完整参数」, the checkbox, 「编辑」, 「拒绝…」, 「允许」 |

With `keys="global"` the card skips keys while someone types in a field with text, or while a dialog is open; it catches them first, so a composer's ⌘↵ doesn't also send.

## Accessibility

- `role="group"`, named by the title, described by the description and the time left
- Real buttons with `aria-keyshortcuts`; the key hints are decoration
- The outcome line is `role="status"`: screen readers hear 「已允许 运行命令」 once
- The folded card is `inert`
- Phone buttons are 44px tall

## Motion

- Answered: the card folds to nothing in 200ms while the outcome fades in
- Busy: the pressed button's icon becomes a Spinner
- With prefers-reduced-motion the card disappears at once; the outcome still fades

## Responsive behavior

- Phones: the buttons split the tray's width, 44px tall; time left sits above them
- Desktop: buttons sit right with their shortcuts; time left on the left
- Code scrolls inside the panel up to 192px; richer previews up to 256px
- Dark mode built in

## Notes for AI

- The host owns the deadline and the outcome: auto-deny on the server, then pass `status="expired"`
- Return the network promise from `onApprove` and `onDeny`, so the card locks while it's in flight
- Use `keys="global"` on one card at a time – the oldest in the current view
- Keep the outcome on screen for a few seconds, then remove the card
