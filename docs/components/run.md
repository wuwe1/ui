# Run

One turn of an agent's work as a line that opens level by level: the run, its steps, each step's calls, each call's thought, arguments and result.

## When to use

- An agent's turn, from the person's message to its reply – everything the agent did in between
- A turn still running: the line says which step it is on, and the current step shows what runs now

## When not to use

- One or two calls with nothing said between them – `ToolCall` alone reads lighter
- What the agent plans to do – a Run shows what it did
- A call waiting for approval – it needs a decision: `ApprovalCard`

## Anatomy

Run
- Chevron, then the status: 「正在执行第 4 步」 and a clock, 「已完成 18 步」, ⏹ 「已中断于第 5 步」, or ⚠ 「出错于第 5 步」 in red when an error ended it; then the time
- Once it ends: 「58 次调用」 with 「1 次失败」 in red, 「改动 16 个文件」, 「2 个子代理」 – the last two open their lists
- The steps under a hairline

RunStep
- Chevron, number, title – the last sentence the agent said before acting. The first ones usually report the step before: 「类型检查过了。」
- Right side: ⚠ N failures, 「N 次」 calls, the time; a clock while it runs; ⏹ 「已中断」 where the person stopped it
- Open: all the agent said, then calls, notes and the tail in the order they happened

RunNote
- you – your bubble, as in the conversation, on the right of the step where it was read; a ✓ after the words says it was read. No tag under it: where it sits tells when
- event – an icon, a name such as 「子代理回报」, the first line; opens to the full content

RunTail
- The open step's last line while no call runs: 🧠 「正在思考…」 with a clock; ⏹ 「中断时正在思考」 once stopped

`ToolCall` carries the rest: its 「思考」 – the thought before the call – and the `stopped` status, 「已中断」 in gray.

## States

Running, Thinking, Your message read, Done – folded, Done – open, Some failed, Stopped while thinking, Stopped during a call, Failed, Subagent report, Long, Many, Live

## API reference

Run

| Prop | Type | Default | Description |
|---|---|---|---|
| `state` | `"running" \| "done" \| "stopped" \| "failed"` | – | failed – an error ended it, not the person |
| `steps` | `number` | – | Steps so far |
| `since` | `number` | – | Running: the start, ms since the epoch – the clock |
| `ms` | `number` | – | Done or stopped: how long it ran |
| `tools`, `failed` | `number` | 0 | Calls made and failed, shown once it ends |
| `files`, `onFile` | `TurnFile[]`, `(path) => void` | – | 「改动 N 个文件」 and its list |
| `agents`, `onAgent` | `TurnAgent[]`, `(id) => void` | – | 「N 个子代理」 and its list |
| `open`, `defaultOpen`, `onOpenChange` | | | Controlled or not; otherwise by the folding rule below |
| `children` | `ReactNode` | – | RunStep, oldest first |

RunStep

| Prop | Type | Default | Description |
|---|---|---|---|
| `n` | `number` | – | From 1 |
| `say` | `string` | – | What the agent said before acting; pass it as it streams |
| `title` | `string` | last sentence of `say` | Nothing said – falls back to the first call |
| `renderSay` | `(say) => ReactNode` | the text | Markdown, say |
| `state` | `"running" \| "done" \| "stopped"` | – | |
| `calls` | `ToolCallItem[]` | `[]` | Counted on the line; listed when open unless `children` |
| `since`, `ms` | `number` | – | Running: the clock; done: the time |
| `open`, `defaultOpen`, `onOpenChange` | | | |
| `children` | `ReactNode` | every call | The open step under what was said: calls, notes, a tail |

RunNote: `kind` (`"you"` or `"event"`), `text`, `icon` and `label` for an event, `from` – the box its message waited in, or `true` – and `children`, an event's content.

RunTail: `state` (`"thinking"` or `"stopped"`), `since`, `children` for other words.

Folding, when not controlled: running, stopped and failed are open. A run or step that finished in front of the person stays open until it has scrolled out of sight above, then folds. One that was finished when it mounted starts folded.

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | Moves through the run's line, its lists, each step's line, notes and calls |
| Enter or Space | Opens or closes the run, a step, a call or a report; opens a list |

## Accessibility

- The run's line and each step's line are buttons with `aria-expanded`; a folded body leaves the DOM
- The run's status is a polite live region – 「正在执行第 4 步」, 「已完成 18 步」, 「已中断于第 5 步」
- The running step is `aria-current="step"`
- A message read mid-run says so: 「已读取运行中发送的消息」; the ✓ reads 「已读取」
- Clocks are `aria-hidden`; failure and interruption are words, never color alone

## Motion

- New steps, calls and notes `appear`: a 200ms fade where they will stay – nothing slides
- The status, counts and clocks change in place
- Opening and closing by hand slides 200ms; the chevron turns 90°
- Finished in front of you: `tuck` – it folds at once when it has scrolled out of sight above, and its height comes off the scroll position, so nothing on screen moves
- Your message read: `slot-in` – it moves from its card above the input into the step in 620ms, tinted; the tint fades in 1.4s and the ✓ shows in the place it kept
- Running: the status, the current step's title and the running call shimmer
- Reduced motion: slot-in fades in; the shimmer stands still

## Responsive behavior

- A step is one line down to 320px: the title truncates; number and right side never wrap
- The run's facts wrap under its status on a narrow screen
- Lists open beside their fact on desktop, from the bottom on phones
- Lines are 44px tall on touch

## Notes for AI

- A step begins each time the agent says something. Calls before it said anything form a step titled by its first call
- Put each thought on the ToolCall that follows it (`thought`); a thought with no call after it is a row of its own in the step
- Mount one Run per turn and keep it mounted while it runs – what finished in front of the person is told apart from history by the state it mounted in
- `from`: read the card's `getBoundingClientRect()` just before it leaves. A container that follows new output should scroll during React's commit, so the landing spot is measured after it
