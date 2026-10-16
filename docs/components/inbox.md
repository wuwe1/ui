# Inbox

An agent's runs that want a look, in one place – three sections down the page, and each row opens in place to its last few steps.

## When to use

- Several runs at once, and people come back to see what waits for them, what failed, what's running and what finished
- A home screen that answers every approval in one place instead of switching to each run

## When not to use

- One approval inside a conversation – `ApprovalCard` on its own
- The steps of one run in full – `ToolCallGroup` in the conversation
- Every run there is, read or not – a sidebar or a table; Inbox holds only what wants a look

## Anatomy

- Sections – 「待处理」 (waiting, error), 「运行中」 (running, background), 「已完成」 (done), each with its count; empty ones are left out
- Row – a `StatusIcon`, the title, a gray second line 「place › detail」, the status in words or a ticking clock on the right, a chevron
- Open row – the last few steps as a small timeline (the latest in full color, a failed one in red, each with its time), what the host hangs there (approval cards), then 「打开会话 ›」

## States

- Default – waiting rows open with their approval card; the rest closed
- Open – every row open
- Steps loading – a row opened before its steps arrived: two skeleton lines
- Live – a status changes: the row glides to its section, and a run that starts waiting opens itself
- Many – the page scrolls; no paging
- Long – title and second line truncate; the status keeps its place on the right
- Loading – three skeleton rows
- Empty – 「Inbox 为空」, what will show up here, and a button the host gives

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `InboxItem[] \| null` | – | null is loading |
| `onOpen` | `(item) => void` | – | Shows 「打开会话 ›」 in an open row |
| `openLabel` | `string` | 「打开会话」 | |
| `onToggle` | `(item, open) => void` | – | A row opened or closed – load its steps |
| `defaultOpen` | `string[]` | – | Rows open at first, besides the waiting ones |
| `empty` | `ReactNode` | – | Shown with no rows; `InboxEmpty` is the usual one |

`InboxItem`: `id`, `status` (`waiting`, `error`, `running`, `background`, `done`), `title`, `place`, `detail`, `label` (the status in words), `aside` (a clock instead of the label), `at` (ms, for sorting), `steps` (`{ label, time?, error? }[]`, oldest first; null while loading), `children` (more in the open row).

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | Through the rows; in an open row, its cards and 「打开会话」 |
| Enter or Space | Opens or closes a row |
| Esc | In an open row, closes it and puts focus back on the row |

## Accessibility

- Each section is a `section` named by its heading; rows are list items
- A row is a button with `aria-expanded`; it reads title, then status
- The clock is `aria-hidden`; the status is always in words, never color alone
- A status change is announced once, politely: 「affectUI 分批移植：已完成」
- Rows are 44px tall on phones, and so is 「打开会话」

## Motion

- A row that changes section glides there in 300ms; a new row fades in 150ms
- An open row's content fades and slides down 4px in 200ms; the chevron turns
- With reduced motion rows jump to their place, content only fades, ripples on the dots stand still

## Responsive behavior

- Fills its container; the host sets the width
- Phones: taller rows and buttons
- Dark mode built in

## Notes for AI

- Sorting is the component's: 待处理 oldest first (the oldest waits longest), the rest newest first – pass `at`
- Load steps when a row opens (`onToggle`), and keep the latest step current while a run runs
- Hang the run's approval cards as `children`; they show only while the row is open, and waiting rows open themselves
