import { cn } from "cn"

/** 加载中：和状态标记同一个样子（一个点、带一圈扩散），颜色跟着文字走；Claude 运行中用 StatusIcon 的蓝点。prefers-reduced-motion 时扩散停成一圈淡的 */
function Spinner({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span data-slot="spinner" role="status" aria-label="加载中" className={cn("relative inline-flex size-4 shrink-0 items-center justify-center", className)} {...props}>
      <span className="absolute size-1/2 animate-ping rounded-full bg-current opacity-60 motion-reduce:animate-none motion-reduce:scale-175 motion-reduce:opacity-30" />
      <span className="relative size-1/2 transform-gpu rounded-full bg-current" />
    </span>
  )
}

export { Spinner }
