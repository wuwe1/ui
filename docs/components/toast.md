# Toast

A short line about what just happened – saved, copied, failed – from anywhere. Up to three stack, the newest in front; hover or focus fans them out.

## When to use

- A confirmation after an action: 「已删除」「已复制到剪贴板」
- An undo right after: 「已移出工作区」 with 「撤销」
- An error that doesn't block the page: 「发送失败」 with the reason
- Work someone started and wants to hear back from – `toast.promise`: 「正在新建会话…」 → 「已打开新会话」

## When not to use

- Errors in a form – show them by the field
- Anything people must read or decide – a dialog, or an approval card
- Notices that should wait until dismissed – `NotificationStack`
- Progress with details – a panel

## Anatomy

- Icon – a check for success, an alert for errors, colored; none for info and loading
- Title – a few words; loading shimmers it
- Description – the details, one or two lines, gray
- Action – one small button; it closes the toast unless its `onClick` calls `preventDefault()`
- Close – on hover and focus with a mouse; always on touch
- Hairline – runs down the bottom edge with the timer and stops while paused

## States

- Kinds – info, success, error, loading
- Stack – up to three; folded, the ones behind peek out 8px each; the fourth waits, its timer still
- Fanned out – hover, focus or tap: a list, each at its own height
- Promise – loading turns into success or error in place
- Stays – `duration: Infinity`, until closed
- Long – title and description clamp to two lines and break anywhere

## API reference

`<Toaster />` – mount once.

| Prop | Type | Default | Description |
|---|---|---|---|
| `position` | `"top-center" \| "bottom-center" \| "bottom-right"` | `"top-center"` | Top-center sits under a 3.5rem top bar; set `--toaster-top` to move it, e.g. past a bar the page shows there |
| `label` | `string` | 「通知」 | The region's name |
| `className` | `string` | – | On the region |

`toast(title, options?)`, `toast.success`, `toast.error`, `toast.loading` – return the id.

| Option | Type | Description |
|---|---|---|
| `id` | `string` | An existing id updates that toast in place and restarts its timer |
| `description` | `string` | The second line |
| `action` | `{ label, onClick }` | One button |
| `duration` | `number` | ms; 4000, or 6000 for errors and toasts with an action; loading stays; `Infinity` stays |

`toast.promise(promise, { loading, success, error }, options?)` – each message is a title, `{ title, description }`, or a function of the result. Returns the promise.

`toast.dismiss(id?)` – one, or all.

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | Moves through the toasts and their buttons; focus fans the stack out |
| Enter or Space | Presses the action or close |
| Esc | Closes the focused toast; focus moves to the next, or back where it was after the last |

## Accessibility

- The stack is a region named 「通知」; every toast is focusable
- New and updated toasts are read from a polite live region; errors from an assertive one, so they come first
- Timers pause on hover, focus and a hidden tab – nothing leaves mid-read
- Swiping is never the only way out: Esc and a named close button
- Color only on the icons; the words say what happened

## Motion

- A new toast slides 8px in from its edge and fades in, 200ms `ease-out-strong`; the ones behind move back and shrink 5% each
- Fanning out glides every toast to its place, 200ms
- A closed toast fades and slides 4px toward its edge, 150ms `ease-in-strong`; a swiped one flies out sideways; a short swipe springs back
- Reduced motion: no sliding or gliding, fades only; no hairline

## Responsive behavior

- Up to 384px wide; on phones full width with 12px gutters
- Touch: tap fans the stack out; swipe sideways past 64px to close; close is always visible
- Top-center respects the notch; bottom positions the home indicator

## Notes for AI

- Mount `<Toaster />` once; call `toast()` from handlers and effects, never during render
- Title a few words, the reason in `description`: `toast.error("发送失败", { description: e.message })`
- Use `toast.promise` instead of a loading toast and a separate success toast
- Something on the page covers the top-center slot – set `--toaster-top` on `:root` while it shows
