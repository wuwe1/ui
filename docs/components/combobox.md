# Combobox

Pick one or several values from a list too long to scan – type to narrow it, and what's picked sits in the field as chips.

## When to use

- Picking from dozens or hundreds: files, memories, sessions, people, labels
- Several values at once – reviewers, the files a task should read
- Values that may not exist yet – tags, with `creatable`

## When not to use

- Up to six fixed choices that apply right away – `SegmentedControl`
- Running an action or going somewhere – a command menu: mixer's `new-session.tsx`, `browse.tsx` and `skills.tsx` are `Command` lists
- Free text with no list behind it – `Input`
- One value of a few, in a form – `Select`

## Anatomy

- Label – optional, above the field; it also names the list
- Field – an `Input`'s border and fill, 32px high, growing a line at a time as chips wrap
- Chip – a picked value: an avatar or icon, the label, × – 24px, on `muted`
- 「+N」 – the chips past `maxChips`, rolled into one
- Input – after the chips, at least 64px wide; the placeholder only while nothing is picked
- Toggle – a chevron on the right; it turns over while the list is open
- List – as wide as the field, 6px below it, on `popover`: group headings, rows, a create row
- Row – an avatar or icon, the label, a gray hint, ✓ when picked – 32px
- Highlight – an `accent` pill under the active row
- Footer – multiple only, once options are there: 「已选 3 项」, and on desktop the keys: 「↑↓ 移动」「↵ 选择」

## States

- Default – two picked, closed
- Open – the list under the field, the first row active
- Searching – typed text narrows the list; matches in semibold, matches in a hint turn `foreground`
- No matches – 「无匹配结果」
- Create – `creatable`: 「添加 “…”」 at the end while no label matches exactly
- Many – chips wrap onto lines; past `maxChips` they roll into 「+N」
- Armed – one Backspace in the empty input darkens the last chip; a second removes it
- Single – `multiple={false}`: one chip, the list closes on a pick
- Empty – nothing picked: the placeholder. No options at all: `emptyText`
- Icons – rows and chips with icons instead of avatars: files
- Loading – `options` null: three skeleton rows
- Error – `error` in the list, in `destructive-strong`
- Disabled – the whole field, or single options: dimmed and skipped
- Long – long labels end with …, the hint goes first
- Inline – the list opens in the page's flow and pushes what's below
- Live – the host changes `value`: chips pop in and fold away

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `options` | `ComboboxOption[] \| null` | – | The list; null is loading |
| `multiple` | `boolean` | `true` | Many as chips, or one – one closes the list on a pick |
| `value` | `string[]` | – | Controlled values; single takes at most one |
| `defaultValue` | `string[]` | `[]` | Uncontrolled start |
| `onChange` | `(value: string[], options: ComboboxOption[]) => void` | – | Every pick, removal and creation |
| `label` | `string` | – | Above the field; names the list. Without it give `aria-label` |
| `placeholder` | `string` | 「搜索…」 | While nothing is picked |
| `creatable` | `boolean` | – | Offer 「添加 “…”」 when no label matches the text exactly |
| `onCreate` | `(text: string) => ComboboxOption \| void` | – | Builds the new option; left out or void – `{ value: text, label: text }` |
| `createLabel` | `(text: string) => string` | 「添加 “…”」 | The create row, e.g. 「邀请 “…”」 |
| `maxChips` | `number` | – | Chips shown at most; the rest roll into 「+N」 |
| `emptyText` | `string` | 「暂无选项」 | When there are no options at all |
| `error` | `string` | – | Shown in place of the list: 「加载文件失败：没有权限」 |
| `disabled` | `boolean` | – | The whole field |
| `defaultOpen` | `boolean` | – | Open on mount, without taking focus |
| `inline` | `boolean` | – | The list opens in the flow under the field instead of floating – for a mixer block, whose frame would cut a floating list |
| `id` | `string` | – | The input's id; the list is `${id}-list` |
| `className` | `string` | – | On the root |

`ComboboxOption`: `{ value, label, hint?, icon?, avatar?, group?, keywords?, disabled? }` – `avatar` is an image URL, or `true` for initials; options with the same `group` are listed under one heading, in the order groups first appear; `keywords` are searched too – pinyin, aliases.

Search, groups, keys, chips and the announcements are pure functions in `lib/combobox.ts`.

## Keyboard interactions

| Key | Does |
|---|---|
| ↑ or ↓ | Opens the list; then moves the active row, wrapping, skipping disabled rows |
| Home or End | With the list open, the first or last row |
| Enter | Picks or unpicks the active row, or creates; opens the list when it's closed |
| Backspace | In the empty input, darkens the last chip; again removes it |
| Esc | Closes the list; when it's closed, clears the text |
| Tab | Closes the list and moves on |

While an input method composes – pinyin not yet committed – none of these act.

## Accessibility

- The ARIA combobox pattern: the input has `role="combobox"`, `aria-expanded`, `aria-controls` and `aria-activedescendant`; the list is a `listbox`, `aria-multiselectable` when multiple, with groups named by their headings
- Rows carry `aria-selected` for picked, `aria-disabled` for disabled
- Picks, removals and the armed chip are announced in a polite live region: 「已选 Jonas Weber，共 3 项」「再按一次退格键移除 Tom Becker」
- Focus stays in the input while rows, chips' × and the toggle are clicked; those stay out of the tab order – the keys reach everything
- × is named 「移除 Maya Chen」; 「+N」 reads 「还有 N 项」
- The field shows a focus ring while the input has focus
- Touch: rows 44px, × grows to a 44px hit area

## Motion

- The list opens in 200ms, `ease-out-strong`: from 4px up, scale 0.98, transparent. It closes in 150ms, `ease-in-strong`, fading
- Inline, the list unfolds to its height in 200ms and folds in 150ms
- The toggle turns over in 200ms
- The highlight glides to the active row in 200ms
- The list and the field glide to their new height in 200ms – the list while filtering, the field when chips wrap
- A chip grows in: its width opens in 200ms while it pops from 0.8 past 1.04 to 1
- A chip leaving darkens for 150ms, so you see which one goes, then fades and folds in 150ms, `ease-in-strong`
- ✓ scales in from 0.5 in 150ms, and out the same
- The count and 「+N」 roll: up when they grow, down when they shrink, 200ms
- A new create row or 「无匹配结果」 rises 2px as it fades in
- Reduced motion – movement becomes a fade: the highlight fades in at its row, chips fade in and out, heights change at once, the list fades in place

## Responsive behavior

- The list is as wide as the field, so it fits any screen down to 320px
- Phones open the list under the field too, not in a bottom sheet – the keyboard covers the lower half while you type, and the list stays next to the text
- Touch: the field is 44px, chips 32px, rows 44px, and the input text is 16px so iOS doesn't zoom; the keys in the footer hide
- `inline` keeps the list in the flow: a mixer block's frame is as tall as its content, and a floating list past it would be cut
- Dark mode built in

## Notes for AI

- Values are `string[]` in both modes; read the first for single
- A pick clears the typed text and keeps the list open in multiple mode
- In a mixer block use `inline`, and pass the picks back with `pick` from a button – the combobox itself never sends
- Give hints that tell look-alike options apart: a path for a file, a role for a person
- Chinese labels: add pinyin to `keywords` when people will type it
- Up to a few hundred options; past that, search on the server and pass what comes back
