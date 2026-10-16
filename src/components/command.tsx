// shadcn/ui's Command, on cmdk. Changed, after affectUI's Command Menu: the search is a line on top of the list – a magnifier, the text,
// a rule under it – not a field inside the box; an accent pill glides to the selected row, and the list glides to its height while
// filtering; CommandHighlight sets what's typed in semibold; Esc with text clears it before a dialog closes; rows are 44px and the input
// 16px on touch; search is a substring, starts first (lib/search.ts) – not cmdk's fuzzy match; no hidden check at the end of every row
"use client"

import * as React from "react"
import { Command as CommandPrimitive, useCommandState } from "cmdk"
import { cn } from "cn"
import { SearchIcon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog.tsx"
import { useReducedMotion } from "../hooks/use-reduced-motion.ts"
import { ranges, score } from "../lib/search.ts"

/** cmdk's filter: a substring of the value or a keyword, starts first */
const substring = (value: string, search: string, keywords?: string[]) =>
  score(keywords?.length ? `${value} ${keywords.join(" ")}` : value, search)

function Command({
  className,
  filter = substring,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      filter={filter}
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-xl! bg-popover text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "命令",
  description = "搜索要执行的命令…",
  children,
  className,
  showCloseButton = false,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          "top-1/3 translate-y-0 overflow-hidden rounded-xl! p-0",
          className
        )}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  value,
  onValueChange,
  onKeyDown,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  // Held here when the host doesn't: Esc has to be able to clear it
  const [own, setOwn] = React.useState("")
  const text = value ?? own
  const set = (v: string) => {
    if (value === undefined) setOwn(v)
    onValueChange?.(v)
  }
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-10 shrink-0 items-center gap-2 border-b px-3 pointer-coarse:h-11"
    >
      <SearchIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <CommandPrimitive.Input
        data-slot="command-input"
        // A Dialog leaves Esc to the input while there's text to clear (dialog.tsx)
        data-escape={text ? "local" : undefined}
        value={text}
        onValueChange={set}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          // Not defaultPrevented: a Dialog prevents Esc to stay open, and then the text is ours to clear
          if (e.key === "Escape" && text && !e.nativeEvent.isComposing) {
            e.preventDefault()
            set("")
          }
        }}
        className={cn(
          "h-full w-full min-w-0 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:text-base",
          className
        )}
        {...props}
      />
    </div>
  )
}

/** The accent pill under the selected row: it glides there. Reduced motion – it fades in at the row */
function CommandPill() {
  const selected = useCommandState((s) => s.value)
  // Filtering moves rows without changing the selection: read these so the pill follows
  useCommandState((s) => s.search)
  useCommandState((s) => s.filtered.count)
  const reduced = useReducedMotion()
  const ref = React.useRef<HTMLSpanElement>(null)
  const [box, setBox] = React.useState<{ y: number; h: number } | null>(null)
  const [glide, setGlide] = React.useState(false)
  React.useLayoutEffect(() => {
    const row = ref.current?.parentElement?.querySelector<HTMLElement>('[cmdk-item][data-selected="true"]')
    if (!row) return setBox(null)
    // offsetTop is from the list's sizer, which is positioned; groups aren't
    const y = row.offsetTop
    const h = row.offsetHeight
    setBox((b) => (b && b.y === y && b.h === h ? b : { y, h }))
  })
  // Glides start a frame after the list shows, so the pill starts on its row
  React.useEffect(() => {
    const r = requestAnimationFrame(() => setGlide(true))
    return () => cancelAnimationFrame(r)
  }, [])
  return (
    <span
      ref={ref}
      aria-hidden
      key={reduced ? selected : "pill"}
      style={box ? { translate: `0 ${box.y}px`, height: box.h } : undefined}
      className={cn(
        "pointer-events-none absolute inset-x-1 top-0 rounded-md bg-accent",
        !box && "hidden",
        reduced
          ? "animate-in fade-in-0 transition-none duration-150"
          : glide && "transition-[translate,height] duration-200 ease-out-strong"
      )}
    />
  )
}

function CommandList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar relative max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto overscroll-contain outline-none [&_[cmdk-list-sizer]]:relative",
        // cmdk measures its rows into --cmdk-list-height: the list glides to it while filtering
        "h-(--cmdk-list-height) motion-safe:transition-[height] motion-safe:duration-200 motion-safe:ease-out-strong",
        className
      )}
      {...props}
    >
      <CommandPill />
      {children}
    </CommandPrimitive.List>
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-md text-muted-foreground", className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative z-10 flex min-h-8 cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none pointer-coarse:min-h-11 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground",
        className
      )}
      {...props}
    />
  )
}

/** A row's text with what's typed in semibold foreground – a gray hint lights up where it matches */
function CommandHighlight({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const search = useCommandState((s) => s.search)
  const rs = ranges(text, search)
  if (!rs.length) return <span className={className}>{text}</span>
  const out: React.ReactNode[] = []
  let at = 0
  rs.forEach(([a, b], i) => {
    if (a > at) out.push(text.slice(at, a))
    out.push(
      <span key={i} className="font-semibold text-foreground">
        {text.slice(a, b)}
      </span>
    )
    at = b
  })
  if (at < text.length) out.push(text.slice(at))
  return <span className={className}>{out}</span>
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandHighlight,
  CommandShortcut,
  CommandSeparator,
}
