# Level of finish

Every component gets the full pass. The bar is affectUI's: every state, key, screen reader and motion thought through, and docs that stay short.

## Start with what it does

One or two sentences. Every element on screen serves them; cut what doesn't.

## States

- Default, empty, loading, error, long, many, disabled, live – none missing
- Each one has a story on the showcase
- Empty says what will show up here

## Loading

Pick by what is waiting:

- A line of text in progress – `Shimmer`: 「正在等待回复…」, a running step
- Content with a known shape – `Skeleton` at the size of what's coming, so nothing jumps when it lands
- An icon slot in a button or chip – `Spinner`
- A region with no known shape – `Loading` from `placeholder.tsx`

Lists keep their status dots – a dot is a status, not a loader. Never put a spinner next to a line of text; shimmer the text.

## Keyboard

- Everything clickable is reachable by Tab, in visual order
- Arrow keys move within a group; `Home` and `End` jump to the ends
- `Esc` closes the overlay and returns focus to what opened it
- A global shortcut only for the one action that matters most, shown on its button with `Kbd`
- Focus rings show for keyboard use only

## Accessibility

- A signal color used as text is `-strong`
- Never color alone: a status dot has words next to it
- Everything clickable has a name; icon-only buttons get `aria-label`
- Changes are announced with `role="status"`; a ticking clock is `aria-hidden`
- No button inside a button
- Touch targets are at least 44px on phones

## Motion

- Only for change that means something: enter, exit, move, a number changing
- Durations: 150ms small, 200ms default, 300ms drawers
- Enter with `ease-out-strong`, exit with `ease-in-strong`, follow a finger with `ease-drawer`
- Things glide to their new place, never jump; numbers are `tabular-nums` so they don't jitter
- Reduced motion – movement becomes a fade, loops stand still, no information is lost

## Craft

What makes a component look made, not assembled. Each line was measured on affectUI; check them all before showing anything.

- Real content – real names, files, numbers in every story; never 「Item 1」
- Type in layers – the name 13px medium, its hint 12px `muted-foreground` on the same baseline; numbers `tabular-nums`
- Tray and card – an agent's item is a `Tray`: content in the card, the system's voice on the tray (`components/tray.md`)
- Concentric corners – an inner radius is the outer one less the padding between them: tray 18, card 14, a row in it 10
- Light lines, two lifts – a 1px border or a hairline ring; `shadow-rest` or `shadow-float`, nothing else (`theme.md`)
- One curve – `ease-out-strong` in, `ease-in-strong` out; an overshoot only inside a named pop (`motion.md`)
- Moments – every change a person must notice has a cue from `motion.md`, where their eyes already are
- No dead ends – an empty search offers the next step; a failure keeps the item, its reason and a retry
- Preview before commit – show what an action will do before it does it, when undoing is costly
- Objects over boxes – give an invisible state a shape: cells for a context window, a stack for waiting messages
- Stories that play – a Live story runs the component's life on its own, the failure included

## Responsive

- Phone under 768px, tablet to 1023px, desktop from 1024px
- On phones, overlays come up from the bottom (`Popsheet`)
- Content never breaks its container: long code scrolls sideways; a truncated title keeps its status on the right

## Data in, events out

Props in, callbacks out. No fetching, no global state. The project wires the data: mixer's `InboxHome` feeds `Inbox`.

## Specs

`docs/components/<file>.md`. First a title and one sentence on what it is, then these sections in order; leave out one with nothing to say:

When to use, When not to use, Anatomy, States, API reference, Keyboard interactions, Accessibility, Motion, Responsive behavior, Notes for AI.

`shimmer.md` is the model.
