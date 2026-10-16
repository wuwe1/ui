# DataGrid

Many records with the same fields, read only – thousands of rows scroll smoothly, and a person picks rows, a block of cells or whole columns to hand on.

## When to use

- Records with the same fields that people scan, compare and look up – orders, products, suppliers
- Picking rows, a block of cells or whole columns to hand to an agent – 「这些」
- Copying records out to a spreadsheet

## When not to use

- A few items that each need a decision – `ApprovalCard`, `MatchReview` in the conversation
- One record with many fields – a detail panel or a settings form
- Editing in place – it's read only; changes go through the agent
- Each row has its own action – a list with buttons, like `Inbox`
- Pictures first – a gallery of cards

## Anatomy

- Card – the checkbox column, the header row and the first column stay put while the rest scrolls
- Checkbox column – always there: 「全选」 in the header, a box per row, a box per group that checks its rows
- Header row – the column labels in small gray
- First column – the record's name; 「打开」 at its end on hover, opaque, the words under it fading out
- Cells by type – `text` one line; `number` right-aligned; `date`; `check` a ✓; `tag` gray pills, with a status dot when `tone` gives one; `image` thumbnails, up to 4 then +N; `link` blue text
- Group header – a full-width row on `background`: its box, a › that turns when open, the value, its count in gray
- Selection – checked rows tinted; a block ringed in `primary` over a tint; whole columns tinted, their headers too
- Compact – rows 32px, 40 with thumbnails, 56 tall; header and group rows 32

## States

- Default – images, tags with dots, links, dates
- Grouped – rows under their group headers
- Collapsed – two groups folded to their headers; one of them checked, its box full
- Rows selected – three rows checked
- Block selected – two rows by two columns ringed
- Columns selected – one column tinted from header to bottom
- Loading – `rows` null: the header, then skeleton bars in each column
- Empty – `rows` empty: the `empty` line in the card
- Long – long text cut with `…`, its whole first line on hover; more columns than fit scroll sideways under the first column
- Many – 5,000 rows; only the ones on screen render
- No images – 32px rows
- Narrow – at 390px the card scrolls sideways; the checkbox and first columns stay

## API reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | – | The grid's accessible name |
| `columns` | `DataGridColumn[]` | – | In display order; the first is the record's name and stays on the left |
| `rows` | `DataGridRow[] \| null` | – | `{ id, …values }`; null is loading |
| `group` | `DataGridGroup` | – | `{ key, label? }` – a header before each run of equal values; sort rows by `key` first |
| `defaultCollapsed` | `string[]` | – | Group values folded at first; then the person folds and unfolds |
| `rowHeight` | `"sm" \| "md" \| "lg"` | `"md"` with an image column, else `"sm"` | 32, 40 or 56px; 44 at least on touch |
| `selection` | `DataGridSelection` | – | Controlled: what is selected, by ids. Leave it out and the grid keeps its own |
| `onSelectionChange` | `(s: DataGridSelection) => void` | – | After each click or key; a drag, once when it ends |
| `onOpen` | `(id: string) => void` | – | 「打开」, Enter, double-click. Without it 「打开」 doesn't show |
| `onLink` | `(url: string, row: DataGridRow) => void` | – | ⌘-click a link (Ctrl on Windows), or ⌘Enter on it |
| `empty` | `string` | 「暂无记录」 | The line when `rows` is empty |
| `className` | `string` | – | On the card – give its parent a height and the grid fills it |

`DataGridColumn`: `key`, `label`, `type` (`text` by default), `width` (fixed px; otherwise measured from the label and the first 100 rows, 64–`maxWidth`), `maxWidth` (280), `format` (`(value, row) => string` – the words a value shows and copies as), `tone` (tag only – `(value) => "waiting" | "running" | "done" | "error"`).

Values by type: `text` a string, the first line shown; `number`; `date` ms, a `Date` or an ISO string; `check` a boolean; `tag` a string or strings; `image` a URL or URLs; `link` a URL.

`DataGridSelection`: null, `{ rows }` – those rows checked, or `{ rows, columns }` – those cells: a block, or whole columns when `rows` is every row. Checked rows and whole columns include folded rows; a block covers rows on screen.

## Keyboard interactions

| Key | Does |
|---|---|
| ↑ ↓ | Move between rows and group headers; on a row the selection follows the active cell |
| ← → | Move along the row; on a group header, fold or unfold it |
| Shift + arrows | Grow the block, over rows only |
| ⌘ + arrows | Jump to the first or last row or column |
| Home / End | First or last column; with ⌘, the first or last stop |
| PageUp / PageDown | A screen up or down |
| Space | Check or uncheck the active row; on a group header, its rows |
| ⌘A | Check every row |
| Enter | Open the active row; on a group header, fold or unfold it |
| ⌘Enter | Open the link in the active cell |
| ⌘C | Copy the selection as tab-separated text – pastes into Excel and Google Sheets |
| Esc | Clear the selection |

Mouse: click a cell, drag for a block – it scrolls near the edges – shift-click to grow it; click a header for its column, shift-click for the columns between; press a row's box and drag down the column to check the rows you pass – from a checked box they uncheck; shift-click a box for the rows between; click a group's › or name to fold it, its box for its rows.

## Accessibility

- `role="grid"` named by `label`, multiselectable; `aria-rowcount` counts every line on screen, not only the rendered ones, and each row has its `aria-rowindex`
- One tab stop – focus stays on the grid and `aria-activedescendant` points at the active cell or group header, scrolled into view first so it is rendered
- Selected cells and checked rows are `aria-selected`; boxes are named 「选择 …」 by the first column or the group, 「全选」 goes mixed when some rows are checked, a group's box when some of its rows are
- A group's › is a button with `aria-expanded`
- Images read as 「3 张图」, a check as 「是」; a tag's dot always has its words beside it
- Selections and copies are announced once in a polite live region – 「已选 3 行」「已复制 3 行」
- Cells don't select as text – drag picks cells; ⌘C copies their words

## Motion

- A group's › turns in 150ms when it folds or opens; reduced motion – it jumps
- Nothing else moves – the selection follows the pointer and the keys at once, hover tints change instantly

## Responsive behavior

- Fills its parent's width; with a height, grows with its rows up to it, then scrolls inside
- Narrower than its columns – scrolls sideways; the checkbox and first columns stay; under 600px the first column takes at most 40%
- Touch – rows, headers and the checkbox column grow to 44px; a tap selects a cell and shows its row's 「打开」; a drag down the boxes checks rows, a drag anywhere else scrolls
- Dark mode built in – tokens follow the block's mode

## Notes for AI

- Map the host's values to the column types; `format` gives the words, also what ⌘C copies – links and images copy their URLs
- Selection is ids and column keys: keep it in the host, pass it back, and it survives new rows; ids that are gone drop out
- Pass `rows` already sorted, by the group key when grouping; keep `columns` the same array while they don't change – widths are measured from it
- It doesn't fetch or edit – a host's agent makes the changes, and the host passes new rows
