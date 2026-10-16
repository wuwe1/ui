# Sidebar

shadcn/ui's Sidebar with two changes: on phones it's a drawer you swipe, and on desktop its inner edge can be dragged to a width that's kept.

## When to use

- An app's navigation and workspace beside the content – projects, sessions, pages
- Lists whose rows get long or nest – let people widen it instead of truncating everything

## When not to use

- A panel about the current item – a panel beside the content, or a `Sheet`
- Short-lived choices – a `Popsheet` or a menu

## Anatomy

- `SidebarProvider` – holds open state and width; `--sidebar-width` on the wrapper drives both the gap and the fixed container
- `Sidebar` – desktop: a fixed column with a gap that pushes the inset aside; phone: `Drawer` from the left at 18rem
- `SidebarResizer` – put inside `Sidebar`; an 8px strip centered on the inner edge, a 2px line in `ring` on hover, focus and drag

## Resizing

- Opt in with `width` and `onWidthChange` on `SidebarProvider`; without `onWidthChange` the resizer renders nothing and the sidebar stays 16rem
- Dragging writes the CSS variable straight to the wrapper – nothing re-renders while dragging – and reports the width on release
- `minWidth` 224px and `maxWidth` 512px by default; the reported width is clamped to them
- Double-click goes back to 16rem and reports `null`
- While dragging the wrapper gets `data-resizing`: no width transition, a column-resize cursor everywhere, no text selection
- Collapsed, or on a phone – no resizer

## States

- Default – 16rem, the resizer line hidden until hover
- Resized – the kept width, clamped
- Dragging – line shown, cursor col-resize across the page
- Collapsed – no resizer; reopening returns to the kept width

## Keyboard

- The resizer is a `separator` in the Tab order; ←→ change the width by 32px and report it at once
- ⌘B / Ctrl+B toggles the sidebar

## Accessibility

- The resizer has `role="separator"`, `aria-orientation="vertical"`, `aria-label`「调整侧栏宽度」, and `aria-valuenow` / `min` / `max` in px
- Its `title` says how to use it: 「拖动调整宽度，双击恢复默认」

## Motion

- Opening and closing slide 200ms linear, as shadcn ships
- Resizing follows the pointer with no transition

## Data in, events out

- The provider doesn't store the width; the app keeps it (a device-local setting) and passes it back
- `useSidebar().width` is the width in px, the default 256 included – content beside the sidebar can make room for it
