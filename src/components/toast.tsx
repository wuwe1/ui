// Toaster and toast: a short line about what just happened, from anywhere. Up to three stack, the newest in front; hover or focus fans them out.
// Timers pause on hover, focus and a hidden tab – nothing leaves mid-read. toast.promise turns one loading line into success or error, in place.
// Calm: color only on the success and error icons; loading shimmers its words instead of a spinner. No sonner.
// toast("已移出工作区", { action: { label: "撤销", onClick } }), toast.error("发送失败", { description: "网络连接已断开" }), toast.promise(p, { loading, success, error })
import { Check, CircleAlert, X } from "lucide-react";
import { type FocusEvent, type KeyboardEvent, type PointerEvent, type Ref, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "./button.tsx";
import { Shimmer } from "./shimmer.tsx";
import { durationOf, shown, type ToastAction, type ToastItem, type ToastKind, upsert } from "../lib/toast.ts";
import { cn } from "../lib/utils.ts";

export type { ToastAction, ToastItem, ToastKind } from "../lib/toast.ts";

/** id – an existing one updates that toast in place and restarts its timer. duration – ms; Infinity stays until closed */
export type ToastOptions = { id?: string; description?: string; action?: ToastAction; duration?: number };
type Message = string | { title: string; description?: string };

let list: ToastItem[] = [];
/** What the live regions read: errors go to the assertive one */
let said = { polite: "", urgent: "" };
let seq = 0;
const subs = new Set<() => void>();
const emit = () => {
	for (const f of subs) f();
};
const subscribe = (f: () => void) => {
	subs.add(f);
	return () => {
		subs.delete(f);
	};
};

function show(kind: ToastKind, title: string, o: ToastOptions = {}): string {
	const id = o.id ?? `toast-${++seq}`;
	list = upsert(list, { id, kind, title, description: o.description, action: o.action, duration: durationOf(kind, o.action, o.duration) });
	const text = o.description ? `${title}，${o.description}` : title;
	said = kind === "error" ? { polite: "", urgent: text } : { polite: text, urgent: "" };
	emit();
	return id;
}

const split = (m: Message) => (typeof m === "string" ? { title: m } : m);

function dismiss(id?: string) {
	list = id ? list.filter((t) => t.id !== id) : [];
	emit();
}

/** A loading toast that becomes success or error in place. Returns the promise */
function promise<T>(p: Promise<T> | (() => Promise<T>), m: { loading: Message; success: Message | ((v: T) => Message); error: Message | ((e: unknown) => Message) }, o: Omit<ToastOptions, "id"> = {}): Promise<T> {
	const l = split(m.loading);
	const id = show("loading", l.title, { description: l.description });
	const run = typeof p === "function" ? p() : p;
	run.then(
		(v) => {
			const s = split(typeof m.success === "function" ? m.success(v) : m.success);
			show("success", s.title, { ...o, id, description: s.description });
		},
		(e: unknown) => {
			const s = split(typeof m.error === "function" ? m.error(e) : m.error);
			show("error", s.title, { ...o, id, description: s.description });
		},
	);
	return run;
}

export const toast = Object.assign((title: string, o?: ToastOptions) => show("info", title, o), {
	success: (title: string, o?: ToastOptions) => show("success", title, o),
	error: (title: string, o?: ToastOptions) => show("error", title, o),
	loading: (title: string, o?: ToastOptions) => show("loading", title, o),
	promise,
	dismiss,
});

const GAP = 8;
/** How far each card behind peeks out when folded */
const PEEK = 8;
const LEAVE_MS = 150;

type Position = "top-center" | "bottom-center" | "bottom-right";
const PLACE: Record<Position, string> = {
	// Under a top bar: --toaster-top moves it down, past a bar or a pill the page shows there
	"top-center": "inset-x-3 top-[calc(env(safe-area-inset-top)+var(--toaster-top,3.5rem))] justify-center",
	"bottom-center": "inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] justify-center",
	"bottom-right": "inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] justify-center sm:right-6 sm:bottom-6 sm:left-auto",
};

const onVisibility = (f: () => void) => {
	document.addEventListener("visibilitychange", f);
	return () => document.removeEventListener("visibilitychange", f);
};

/** Mount once. position – top-center under the top bar by default; label names the region */
export function Toaster({ position = "top-center", label = "通知", className }: { position?: Position; label?: string; className?: string }) {
	const items = useSyncExternalStore(subscribe, () => list, () => list);
	const voice = useSyncExternalStore(subscribe, () => said, () => said);
	const { visible } = shown(items);
	const [hover, setHover] = useState(false);
	const [focus, setFocus] = useState(false);
	const hidden = useSyncExternalStore(onVisibility, () => document.visibilityState === "hidden", () => false);
	const open = hover || focus;
	const [heights, setHeights] = useState<Record<string, number>>({});
	const back = useRef<HTMLElement | null>(null);
	// Closed toasts stay a moment to fade out
	const [leaving, setLeaving] = useState<ToastItem[]>([]);
	const prev = useRef<ToastItem[]>([]);
	useEffect(() => {
		const gone = prev.current.filter((t) => !items.some((x) => x.id === t.id));
		prev.current = visible;
		if (!gone.length) return;
		setLeaving((l) => [...l, ...gone]);
		const timer = setTimeout(() => setLeaving((l) => l.filter((t) => !gone.includes(t))), LEAVE_MS);
		return () => clearTimeout(timer);
	}, [visible, items]);
	// Nothing left to hover or focus: the stack folds again
	useEffect(() => {
		if (!items.length) {
			setHover(false);
			setFocus(false);
		}
	}, [items.length]);

	const top = position === "top-center";
	const frontH = heights[visible[0]?.id ?? ""] ?? 56;
	let y = 0;
	const layout = visible.map((t, i) => {
		const at = open ? y : i * PEEK;
		y += (heights[t.id] ?? 56) + GAP;
		return { t, i, at };
	});
	const height = visible.length ? (open ? y - GAP : frontH + PEEK * (visible.length - 1)) : 0;

	const onFocusIn = (e: FocusEvent<HTMLOListElement>) => {
		if (!focus && e.relatedTarget instanceof HTMLElement && !e.currentTarget.contains(e.relatedTarget)) back.current = e.relatedTarget;
		setFocus(true);
	};
	const onFocusOut = (e: FocusEvent<HTMLOListElement>) => {
		if (!(e.relatedTarget instanceof Node) || !e.currentTarget.contains(e.relatedTarget)) setFocus(false);
	};
	/** Closes one; from the keyboard, focus moves to the next toast, or back where it was after the last */
	const close = (id: string, from: HTMLElement | null) => {
		const rest = visible.filter((t) => t.id !== id);
		dismiss(id);
		if (!from) return;
		const next = rest[0] ? document.querySelector<HTMLElement>(`[data-toast-id="${rest[0].id}"]`) : null;
		if (next) next.focus();
		else back.current?.focus();
	};

	return (
		<section aria-label={label} className={cn("pointer-events-none fixed z-100 flex", PLACE[position], className)}>
			<span role="status" aria-live="polite" className="sr-only">{voice.polite}</span>
			<span role="alert" aria-live="assertive" className="sr-only">{voice.urgent}</span>
			<ol
				className={cn("relative w-full max-w-sm transition-[height] duration-200 ease-out-strong motion-reduce:transition-none", visible.length > 0 && "pointer-events-auto")}
				style={{ height }}
				onMouseEnter={() => setHover(true)}
				onMouseLeave={() => setHover(false)}
				onFocus={onFocusIn}
				onBlur={onFocusOut}
			>
				{layout.map(({ t, i, at }) => (
					<Card
						key={t.id}
						t={t}
						index={i}
						at={at}
						top={top}
						open={open}
						frontH={frontH}
						paused={open || hidden}
						onHeight={(h) => setHeights((m) => (m[t.id] === h ? m : { ...m, [t.id]: h }))}
						onClose={(from) => close(t.id, from)}
					/>
				))}
				{leaving.map((t) => (
					<li key={`leaving-${t.id}`} aria-hidden className={cn("pointer-events-none absolute inset-x-0 animate-out fade-out-0 duration-150 ease-in-strong fill-mode-forwards", top ? "top-0 motion-safe:slide-out-to-top-1" : "bottom-0 motion-safe:slide-out-to-bottom-1")}>
						<Face t={t} />
					</li>
				))}
			</ol>
		</section>
	);
}

/** One toast in the stack: placed, timed, swipeable, closable with Esc */
function Card({ t, index, at, top, open, frontH, paused, onHeight, onClose }: { t: ToastItem; index: number; at: number; top: boolean; open: boolean; frontH: number; paused: boolean; onHeight: (h: number) => void; onClose: (from: HTMLElement | null) => void }) {
	const ref = useRef<HTMLLIElement>(null);
	const face = useRef<HTMLDivElement>(null);
	const measure = useRef(onHeight);
	measure.current = onHeight;
	useLayoutEffect(() => {
		const el = face.current;
		if (!el) return;
		const ro = new ResizeObserver(() => measure.current(el.offsetHeight));
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	useTimer(t, paused, () => onClose(null));
	// Swipe sideways to close; a short swipe springs back
	const [dx, setDx] = useState(0);
	const [dragging, setDragging] = useState(false);
	const [flying, setFlying] = useState(0);
	const start = useRef(0);
	const down = (e: PointerEvent<HTMLLIElement>) => {
		if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
		start.current = e.clientX;
		setDragging(true);
		e.currentTarget.setPointerCapture(e.pointerId);
	};
	const move = (e: PointerEvent<HTMLLIElement>) => {
		if (dragging) setDx(e.clientX - start.current);
	};
	const up = () => {
		if (!dragging) return;
		setDragging(false);
		if (Math.abs(dx) > 64) {
			setFlying(Math.sign(dx));
			setTimeout(() => onClose(null), LEAVE_MS);
		} else setDx(0);
	};
	const key = (e: KeyboardEvent<HTMLLIElement>) => {
		if (e.key !== "Escape") return;
		e.stopPropagation();
		onClose(e.currentTarget);
	};
	const behind = !open && index > 0;
	const x = flying ? `${flying * 120}%` : `${dx}px`;
	return (
		<li
			ref={ref}
			data-toast-id={t.id}
			tabIndex={0}
			onKeyDown={key}
			onPointerDown={down}
			onPointerMove={move}
			onPointerUp={up}
			onPointerCancel={up}
			className={cn(
				"group absolute inset-x-0 touch-pan-y rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
				top ? "top-0 origin-bottom" : "bottom-0 origin-top",
				!dragging && "transition-[transform,opacity] duration-200 ease-out-strong motion-reduce:transition-none",
				"animate-in fade-in-0 duration-200",
				top ? "motion-safe:slide-in-from-top-2" : "motion-safe:slide-in-from-bottom-2",
			)}
			style={{ transform: `translate(${x}, ${top ? at : -at}px) scale(${open ? 1 : 1 - index * 0.05})`, zIndex: 10 - index, opacity: flying ? 0 : 1 }}
		>
			<Face t={t} innerRef={face} behind={behind} frontH={frontH} paused={paused} onClose={() => onClose(ref.current)} />
		</li>
	);
}

/** The card itself: icon, title, description, action, close, and the hairline that runs down with the timer */
function Face({ t, innerRef, behind, frontH, paused, onClose }: { t: ToastItem; innerRef?: Ref<HTMLDivElement>; behind?: boolean; frontH?: number; paused?: boolean; onClose?: () => void }) {
	const I = t.kind === "success" ? Check : t.kind === "error" ? CircleAlert : null;
	return (
		<div
			ref={innerRef}
			className="relative flex min-h-12 items-center overflow-hidden rounded-lg border bg-popover py-2 pr-1.5 pl-3 text-popover-foreground shadow-float"
			style={behind ? { height: frontH } : undefined}
		>
			<div className={cn("flex min-w-0 flex-1 items-center gap-2.5 transition-opacity duration-150", behind && "opacity-0")}>
				{I && <I className={cn("size-4 shrink-0", t.kind === "success" ? "text-success" : "text-destructive")} aria-hidden />}
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<Shimmer active={t.kind === "loading"} className="line-clamp-2 text-sm wrap-anywhere">{t.title}</Shimmer>
					{t.description && <span className="line-clamp-2 text-xs text-muted-foreground wrap-anywhere">{t.description}</span>}
				</div>
				{t.action && (
					<Button
						size="xs"
						variant="secondary"
						className="shrink-0"
						onClick={() => {
							let keep = false;
							t.action?.onClick({ preventDefault: () => { keep = true; } });
							if (!keep) onClose?.();
						}}
					>
						{t.action.label}
					</Button>
				)}
				{onClose && (
					<Button variant="ghost" size="icon-xs" className="shrink-0 text-muted-foreground pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100" onClick={onClose} aria-label="关闭">
						<X />
					</Button>
				)}
			</div>
			{Number.isFinite(t.duration) && !behind && (
				<span
					key={`${t.id}:${t.title}:${t.duration}`}
					aria-hidden
					className="absolute inset-x-3 bottom-0 h-px origin-left bg-foreground/20 motion-reduce:hidden"
					style={{ animation: `toast-time ${t.duration}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }}
				/>
			)}
		</div>
	);
}

/** Closes after the toast's duration; a pause keeps the time left. An update – a new item for the same id – starts over */
function useTimer(t: ToastItem, paused: boolean, done: () => void) {
	const left = useRef(t.duration);
	const since = useRef(0);
	const cb = useRef(done);
	cb.current = done;
	useEffect(() => {
		left.current = t.duration;
	}, [t]);
	useEffect(() => {
		if (paused || !Number.isFinite(left.current)) return;
		since.current = Date.now();
		const timer = setTimeout(() => cb.current(), left.current);
		return () => {
			clearTimeout(timer);
			left.current -= Date.now() - since.current;
		};
	}, [paused, t]);
}
