// Shimmer: a line of text that is still in progress – a light sweeps across it.
// The sweep is the `shimmer` utility (theme/variants.css); this adds `active` and a slot name.
// Children with their own layer – opacity, transform, filter – drop out of the text mask and vanish.
import { cn } from "../lib/utils.ts";

/** active – false stops the sweep and leaves plain text, so a finished step keeps its layout */
function Shimmer({ active = true, className, ...props }: React.ComponentProps<"span"> & { active?: boolean }) {
	return <span data-slot="shimmer" className={cn(active && "shimmer", className)} {...props} />;
}

export { Shimmer };
