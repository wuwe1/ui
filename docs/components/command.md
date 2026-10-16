# Command

Search a list and act on one item – open it, go into it, insert it. A pill glides to the selected row; what's typed shows up in semibold.

## When to use

- A list too long to scan where the pick does something right away: open a session, go into a folder, insert a skill
- In a dialog with a title that says what the list is

## When not to use

- Picking values that stay in a field – `Combobox`
- A few actions on one thing – a `DropdownMenu`
- Up to six options that apply at once – `SegmentedControl`

## Anatomy

- Search – a line on top: a magnifier, the text, a rule under it; 40px, 44px on touch
- List – groups with a heading in small gray; scrolls past its max height, 288px unless the host sets one
- Row – an icon, the text, maybe a hint or a shortcut on the right; 32px, 44px on touch
- Pill – `accent`, under the selected row
- Empty – one gray line in the middle: 「无匹配的…」

## States

- Default – groups, the first row selected
- Searching – rows narrow to the text, starts first; matches in semibold, matches in a gray hint turn `foreground`
- Empty – 「无匹配的文件夹」
- Shortcuts – keys on the right of a row
- Two lines – a name and a description under it
- Disabled – a row dimmed and skipped
- Long – long text ends with …
- Many – 200 rows scroll; the pill and the keys keep up
- Dialog – `CommandDialog`: Esc clears the text, then closes; focus goes back to the button that opened it

## API reference

The parts wrap cmdk's; their props pass through.

| Part | Props | Notes |
|---|---|---|
| `Command` | `filter`, `loop`, `value`, `onValueChange`, `shouldFilter` | `filter` defaults to a substring of the value or a keyword, starts first – `score` in `lib/search.ts`; `loop` wraps ↑ ↓ |
| `CommandInput` | `value`, `onValueChange`, `placeholder` | Controlled or not; Esc with text clears it |
| `CommandList` | `className` | Set the max height here, e.g. `max-h-[min(28rem,60svh)]` |
| `CommandGroup` | `heading` | |
| `CommandItem` | `value`, `keywords`, `onSelect`, `disabled` | `value` is what's searched; give it the words people type |
| `CommandHighlight` | `text`, `className` | A row's label or hint with the typed text in semibold |
| `CommandEmpty` | children | Shown when nothing matches |
| `CommandShortcut` | children | Keys on the right of a row |
| `CommandSeparator` | | |
| `CommandDialog` | `title`, `description`, `open`, `onOpenChange` | Title and description for screen readers; the list fills the dialog |

## Keyboard interactions

| Key | Does |
|---|---|
| ↑ or ↓ | The previous or next row; with `loop` it wraps |
| ⌘↑ or ⌘↓, Home or End | The first or last row |
| ⌥↑ or ⌥↓ | The first row of the previous or next group |
| Ctrl+P or Ctrl+N, Ctrl+K or Ctrl+J | Up or down, as in a terminal |
| Enter | `onSelect` of the selected row |
| Esc | Clears the text; with no text, closes the dialog |

While an input method composes – pinyin not yet committed – none of these act.

## Accessibility

- cmdk's pattern: the input is a `combobox` with `aria-activedescendant`, the list a `listbox`, rows are `option`s, the selected one `aria-selected`; groups are named by their headings
- The magnifier is `aria-hidden`; the input is named by `placeholder` or `aria-label`
- A dialog gives focus back to what opened it when the focus would be lost – a sidebar button that set `open`, not only a `DialogTrigger`
- Touch: rows and the search line are 44px; the input is 16px, so iOS doesn't zoom

## Motion

- The pill glides to the selected row in 200ms, `ease-out-strong` – on keys, hover and filtering
- The list glides to its new height in 200ms while filtering
- Reduced motion – the pill fades in at its row in 150ms; heights change at once

## Responsive behavior

- As wide as its container; the host sets the max height – a share of the screen on phones, `60svh`
- Touch: 44px rows and search line, 16px input text
- Dark mode built in: the pill is `accent`, a translucent layer on any surface

## Notes for AI

- Put every word people may type into `value` – a session's title, its first prompt, its folder – and show only some of them; `CommandHighlight` marks what's visible
- Close the dialog in `onSelect` when the pick goes somewhere; keep it open when it goes into something, like a folder
- An action that shouldn't run on Enter – creating a folder from typed text – is a button outside the list
