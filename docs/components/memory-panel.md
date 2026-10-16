# MemoryPanel

What an agent remembers across sessions, grouped and editable – a master switch, group chips and a search, and on every memory edit in place, pause or forget with Undo on the tray.

## When to use

- An agent that keeps memories between sessions – the place to see, correct and remove what it kept
- A side panel next to the conversation, so a wrong memory can be fixed the moment it shows up in an answer
- A clear off switch for one project's memory without losing what was saved

## When not to use

- What the model holds right now in one conversation – `ContextWindow`
- Hundreds of entries with sorting and bulk actions – a data table
- Settings that aren't about what the agent learned

## Anatomy

- Head – the title and the count; 「使用 memory」, a switch. Off – a note unfolds under the head and the list dims
- Chips – 「全部」 and each group with its count, a radiogroup; the search button swaps them for a search field
- Groups – fixed, from the host, in its order. Under 「全部」 each group is a section with its label; filtered, the rows only
- Row – the text; under it the source (a link with `onSource`), the date, 「已暂停」; actions – edit, pause or resume, forget – on hover and focus, always on touch. A row with a detail opens to it, drawn by `renderDetail`
- Editor – in place of the row: the text, the detail if the memory has one, the group chips, 「取消」「保存」
- 新建 memory – a row at the end that unfolds into the editor, in the filtered group
- Tray – 「12 条 memory，2 条已暂停」; while editing the keys; after forgetting 「已忘掉「…」」 with 「撤销」

## States

- Default – grouped, nothing open
- Paused – gray text and the 「已暂停」 tag; the pause icon turns to play
- Off – the note, the list dimmed and still editable
- Empty – 「暂无 memory」 and what will show up here
- Loading – three skeleton rows
- Long – text wraps and breaks anywhere; the chips scroll sideways with a fade on each end that hides more

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `memories` | `MemoryItem[]` | – | `{ id, text, detail?, group, source?, date?, paused? }` – source and date shown as given |
| `groups` | `MemoryGroup[]` | – | `{ id, label, hint? }`, in order; hint is the section's title tooltip |
| `enabled`, `onEnabledChange` | `boolean`, `(on) => void` | `true` | The switch; without `onEnabledChange` there's none |
| `offNote` | `string` | 「关闭后不会使用或保存 memory，已有的不会删除」 | Under the head while off |
| `onAdd` | `({ text, detail, group }) => void` | – | Shows 「新建 memory」 |
| `onEdit` | `(id, { text?, detail?, group? }) => void` | – | Only what changed |
| `onPause` | `(id, paused) => void` | – | Pause or resume |
| `onForget`, `onRestore` | `(id) => void` | – | Forget; Undo on the tray calls `onRestore` |
| `renderDetail` | `(m) => ReactNode` | plain text | Draws an open row's detail |
| `onSource` | `(m) => void` | – | Makes the source a link |
| `title` | `string` | 「Memory」 | Head and region name |
| `loading` | `boolean` | – | Skeleton rows |
| `undoFor` | `number` | `5000` | How long Undo stays, ms |

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | Switch, the chosen chip, search, then each row's text and actions, 新建 memory, the tray's 撤销 |
| ← → | Between chips, in the head and in the editor |
| Enter | In the editor's text: saves |
| Shift + Enter | A line break |
| Esc | Cancels the editor; closes and clears the search |

## Accessibility

- The panel is a group named by its title; 「使用 memory」 is a `role="switch"` with `aria-checked`
- Chips are a radiogroup with one tab stop; each group is a section named by its label
- Every action is named after its memory: 「忘掉「颜色克制…」」; the tooltip shows only the verb
- A row that opens has `aria-expanded`; a row folding away is `inert`
- The tray is a polite live region: counts, the forgotten memory with Undo, the editing keys

## Motion

- Forgetting folds the row closed with a soft blur, 200ms `ease-out-strong`, before the host drops it
- The switch's knob slides 150ms; an opening row's chevron turns 90°
- Reduced motion: everything switches at once

## Responsive behavior

- Fills its container; works from 300px
- Below 340px the chips drop their counts; below 320px the switch keeps only its track
- Touch: actions always visible, buttons and chips get taller hit areas
- Chips that don't fit scroll sideways: swipe, drag with a mouse, or turn the wheel; a drag doesn't pick the chip it ends on, and a picked chip scrolls fully into view

## Notes for AI

- Groups are fixed on purpose: an agent files its own memories, so group by the field it writes. Hand-kept categories drift
- Keep the forgotten item until `undoFor` passes if your backend can't bring it back
- Paused memories stay in the list and in the count; keep them away from the model yourself
