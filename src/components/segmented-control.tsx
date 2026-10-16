// SegmentedControl: pick one of two to six options that apply right away – a pill on a gray track glides to the pick.
// One style, the track and the pill. A radiogroup by default; kind="tabs" when it switches panels. Arrows pick, not only move focus,
// and there's no picking nothing – the two things a single ToggleGroup got wrong. Too many for the width – it scrolls sideways, with fades.
import type { LucideIcon } from "lucide-react";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { useDragScroll } from "../hooks/use-drag-scroll.ts";
import { next, stop } from "../lib/segmented-control.ts";
import { cn } from "../lib/utils.ts";

export type SegmentOption = {
	value: string;
	label?: ReactNode;
	icon?: LucideIcon;
	/** A gray number after the label, read as part of its name */
	count?: number;
	disabled?: boolean;
	/** Quieter but still pickable – a group with nothing in it */
	dim?: boolean;
	/** The name of an icon-only option */
	ariaLabel?: string;
	/** A tooltip, one sentence */
	title?: string;
	/** kind="tabs" – the id of the panel this tab shows */
	controls?: string;
};

type SegmentedControlProps = {
	options: SegmentOption[];
	value?: string;
	/** Uncontrolled start; the first enabled option when left out */
	defaultValue?: string;
	onChange?: (value: string) => void;
	/** sm 24px, md 28px options; 40px on touch screens */
	size?: "sm" | "md";
	/** Fills its container with equal segments; long labels end with … */
	fullWidth?: boolean;
	/** radio picks a value; tabs switches panels – pair it with controls on each option */
	kind?: "radio" | "tabs";
	disabled?: boolean;
	/** Tab ids are `${id}-${value}`, so a panel can name itself with aria-labelledby */
	id?: string;
	"aria-label"?: string;
	"aria-labelledby"?: string;
	className?: string;
};

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
/** A fade on each end that hides more options */
const fade = ({ start, end }: { start: boolean; end: boolean }) =>
	start || end ? `linear-gradient(to right, ${start ? "transparent, black 24px" : "black"}, ${end ? "black calc(100% - 24px), transparent" : "black"})` : undefined;
const EASE = "var(--ease-out-strong)";

