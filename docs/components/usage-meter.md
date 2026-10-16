# UsageMeter

How much of an agent's plan is used – a bar per limit window, a tick where its time has got to, when it resets – and what pay-as-you-go providers cost. `UsageSummary` is the one line that opens it.

## When to use

- A sidebar footer: the window that needs a look, in one line – `UsageSummary` – opening the panel
- Before a long job: whether each window has room until it resets
- Spend on providers billed per token, today and this month

## When not to use

- What fills one conversation's context – `ContextWindow`
- Usage over months – a chart
- Credits to buy or a plan to upgrade – the meter has no checkout

## Anatomy

- Card – one per account: the name, the plan as a tag
- Window – the label, the percentage on the right; a bar with a tick where the window's time has got to; 「17:00 重置」 under it, and 「照现在的速度 16:31 用完」 on the right when the pace runs out early
- Table – for spend: a column per period, a row per provider; a row with a budget gets a bar
- Tray – 「4 分钟前更新」, 「刷新」, a note on where the numbers come from
- Summary – the account, the window, its percentage; on the right the reset, the run-out time or how old the numbers are; a thin bar with the tick

## States

- Loading – `accounts` is null: the card's shape in skeletons, two lines in the summary
- Default
- Near the limit – from `warnAt` the percentage turns amber
- Runs out early – past half used and ahead of its time: 「照现在的速度 16:31 用完」 in amber; the summary says 「16:31 用完」
- Used up – 「已用完」, a full bar, 「16:12 恢复」
- Reset – past its reset time: 「已重置」, an empty bar, 「待更新」
- Stale – the summary's right side says how old the numbers are: 「2 小时前更新」
- Refresh – 「刷新」 holds a spinner until the promise settles, then the tray says 「刚刚更新」
- Refresh failed – 「刷新失败：claude 退出了」 in the tray
- Spend – a table of providers, one with a budget
- Many – cards stack; the host's panel scrolls
- Long – names truncate; numbers and times keep their place
- Empty – 「暂无用量」 and what will show up here
- In the sidebar – the summary opens the meter in a `Popsheet`

## API reference

`UsageMeter`

| Prop | Type | Default | Description |
|---|---|---|---|
| `accounts` | `UsageAccount[] \| null` | – | null is loading |
| `warnAt` | `number` | `0.8` | Share from which a percentage turns amber |
| `onRefresh` | `(accountId: string) => unknown` | – | Shows 「刷新」 in the tray of each account with `at`. A promise keeps it busy; a rejection shows its message |
| `emptyNote` | `string` | – | Under 「暂无用量」: what will show up here |
| `title` | `string` | 「用量」 | Names the group for screen readers |
| `className` | `string` | – | Classes on the root |

`UsageSummary` is a `button`; its other props pass through, so it works as a `Popsheet` trigger.

| Prop | Type | Default | Description |
|---|---|---|---|
| `accounts` | `UsageAccount[] \| null` | – | null is loading |
| `warnAt` | `number` | `0.8` | Share from which the percentage turns amber |
| `staleAfter` | `number` | `1800000` | After this many ms without an update, the right side says how old the numbers are |
| `label` | `string` | 「用量」 | Shown when no window is live |

`UsageAccount`: `{ id, label, plan?, windows?, table?, at?, note? }`. `at` is when the numbers were read, in ms; with it the card gets a tray.

`UsageWindow`: `{ label, used, resetsAt, span? }`. `used` is 0–1; `resetsAt` is ms, or null when unknown; `span` is the window's length in ms – it draws the tick and allows the run-out guess.

`UsageTable`: `{ columns, rows }`, each row `{ label, values, share? }`. Values come formatted; `share` is 0–1 of a budget and draws a bar.

The math is in `lib/usage-meter.ts`: `live`, `elapsed`, `runOut`, `urgent`, `when`, `updated`.

## Keyboard interactions

| Key | Does |
|---|---|
| Tab | Reaches the summary; in the meter, each 「刷新」 |
| Enter or Space | Opens the host's panel from the summary; presses 「刷新」 |

## Accessibility

- Each window is a `meter` named by its label, its value as words: 「已用 43%，17:00 重置，时间已过 68%」
- The summary is a button named by the same sentence; a `role="status"` inside speaks once when a window crosses `warnAt`, runs out early or is used up
- Amber is never alone: the percentage, 「用完」 and 「已用完」 say it in words
- The tray is `role="status"`: a refresh's outcome is announced once
- The summary is 44px tall on touch screens

## Motion

- Bars and ticks glide to new values in 300ms with `ease-out-strong`; percentages roll
- Nothing moves on open – the numbers are there when the panel is
- Reduced motion – bars and numbers jump

## Responsive behavior

- Fills its container; on phones the host opens it as a bottom sheet
- Long names truncate; percentages and times never wrap
- Dark mode built in

## Notes for AI

- The meter counts nothing: pass what the provider reports, `used` as 0–1
- Give `span` to windows of a fixed length – 5 hours, 7 days. Without it there's no tick and no run-out guess
- The run-out time is a straight line from the window's start, shown only past half used and only when it lands before the reset
- Format money yourself and pass it in the table; the meter only lays it out
- In a sidebar footer: `UsageSummary` as the trigger of a `Popsheet` with `bare`, `UsageMeter` inside
