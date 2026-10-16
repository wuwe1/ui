# MessageQueue

Messages sent while an agent works, waiting for it to read them – stacked into one line above the composer's text, newest in front.

## When to use

- In a `Composer`'s `queue` slot while the agent runs: what you sent and it hasn't read yet
- The agent reads them on its own – at its next step, or when the turn ends

## When not to use

- Messages already sent – they belong in the conversation
- Things waiting for the person – approval cards above the composer
- A to-do list, or anything that needs reordering – this is a short-lived queue, not a list to manage

## Anatomy

- Front card – the newest message in one line, cut with `…`; a picture's thumbnail; `+N` for how many wait behind; withdraw
- Edges – up to two cards behind peek out 4px above, 6px narrower per side each; more wait unseen
- Open – a tap turns the stack into a list, oldest at the top, newest next to the text it came from; each message up to four lines, its pictures, its own withdraw

## States

- One – a card, no edges, no count
- Several – edges above, `+N` before withdraw
- Open – the list
- Long – one line in the stack, four lines open
- Pictures – a thumbnail in the stack; all of them open; a message of only pictures reads 「2 张图片」
- Withdrawing – its button waits until the host answers
- Leaving – taken by the agent it lifts and fades; withdrawn it sinks toward the input and fades
- Empty – renders nothing

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `QueuedMessage[]` | – | Oldest first. `{ id, text, images? }`, images are thumbnail URLs |
| `onWithdraw` | `(m) => void` | – | The host takes it out of `items` and puts it back in the input |
| `withdrawing` | `string[]` | `[]` | Ids being pulled back: their button waits, and they sink when they go |
| `defaultOpen` | `boolean` | `false` | Start as a list |
| `label` | `string` | 「排队的消息」 | The region's name |
| `className` | `string` | – | On the region |

`Composer` takes it as `queue` and shows it in the tray under its row; `onRecall` on the composer is ↑ in an empty field.

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | The front card, then its withdraw; open, each message and its withdraw |
| Enter or Space | On a message: open or close. On withdraw: withdraw |
| Esc | Closes the list, focus back on the front card |
| ↑ | In the composer's empty field: withdraw the newest |

## Accessibility

- A region named 「排队的消息」; only the front card is focusable and read, the edges are `inert`
- The front card says how many wait: 「，共 3 条」
- Withdraw is named by its message: 「撤回「用 Postgres 16 的语法…」」
- A polite status line announces each change once: 「已排队：…」, 「已撤回」, 「已发送」
- Opening and closing keep focus on the newest message
- Touch: withdraw grows to 32px with a 44px hit area

## Motion

- A new message rises 8px into the front and fades in, 200ms `ease-out-strong`; the one it covers steps back to an edge
- Taken: lifts 10px and fades, 200ms `ease-in-strong`; withdrawn: sinks 10px and fades
- Cards behind move forward as the front leaves, 200ms; the height follows the content, so opening and closing never jump
- Reduced motion: nothing moves – cards fade in and out, the height changes at once

## Responsive behavior

- Fills the composer's width; the front card is one line however wide
- Long words and URLs wrap anywhere when open
- Dark mode built in

## Notes for AI

- The component never sends or withdraws: it shows `items` and reports `onWithdraw`. Drop the message from `items` once the server confirms
- Keep the withdrawn id in `withdrawing` until then, so the card waits and sinks rather than lifts
- If the agent read it first, just drop it – it lifts, and the message shows up in the conversation
