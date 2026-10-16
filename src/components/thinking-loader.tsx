// ThinkingLoader: the line an agent UI shows while the model works – a shimmering label and a clock, no spinner.
// The caller names the phase; a new label rolls up into place. Done – the sweep stops and the label says how long it took.
import { Check } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Elapsed } from "./elapsed.tsx";
import { Shimmer } from "./shimmer.tsx";
import { cn } from "../lib/utils.ts";

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The label: a change rolls the old one up and out and the new one up and in, while the box glides to the new width */
function Roll({ text, active }: { text: string; active: boolean }) {
	const [items, setItems] = useState(() => [{ key: 0, text }]);
	const last = items[items.length - 1];
	if (last.text !== text) setItems(reduced() ? [{ key: last.key + 1, text }] : [last, { key: last.key + 1, text }]);
	const box = useRef<HTMLSpanElement>(null);
	const [width, setWidth] = useState<number | null>(null);
	// Two labels in the box: pin it to the old width, then let it glide to the new one
	useLayoutEffect(() => {
		const [a, b] = box.current ? ([...box.current.children] as HTMLElement[]) : [];
		if (items.length < 2 || !a || !b) return;
		setWidth(a.offsetWidth);
		const f = requestAnimationFrame(() => requestAnimationFrame(() => setWidth(b.offsetWidth)));
		const t = setTimeout(() => {
			setItems((xs) => xs.slice(-1));
			setWidth(null);
		}, 260);
		return () => {
			cancelAnimationFrame(f);
			clearTimeout(t);
		};
	}, [items]);
	return (
		<span ref={box} className="inline-grid overflow-hidden transition-[width] duration-200 ease-out-strong" style={width === null ? undefined : { width }}>
			{items.map((it, i) =>
				i < items.length - 1 ? (
					<span key={it.key} aria-hidden className="col-start-1 row-start-1 w-max animate-out fade-out slide-out-to-top-full blur-out-[2px] fill-mode-forwards duration-200 ease-in-strong">
						{it.text}
					</span>
				) : (
					<span key={it.key} className={cn("col-start-1 row-start-1 w-max", items.length > 1 && "animate-in fade-in slide-in-from-bottom-full blur-in-[2px] duration-200 ease-out-strong")}>
						<Shimmer active={active}>{it.text}</Shimmer>
					</span>
				),
			)}
		</span>
	);
}

type ThinkingLoaderProps = {
	/** What the model is doing now; change it and the new label rolls in */
	label?: string;
	/** When the wait began, in ms since the epoch – shows a clock */
	since?: number;
	/** The work finished: the sweep stops, the clock goes, doneLabel shows */
	done?: boolean;
	/** The label once done; a function gets whole seconds since `since` */
	doneLabel?: string | ((seconds: number) => string);
	/** plain – a line in the flow of a conversation; pill – a bordered capsule for inside a bubble */
	variant?: "plain" | "pill";
	className?: string;
};

function ThinkingLoader({ label = "正在等待回复…", since, done = false, doneLabel = (s) => `想了 ${s} 秒`, variant = "plain", className }: ThinkingLoaderProps) {
	// When done turned on: the seconds in doneLabel stop there
	const [end, setEnd] = useState<number | null>(() => (done ? Date.now() : null));
	useEffect(() => setEnd(done ? Date.now() : null), [done]);
	const seconds = since !== undefined && end !== null ? Math.max(1, Math.round((end - since) / 1000)) : 0;
	const text = done ? (typeof doneLabel === "function" ? doneLabel(seconds) : doneLabel) : label;
	return (
		<div
			role="status"
			data-slot="thinking-loader"
			data-variant={variant}
			className={cn("flex w-fit max-w-full items-center gap-2 text-xs text-muted-foreground", variant === "pill" && "rounded-full border bg-background px-3 py-1 shadow-xs", className)}
		>
			{done && <Check className="size-3.5 shrink-0 animate-in fade-in duration-200 ease-out-strong motion-safe:zoom-in-50" aria-hidden />}
			<Roll text={text} active={!done} />
			{!done && since !== undefined && <Elapsed since={since} className="text-2xs" aria-hidden />}
		</div>
	);
}

export { ThinkingLoader };
