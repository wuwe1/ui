# ToolCall

An agent's tool calls, one line each – icon, name, summary, then a clock, the duration or 「失败」 – that open to their arguments and result. ToolCallGroup folds a run of them under one header.

## When to use

- Every tool call in an agent's turn, in the flow of the conversation
- A run of calls between two messages – a group keeps the reply readable

## When not to use

- A call waiting for approval – it needs a decision; use the approval card
- What the agent plans to do – these are calls it made
- One long job with its own output – a task view fits better

## Anatomy

ToolCall
- Icon – the tool's own; red when the call failed
- Name – 「Bash」, 「Read」
- Summary – the command, path or query, monospace, cut with `…`
- Right side – a clock while running, the duration from 1s up, 「失败」 in red
- Open – the error in a red box with copy and an optional 「重试」, then 「参数」 and 「结果」, each with copy, and 「显示完整结果」 for a cut result. A long error scrolls inside the box; several lines read as code

ToolCallGroup
- Chevron, then the stacked icons of the last three tools
- Title – the count while running or open; the last call once folded and finished
- Right side – failures (⚠ N, or 「失败」 for a lone call), the count, the total time
- Under the folded header – the calls still running

## States

- ToolCall: Running, Done, Open, Failed, Loading, Long
- ToolCallGroup: Running, Done, folded, Done, open, Some failed, One failed call

## API reference

ToolCall

| Prop | Type | Default | Description |
|---|---|---|---|
| `call` | `ToolCallItem` | – | `{ id, name, summary, status, since?, ms?, icon? }` – status is "running", "done" or "failed" |
| `args` | `string \| null` | – | Shown open; null while loading |
| `result` | `string \| null` | – | Shown open; null while loading |
| `error` | `string` | – | The message in the red box |
| `renderCode` | `(text, part) => ReactNode` | plain | Draws args and result – a highlighter, say |
| `onRetry` | `() => void` | – | Shows 「重试」 in the red box |
| `onMore` | `() => void` | – | Shows 「显示完整结果」 |
| `open`, `defaultOpen`, `onOpenChange` | | | Controlled or not |
| `actions` | `ReactNode` | – | Buttons at the end of the line |
| `children` | `ReactNode` | – | Under the line, open or folded |

ToolCallGroup

| Prop | Type | Default | Description |
|---|---|---|---|
| `calls` | `ToolCallItem[]` | – | Every call, oldest first |
| `running` | `boolean` | a call is running | The turn goes on between calls – the model thinks before the next one |
| `ms` | `number` | – | Total time once all finished |
| `exposed` | `ReactNode` | the running calls | Under the folded header |
| `actions` | `ReactNode` | – | Buttons at the end of the header |
| `open`, `defaultOpen`, `onOpenChange` | | | Controlled or not |
| `children` | `ReactNode` | every call | The open body |
| `id` | `string` | – | For links into the conversation |

Also exported: `ToolCallLine`, the line alone for custom rows, and `ToolStack`.

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | Moves through group headers, lines and their buttons |
| Enter or Space | Opens or closes a group or a line; presses copy and 「重试」 |

## Accessibility

- Group headers and lines are buttons with `aria-expanded`; a folded body leaves the tab order
- Each group has a polite live region: 「正在运行 Bash」 while a call runs, 「正在思考」 between calls, 「已完成 5 次工具调用，2 次失败」 once done
- The stacked icons are `role="img"`, named 「用到的工具：Read、Grep」
- Failure is never color alone – 「失败」 or ⚠ N in words
- Clocks are `aria-hidden`

## Motion

- A running call's summary sweeps (Shimmer); its clock ticks every 0.1s, then every second
- Bodies slide open and shut in 200ms; with prefers-reduced-motion they appear at once
- The chevron turns 90°
- Copy turns into a check for 1.5s

## Responsive behavior

- One line down to 320px: only the summary truncates – icon, name and right side never wrap
- Arguments and results scroll inside a box up to 288px tall
- Dark mode built in

## Notes for AI

- Pass every call, oldest first, on each update – the group derives its header
- Durations under 1 second don't show – don't round them up
- Load arguments and results when a line opens: null first, then the text
- Rows that need their own buttons, like a running sub-agent, go in `exposed`
