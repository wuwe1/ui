import { cn } from "cn"

/**
 * Busy mark for an icon slot – a button, a chip – where no text can shimmer. A dot with a ripple in the text color, the same shape as StatusIcon.
 * Next to a line of text, shimmer the text instead. Reduced motion – the ripple stands still as a faint ring
 */
function Spinner({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span data-slot="spinner" role="status" aria-label="加载中" className={cn("relative inline-flex size-4 shrink-0 items-center justify-center", className)} {...props}>
      <span className="absolute size-1/2 animate-ping rounded-full bg-current opacity-60 motion-reduce:animate-none motion-reduce:scale-175 motion-reduce:opacity-30" />
      <span className="relative size-1/2 transform-gpu rounded-full bg-current" />
    </span>
  )
}

export { Spinner }
