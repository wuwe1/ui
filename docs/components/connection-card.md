# ConnectionCard

Something an agent works through for you – a store, a browser, a site login – and whether it can right now. A gray tray holds the summary and the one thing to do; it opens to a white card, one row per account.

## When to use

- The stores, browsers and logins an agent acts through, on a connections page
- A handful of connections with a few accounts each – the shops of one platform, the browsers that run the extension
- Status first: what works, what needs you, and the button that fixes it

## When not to use

- A directory of dozens of apps to connect – lines with a connect button, categories and search fit better
- A connection's settings – fields and a save bar belong on a settings page
- One account with nothing under it – a plain line is enough

## Anatomy

ConnectionCard
- Tray – gray, rounded; the header sits on it
- Tile – the logo or icon on white
- Name, then the status – a mark and a few words, amber or red when it needs you
- Description – what it does for you, two lines at most
- Action – the one thing to do now, on the right; none when all is well
- Chevron – `›`, turns when open; only when there is something to open
- Body – a white card: one row per account, then the footer – add another, steps, a note

ConnectionRow
- Mark, name, and facts under the name set apart by space
- Right side – the status in words, then buttons; quiet buttons appear on hover or focus

ConnectionNote
- A line in the footer – muted, amber or red after the mark it's given

## States

- All set – folded; a green mark and the count in words. Open, its rows show quiet buttons on hover
- Needs you – open on its own; an amber mark that ripples; rows carry their own buttons
- Action – one press fixes the card, so the button sits in the header; it spins while the page opens
- Error – a red mark; the reason in a note
- Checking – 「检查中」 sweeps; the mark waits for the result
- Not connected – a gray mark and the button to connect; the steps wait in the footer
- Nothing to open – no rows, no footer: no chevron, and the header isn't a button
- Long – a long name and description, many rows

## API reference

ConnectionCard

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `ReactNode` | – | Logo or icon on the white tile – an `img` or a lucide icon |
| `name` | `string` | – | 「Shopee 店铺」 |
| `mark` | `ConnectionMark` | `"off"` | `"ok"`, `"waiting"` – needs you, `"error"`, `"off"` – not connected or not in use |
| `status` | `string` | – | A few words beside the name – 「已连接 2 个」, 「1 家店授权快到期」 |
| `checking` | `boolean` | `false` | Shows 「检查中」 sweeping in place of the status |
| `description` | `ReactNode` | – | What it does for you |
| `action` | `ReactNode` | – | The one thing to do now – a `Button`, or a menu that picks where |
| `children` | `ReactNode` | – | `ConnectionRow`s, one per account |
| `footer` | `ReactNode` | – | Under the rows – add another, steps, `ConnectionNote`s |
| `open`, `defaultOpen`, `onOpenChange` | | | Controlled or not. Left alone, it starts open when the mark is waiting or error, opens itself when it turns so, and never closes itself |
| `className` | `string` | – | Classes on the tray |

ConnectionRow

| Prop | Type | Default | Description |
|---|---|---|---|
| `mark` | `ConnectionMark` | – | The account's own |
| `name` | `ReactNode` | – | Text, or an inline editor |
| `meta` | `ReactNode[]` | – | Facts under the name – 「TW」, 「授权到 2027-05-04」 – spaced apart |
| `status` | `string` | – | Words on the right, in the mark's color |
| `actions` | `ReactNode` | – | Buttons that always show |
| `quiet` | `ReactNode` | – | Buttons that show on hover or focus, and always on touch screens |

ConnectionNote: `mark` colors it – `"waiting"` amber, `"error"` red, else muted. Also exported: `ConnectionMark`.

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | The header, its action, then each row's buttons and the footer |
| Enter or Space | Opens or closes the card; presses the buttons |

## Accessibility

- The header is one button named by the connection, with `aria-expanded`; the action sits beside it, never inside
- The status is a polite live region – 「检查中」 turning into 「未登录」 is read out
- Never color alone: marks sit next to words; a row without a status gives its mark a tooltip – 「待处理」
- A folded body leaves the tab order
- Quiet buttons show when focused, and always on touch screens

## Motion

- The body slides open and shut in 200ms; with prefers-reduced-motion it appears at once
- The chevron turns 90°
- An amber mark ripples while it needs you; with reduced motion it stands still as a faint ring
- A row's background fades in on hover, quiet buttons with it, in 150ms

## Responsive behavior

- Fills its container; the description clamps to two lines
- A row's name truncates and its facts wrap; the right side never wraps
- Touch screens show quiet buttons all the time
- Dark mode built in

## Notes for AI

- One card per connection, one row per account. Give the header an `action` only when one press fixes the whole card; otherwise put buttons on the rows
- Status stays short – up to 8 characters: 「已连接」, 「待授权」, 「未登录」, 「授权失败」
- Facts go in `meta` as separate items; never join them with `·`
- Leave `open` to the card – it opens itself when it starts needing you; once fixed it stays open, so the person sees the green rows, until they fold it
- A spinning action is the host's: a `Button` with a `Spinner` while the page opens
