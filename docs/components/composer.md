# Composer

Where a message to an agent is written – a white card for what to send and how, a gray tray around it for what the conversation is doing now.

## When to use

- The input under an agent conversation: continue, send while it runs, stop it
- A dialog that starts a run – a new session, a fork – with `size="lg"`

## When not to use

- A plain text field in a form – `Textarea`
- Chat between people – no settings, no stop; a field and a button do
- Things that need the person to act – approval cards sit above the Composer, not in its tray

## Anatomy

- Tray – above the card, only while there's something to say: running and its clock, background tasks, usage near a limit. Gray, small, `tabular-nums`
- Queue – in the tray under its row, right above the card: messages waiting for the agent, a `MessageQueue`
- Card – white, a border that darkens on focus (`sm`) or a soft ring (`lg`); a click anywhere off the controls puts the caret in the text
- Top – attachments, given by the host
- Text – grows with what's written, up to 192px (`sm`) or 40% of the screen (`lg`), then scrolls
- Heard words – gray under the text while dictation is still listening
- Control row – `start` on the left (add, settings), `end` on the right (context, the microphone), then send
- Send – an arrow up by default; `busy` shows a `Spinner`; with `stop` and nothing typed it becomes a stop square, a `Spinner` once asked

`useDictation` and `DictationButton` (from `dictation.tsx`) fill the microphone: the browser's speech recognition, final words join the text, the rest is `interim`.

## States

- Empty – send is off
- Typed
- Running – the tray grows in; with nothing typed, send is stop; typing turns it back into send, which queues
- Queued – the queue stacks in the tray; ↑ in the empty field pulls the newest back
- Stopping – stop is a `Spinner` until the run ends
- Sending – send is a `Spinner`
- Hearing – gray words under the text, the microphone pressed with a ripple
- Attachments – thumbnails on top
- Dialog – `size="lg"`, taller, no tray

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `value`, `onValueChange` | `string`, `(v) => void` | – | The draft – the host owns it |
| `onSubmit` | `() => void` | – | ↵, ⌘↵ or the button, unless `send.disabled` or `send.busy` |
| `placeholder` | `string` | – | Say what sending does now: 「运行中，发送后排队…」 |
| `size` | `"sm" \| "lg"` | `"sm"` | Under a conversation, or in a dialog |
| `tray` | `ReactNode` | – | null folds the tray away; its last words stay while it folds |
| `queue` | `ReactNode` | – | A `MessageQueue` – shows the tray on its own too |
| `onRecall` | `() => void` | – | ↑ in an empty field: pull the newest waiting message back |
| `top` | `ReactNode` | – | Attachments |
| `interim` | `string` | – | Words still being heard |
| `start`, `end` | `ReactNode` | – | The control row's two ends |
| `send` | `{ label, icon?, title?, disabled?, busy? }` | – | The button; `label` is its name |
| `stop` | `{ onStop, stopping }` | – | While a run goes |
| `onPaste` | `(e) => void` | – | Images and files from the clipboard |
| `textareaRef`, `autoFocus` | | – | |

`useDictation({ lang = "zh-CN", onText, onError })` returns `{ supported, listening, interim, toggle, cancel }`; `DictationButton` takes it and renders nothing where `supported` is false.

## Keyboard interactions

| Key | Does |
|---|---|
| ↵ | Sends, with a keyboard; on a touch screen it's a new line |
| ⇧↵ | New line |
| ↑ in an empty field | With `onRecall`: pulls the newest waiting message back |
| ⌘↵ or Ctrl+↵ | Sends, anywhere |
| ↵ while an input method composes | Picks the candidate – never sends |
| Esc | While dictating: throws away the words still gray, stops listening |

## Accessibility

- Send and stop are buttons named by what they do; `aria-busy` while sending
- The text field carries `aria-keyshortcuts` for its send key; the phone keyboard's return key says 「发送」 only where ↵ sends
- Heard words are a polite live region
- The folded tray is `inert` and `aria-hidden`
- The microphone is a toggle with `aria-pressed`, named 「语音输入」 / 「停止语音输入」

## Motion

- The tray grows in 300ms as its background fades from clear to `muted`, and folds back the same way; the card never moves
- The border darkens in 150ms on focus
- Dictating: the microphone ripples
- Reduced motion: the tray shows and hides at once, the ripple stands still

## Responsive behavior

- Fills its container; the host sets the width
- Touch screens: ↵ is a new line, send is the button
- Dark mode built in

## Notes for AI

- Keep the draft, queueing, uploads and the outbox in the host; the Composer only draws and decides which key sends
- Put waiting messages in `queue` with `MessageQueue`, not in the conversation – they aren't sent yet
- Put state that changes by itself (running, background tasks) in `tray`; put choices about the next message (model, permission) in `start` with `ComposerSettings`
- Speech goes to the browser's servers (Apple's, Google's); say so if that matters to your users
