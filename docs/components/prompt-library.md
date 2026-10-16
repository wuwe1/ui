# PromptLibrary

Saved prompts with blanks – pick one, type into the sentence where it asks, and use it once every blank is filled.

## When to use

- Prompts sent again and again with a few words changed: handing a repo to an agent, a review request, a bug report
- Beside a composer, as the place to pick a saved prompt and fill it in before it goes into the input
- A shared set of prompts where the wording stays and only the blanks change

## When not to use

- Free writing – nothing repeats, and a plain composer is faster
- Templates with many blanks – past about six, a form with labels reads better than a sentence
- Running a command or a skill – a command menu, or `/name` in the composer
- A few canned replies – buttons

## Anatomy

- Tray – gray, around the card; its bottom row holds the status and the actions
- List – the title and the count, 新建 (+), a search field; templates by group under small gray group names; the chosen one on a gray pill
- Template – its title and group, 编辑 (pencil); the body as running text, each blank a field inside the sentence. Empty – a dashed outline with the blank's name; filled – a gray chip, the value in medium weight
- Tray row – left: the focused blank's name and description, else 「待填 2 项」 or 「已填完」, or 「已删除「…」」 with 「撤销」; right: 「复制」 and 「使用」
- Editor – in place of the template: 名称, 分组 with the groups in use as suggestions, 内容 with 「用 {名字} 留出每次要填的地方」 under it, a row per blank for 默认值 and 说明; 「删除」, 「取消」, 「保存」

## States

- Default – the first template open; its blanks empty or at their defaults
- Filling – a blank has focus: it rings, and the tray says what it asks for
- Ready – every blank filled: 「使用」 turns on, the tray says 「已填完」
- Search – the list filters as you type; nothing left – 「无匹配的提示词」
- Editing – the editor in place of the template; New is the same editor, empty
- Saving – 「保存」 spins until `onSave` settles; a rejection keeps the editor open
- Deleted – 「已删除「…」」 and 「撤销」 on the tray for 5 seconds
- Read only – no `onSave`: no 新建, no 编辑
- Empty – 「暂无提示词」, what will show up, 「新建」
- Loading – `templates` null: skeleton rows and lines
- Long – titles truncate; a long body scrolls in its pane; a long list scrolls under the search field
- Narrow – under 540px: the list alone, then the template alone with ‹

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `templates` | `PromptTemplate[] \| null` | – | `{ id, title, group?, body, variables? }`; blanks in `body` are `{name}`; `variables` maps a name to `{ description?, default? }`. null – loading |
| `value` | `string \| null` | – | The chosen template, controlled |
| `defaultValue` | `string` | the first | The chosen template at first, uncontrolled |
| `onSelect` | `(id: string) => void` | – | Another template chosen |
| `onUse` | `(prompt: string, template: PromptTemplate, values: Record<string, string>) => void` | – | 「使用」 with every blank filled – the finished text |
| `onCopy` | `(prompt: string) => void` | – | After 「复制」 put the text on the clipboard |
| `onSave` | `(template: PromptTemplate) => unknown` | – | Shows 新建 and 编辑. New and edited alike, tidied – trimmed, variables only for blanks in the body. A promise keeps the editor until it settles |
| `onDelete` | `(id: string) => unknown` | – | Shows 「删除」 in the editor; 「撤销」 calls `onSave` with the template |
| `title` | `string` | 「提示词」 | Heads the list and names the region |
| `useLabel` | `string` | 「使用」 | The use button |
| `emptyNote` | `string` | 「把常发的话存成提示词，用 {名字} 留出每次要填的地方」 | Under 「暂无提示词」 |
| `className` | `string` | – | Classes on the root |

The logic is in `lib/prompt-library.ts`: `parts`, `blanks`, `fill`, `nextEmpty`, `sections`, `tidy`.

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | 新建, the search field, the chosen template, 编辑, its blanks in order, 「复制」, 「使用」 |
| ↓ in the search field | Into the list, on the chosen template |
| ↑ ↓ Home End | Through the list – the template opens as you go; ↑ from the first goes back to the search field |
| Enter in the list | Into the first empty blank; narrow, it opens the template |
| Enter in a blank | The next empty blank; with all filled, 「使用」 |
| Esc | In the search field, clears it; in the editor, cancels; a narrow template goes back to the list |
| ⌘Enter in the editor | 「保存」 |

## Accessibility

- A `group` named by the title; the list is a `listbox` of `option`s with `aria-selected`, and only the chosen option is in the tab order
- Group names label `group`s inside the listbox
- Every blank is a real text field, named by its name and description
- 「使用」 stays focusable while blanks are empty (`aria-disabled`); pressed, it moves focus to the first empty one
- A polite live region says 「已填完」, 「已复制」 and 「已删除「…」」
- Elements that handle Esc themselves carry `data-escape="local"`, so a `Popsheet` around the library stays open

## Motion

- The pill glides to the chosen row in 200ms, `ease-out-strong`; the template fades in over 150ms
- 「使用」 fades from half to full in 150ms when the last blank fills
- 「复制」 turns into a check for 1.5s
- Reduced motion – nothing glides or fades

## Responsive behavior

- Fills its container. From 540px the list (208px) and the template sit side by side, 320px tall; narrower, one at a time
- Blanks grow with what is typed and never pass the line; a longer value scrolls inside its field
- Under 400px 「复制」 keeps only its icon
- Touch screens – 40px rows, blanks and tray buttons
- Dark mode built in

## Notes for AI

- Blanks are `{name}`: letters of any script, digits, `-` and `_`. No spaces, so code braces stay text. A name used twice is one blank
- Give each blank a description – the tray shows it while the blank has focus. Give a default when one value is usual
- Values stay per template while the library is mounted; switching back keeps them
- `onUse` hands over the finished text; the host decides what happens – into the composer, or sent
- Inside a `Popsheet` or a dialog, Esc closes it unless the search field or the editor wants it (`data-escape="local"`)
