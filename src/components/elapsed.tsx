// Elapsed: a clock counting up from since – every 0.1s under 10 seconds, then every second.
import { useEffect, useState } from "react";
import { elapsed } from "../lib/time.ts";
import { cn } from "../lib/utils.ts";

/** since – the start, in ms since the epoch. Next to a status a screen reader already hears, give it aria-hidden */
function Elapsed({ since, className, ...props }: Omit<React.ComponentProps<"span">, "children"> & { since: number }) {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const t = setTimeout(() => setNow(Date.now()), now - since < 10_000 ? 100 : 1000);
		return () => clearTimeout(t);
	}, [now, since]);
	return (
		<span data-slot="elapsed" className={cn("tabular-nums", className)} {...props}>
			{elapsed(now - since)}
		</span>
	);
}

export { Elapsed };