function SegmentedControl({ options, value, defaultValue, onChange, size = "md", fullWidth, kind = "radio", disabled, id, className, ...aria }: SegmentedControlProps) {
	const [inner, setInner] = useState(() => defaultValue ?? stop(options, undefined));
	const current = value ?? inner;
	const scroller = useRef<HTMLDivElement>(null);
	const row = useRef<HTMLDivElement>(null);
	const buttons = useRef(new Map<string, HTMLButtonElement>());
	const more = useDragScroll(scroller);
	const [box, setBox] = useState<{ left: number; right: number } | null>(null);
	// The edge facing the target leads, so the pill stretches a little on the way
	const [lead, setLead] = useState<1 | -1>(1);
	// Only a pick glides; a label or count that changes width moves the pill at once
	const [gliding, setGliding] = useState(false);
	const glide = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const [pressed, setPressed] = useState(false);
	// Reduced motion: the pill fades in at its new place instead of gliding
	const [fadeKey, setFadeKey] = useState(0);

	useLayoutEffect(() => {
		const el = current === undefined ? undefined : buttons.current.get(current);
		const r = row.current;
		if (!el || !r) return setBox(null);
		// Same place, same object: options passed inline are new every render, and a new box each time would render forever
		const measure = () => {
			const left = el.offsetLeft;
			const right = r.offsetWidth - el.offsetLeft - el.offsetWidth;
			setBox((b) => (b?.left === left && b.right === right ? b : { left, right }));
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(r);
		ro.observe(el);
		return () => ro.disconnect();
	}, [current, options]);

	// Keep the pick in view when the row scrolls
	useLayoutEffect(() => {
		const sc = scroller.current;
		const el = current === undefined ? undefined : buttons.current.get(current);
		if (!sc || !el || sc.scrollWidth <= sc.clientWidth) return;
		const pad = 24;
		const left = el.offsetLeft < sc.scrollLeft + pad ? el.offsetLeft - pad : el.offsetLeft + el.offsetWidth > sc.scrollLeft + sc.clientWidth - pad ? el.offsetLeft + el.offsetWidth - sc.clientWidth + pad : null;
		if (left !== null) sc.scrollTo({ left, behavior: reduced() ? "auto" : "smooth" });
	}, [current]);

	const pick = (v: string) => {
		if (v === current || disabled) return;
		const order = options.map((o) => o.value);
		setLead(order.indexOf(v) > order.indexOf(current ?? "") ? 1 : -1);
		if (reduced()) setFadeKey((k) => k + 1);
		else {
			setGliding(true);
			clearTimeout(glide.current);
			glide.current = setTimeout(() => setGliding(false), 350);
		}
		if (value === undefined) setInner(v);
		onChange?.(v);
	};
	const tabStop = stop(options, current);
	const fast = `200ms ${EASE}`;
	const slow = `300ms ${EASE}`;
	const edges = lead > 0 ? `right ${fast}, left ${slow}` : `left ${fast}, right ${slow}`;
	const tabs = kind === "tabs";

	return (
		<div ref={scroller} data-slot="segmented-control" className={cn("no-scrollbar overflow-x-auto overscroll-x-contain rounded-lg", fullWidth ? "w-full" : "w-fit max-w-full", disabled && "opacity-50", className)} style={{ maskImage: fade(more) }}>
			<div
				ref={row}
				role={tabs ? "tablist" : "radiogroup"}
				aria-disabled={disabled || undefined}
				{...aria}
				onKeyDown={(e) => {
					const v = next(options, current, e.key, kind);
					if (v === null || disabled) return;
					e.preventDefault();
					pick(v);
					buttons.current.get(v)?.focus();
				}}
				className={cn("relative flex rounded-lg bg-muted p-0.5", fullWidth ? "w-full" : "w-max")}
			>
				{box && (
					<span
						key={fadeKey}
						aria-hidden
						className={cn("pointer-events-none absolute inset-y-0.5 rounded-md bg-raised shadow-xs ring-1 ring-foreground/5", fadeKey > 0 && "animate-in fade-in-0 duration-150")}
						style={{ left: box.left, right: box.right, scale: pressed && !reduced() ? "0.97" : undefined, transition: [gliding && edges, `scale 150ms ${EASE}`].filter(Boolean).join(", ") }}
					/>
				)}
				{options.map((o) => {
					const on = o.value === current;
					const I = o.icon;
					return (
						<button
							key={o.value}
							ref={(el) => {
								if (el) buttons.current.set(o.value, el);
								else buttons.current.delete(o.value);
							}}
							type="button"
							role={tabs ? "tab" : "radio"}
							{...(tabs ? { "aria-selected": on, "aria-controls": o.controls, id: id ? `${id}-${o.value}` : undefined } : { "aria-checked": on })}
							aria-label={o.ariaLabel}
							title={o.title}
							data-value={o.value}
							tabIndex={o.value === tabStop ? 0 : -1}
							disabled={disabled || o.disabled}
							onPointerDown={() => setPressed(true)}
							onPointerUp={() => setPressed(false)}
							onPointerLeave={() => setPressed(false)}
							onPointerCancel={() => setPressed(false)}
							onClick={() => pick(o.value)}
							className={cn(
								"relative z-10 flex shrink-0 items-center justify-center rounded-md whitespace-nowrap outline-none transition-colors duration-150 select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none pointer-coarse:h-10",
								size === "sm" ? "h-6 gap-1 px-2.5 text-xs" : "h-7 gap-1.5 px-3 text-md",
								fullWidth && "min-w-0 flex-1 px-1.5",
								on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
								o.disabled ? "opacity-50" : o.dim && !on && "opacity-60",
							)}
						>
							{I && <I className={cn("shrink-0", size === "sm" ? "size-3.5" : "size-4")} aria-hidden />}
							{o.label !== undefined && (
								// The semibold copy holds the width, so picking never shifts the neighbours; it's hidden from screen readers
								<span className="grid min-w-0">
									<span className={cn("col-start-1 row-start-1 truncate transition-opacity duration-150", on && "opacity-0")}>{o.label}</span>
									<span aria-hidden className={cn("col-start-1 row-start-1 truncate font-semibold transition-opacity duration-150", !on && "opacity-0")}>{o.label}</span>
								</span>
							)}
							{o.count !== undefined && <span className="shrink-0 text-muted-foreground tabular-nums">{o.count}</span>}
						</button>
					);
				})}
			</div>
		</div>
	);
}

export { SegmentedControl };
