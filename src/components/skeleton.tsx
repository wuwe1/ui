// Skeleton: from shadcn/ui. Changed – a sheen sweeps across instead of the pulse, in step with Shimmer; it stands still with reduced motion.
import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("shimmer-bg rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
