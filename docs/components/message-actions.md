# MessageActions

The row under a message: a few quiet icon buttons – copy, a 「更多」 menu – and facts that stay in sight. TurnStats is the fact that matters most under an agent's answer: what the turn did.

## When to use

- Under every message in an agent conversation – copy without selecting, rare actions one click away
- Under the answer that ends an agent's turn, with TurnStats – how long it worked, how many tool calls, which files it changed, which subagents it started, which model
- Under your own message, right-aligned – the time, copy, and what you can do with it

## When not to use

- While the answer is still streaming – the facts aren't final; show the run's own loader instead
- For more than three buttons – put the rest in `MessageMenu`
- For a single tool call – `ToolCall` has its own copy

## Anatomy

MessageActions
- Quiet part – `children`: `CopyAction`, `MessageAction`s, `MessageMenu`, and a time or duration that only matters on demand
- Meta – always shown, after the quiet part: `TurnStats`, a time, a badge

TurnStats, each part left out when zero or missing
- Clock – the turn's duration, `elapsed()` like ToolCall: 4.2, 3:38
- Wrench – tool calls, with 「N 次失败」 in red
- FileDiff – 「3 个文件」 and +48 −12; opens the list of files with their lines, each opening the file
- Bot – 「2 个子代理」; opens the list, each opening that subagent
- The model name

## States

- Quiet – actions hidden until the message is hovered or focused; facts shown
- Lit – `quiet={false}`: the last reply, actions always shown
- Your message – `align="end"`, a badge in meta
- Copied – a check and 「已复制」 for 1.5s; failed – 「复制失败」
- Turn – TurnStats with every fact; a few facts; failed calls
- Long – many files: the row wraps, the list scrolls

## API reference

MessageActions

| Prop | Type | Default | Description |
|---|---|---|---|
| `align` | `"start" \| "end"` | `"start"` | `"end"` under your own message |
| `quiet` | `boolean` | `true` | Children show while the nearest `[data-message]` is hovered or focused |
| `meta` | `ReactNode` | – | Always shown, after the children |
| `label` | `string` | 「消息操作」 | The toolbar's name |

`MessageAction` – `icon`, `label`, and Button props. `CopyAction` – `text`, `label` 「复制」. `MessageMenu` – `items: { icon, label, onSelect }[]`; empty renders nothing.

TurnStats

| Prop | Type | Default | Description |
|---|---|---|---|
| `ms` | `number` | – | The turn's duration |
| `tools`, `failed` | `number` | `0` | Tool calls, and how many failed |
| `files` | `TurnFile[]` | `[]` | `{ path, added, removed }` – the path as it should read |
| `onFile` | `(path) => void` | – | Makes each file in the list a button |
| `agents` | `TurnAgent[]` | `[]` | `{ id, label }` |
| `onAgent` | `(id) => void` | – | Makes each subagent a button |
| `model` | `string` | – | Shown as given |

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | Enters the row once, on the button last used |
| ← → | Move between buttons, wrapping |
| Home, End | First, last button |
| Enter or Space | Presses; opens the menu or a list |
| Esc | Closes the menu or list, focus back on its button |

## Accessibility

- The row is `role="toolbar"`, named 「消息操作」
- Icon buttons are named by `aria-label`; the tooltip repeats it for the eye, so it isn't read twice
- 「已复制」 and 「复制失败」 go through a polite live region
- Each fact carries its name for screen readers: 「这一轮用时 3:38」, 「工具调用 12 次」
- Failures say 「失败」 in words; +/− carry their sign, not only color
- On phones buttons are 32px with a 44px hit area; list rows 44px

## Motion

- The quiet part fades in 150ms, `ease-out-strong`; it never moves – the space is held, so the page never jumps
- Copy blurs into a check in 150ms and back after 1.5s
- With prefers-reduced-motion the fade stays – it carries no movement; the copy icon swaps without blur or scale

## Responsive behavior

- Touch has no hover: the quiet part stays hidden until a tap focuses the message, and the last reply stays lit
- The facts wrap onto a second line on narrow screens
- File and subagent lists open beside the fact on desktop and as a bottom sheet on phones (`Popsheet`)

## Notes for AI

- Put `data-message` and `tabIndex={-1}` on the element wrapping the message and the row – hover and tap light the quiet part through it
- TurnStats goes in `meta`, only under the answer that ends a turn, only once the turn has ended
- Paths in `files` are shown as given – pass them relative to the project
- A time in the quiet part reads 「5 分钟前」; next to TurnStats it stays in meta
