// Outline: a long scroll's table of contents as a column of ticks on its right edge – one tick per item (a message, a section, a story),
// evenly spaced in order, the ones in view long and dark so you know where you are. It never pushes the content aside.
// Desktop: hover the ticks for the whole list (a popover that doesn't steal focus), click a tick or a line to jump.
// Phone: hold the ticks and drag – the item under your finger floats beside it, let go to jump (drag left first to cancel); a tap opens the list as a sheet.
// Keyboard: focus the ticks, ↑ ↓ jump to the previous or next item, Enter opens the list.
// The host says what's in view (useInView, or its own reckoning) and does the jump.
import { type KeyboardEvent, type PointerEvent, type RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Popsheet } from "./popsheet.tsx";
import { indexAt, inView, marks, PAD, pitchOf } from "../lib/outline.ts";
import { cn } from "../lib/utils.ts";

export type OutlineItem = { id: string; label: string };
/** The items in view: a through b */
export type OutlineView = { a: number; b: number };

/** A finger held still this long (ms) also starts a drag: the item floats, letting go jumps */
const HOLD = 300;
/** Dragged this far (px) left of the ticks, letting go doesn't jump */
const AWAY = 48;

/**
 * What's in view in a scroll box, and whether it scrolls at all: targets are the items' elements, in order.
 * For an outline whose items are elements; a host with its own idea of an item (a conversation's turns) reckons its own
 */
export function useInView(scroller: RefObject<HTMLElement | null>, targets: () => HTMLElement[], deps: unknown[] = []) {
	const [view, setView] = useState<OutlineView | null>(null);
	const [long, setLong] = useState(false);
	const get = useRef(targets);
	get.current = targets;
	useEffect(() => {
		const el = scroller.current;
		if (!el) return;
		let raf = 0;
		const measure = () => {
			raf = 0;
			setLong(el.scrollHeight > el.clientHeight + 1);
			const r = el.getBoundingClientRect();
			const v = inView(get.current().map((t) => t.getBoundingClientRect().top), r);
			setView((o) => (o?.a === v?.a && o?.b === v?.b ? o : v));
		};
		const later = () => { if (!raf) raf = requestAnimationFrame(measure); };
		later();
		el.addEventListener("scroll", later, { passive: true });
		const ro = new ResizeObserver(later);
		ro.observe(el);
		for (const c of el.children) ro.observe(c);
		return () => {
			cancelAnimationFrame(raf);
			el.removeEventListener("scroll", later);
			ro.disconnect();
		};
	}, [scroller, ...deps]);
	return { view, long };
}

type OutlineProps = {
	items: OutlineItem[];
	view: OutlineView | null;
	onJump: (index: number) => void;
	/** Names the ticks and the list: 「目录」 */
	title: string;
	/** Under the list's title: 「你的 12 条消息」 */
	description?: string;
	/** The wheel over the ticks scrolls this – they sit outside it */
	scroller?: RefObject<HTMLElement | null>;
	/** Numbers before each line of the list */
	numbered?: boolean;
	/** Where the column goes: absolute, its full height – the ticks center in it */
	className?: string;
};

function Outline({ items, view, onJump, title, description, scroller, numbered = true, className }: OutlineProps) {
	const n = items.length;
	// How tall the ticks may be: the column's height
	const box = useRef<HTMLDivElement>(null);
	const [room, setRoom] = useState(0);
	useLayoutEffect(() => {
		const el = box.current;
		if (!el) return;
		const ro = new ResizeObserver(() => setRoom(el.clientHeight));
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	const [coarse] = useState(() => typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches);
	const pitch = pitchOf(n, room, coarse);

	const rail = useRef<HTMLButtonElement>(null);
	// The pointed tick or line; from – the ticks (the list follows) or a line in the list
	const [pointed, setPointed] = useState<{ i: number; from: "rail" | "list" } | null>(null);
	// A finger dragging: where the floating item sits (y, from the column's top), dragged away to cancel
	const [drag, setDrag] = useState<{ y: number; away: boolean } | null>(null);
	const touch = useRef<{ id: number; x: number; y: number; on: boolean; timer: ReturnType<typeof setTimeout> } | null>(null);
	const last = useRef<{ i: number; away: boolean } | null>(null);
	// What pressed last: a mouse click on the ticks jumps; a tap or a key opens the list
	const kind = useRef("");
	// Opened by keyboard: focus moves into the list. Opened by hover or tap: focus stays (someone may be typing)
	const byKey = useRef(false);
	// After a drag, the click the browser adds on release isn't a tap
	const swallow = useRef(false);
	const [said, setSaid] = useState("");
	// The item last jumped to: ↑ ↓ go on from it while it's in view (at the end of a scroll the view can't reach it)
	const cursor = useRef<number | null>(null);

	const [open, setOpen] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	useEffect(() => () => clearTimeout(timer.current), []);
	const openChange = (o: boolean) => {
		setOpen(o);
		// The line under the pointer when the list closes stops being lit
		if (!o) setPointed((p) => (p?.from === "list" ? null : p));
	};
	// Hover the ticks a moment to open; leave both the ticks and the list a moment to close
	const toggleLater = (o: boolean, ms: number) => {
		clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			if (o) byKey.current = false;
			openChange(o);
		}, ms);
	};
	const enter = (e: PointerEvent) => { if (e.pointerType === "mouse") toggleLater(true, open ? 0 : 150); };
	const leave = (e: PointerEvent) => { if (e.pointerType === "mouse") toggleLater(false, 200); };

	const at = (y: number) => indexAt(y - (rail.current?.getBoundingClientRect().top ?? 0), pitch, n);
	const jump = (i: number) => {
		const it = items[i];
		if (!it) return;
		clearTimeout(timer.current);
		setOpen(false);
		setPointed(null);
		// Say the first line only, clipped – a long message read out whole would drown the jump
		const line = it.label.trim().split("\n")[0] ?? "";
		setSaid(`${numbered ? `第 ${i + 1} 条：` : ""}${line.length > 80 ? `${line.slice(0, 80)}…` : line}`);
		cursor.current = i;
		onJump(i);
	};
	/** A finger at (x, y): point that tick, float that item */
	const follow = (x: number, y: number) => {
		const r = rail.current?.getBoundingClientRect();
		const top = box.current?.getBoundingClientRect().top ?? 0;
		const i = at(y);
		const away = !!r && x < r.left - AWAY;
		last.current = { i, away };
		setPointed({ i, from: "rail" });
		setDrag({ y: y - top, away });
	};
	const end = () => {
		const t = touch.current;
		if (t) clearTimeout(t.timer);
		touch.current = null;
		last.current = null;
		setDrag(null);
		setPointed(null);
	};

	const down = (e: PointerEvent<HTMLButtonElement>) => {
		kind.current = e.pointerType;
		swallow.current = false;
		if (e.pointerType === "mouse") return;
		e.currentTarget.setPointerCapture(e.pointerId);
		const { clientX: x, clientY: y } = e;
		const t = { id: e.pointerId, x, y, on: false, timer: setTimeout(() => {
			if (touch.current !== t) return;
			t.on = true;
			follow(x, y);
		}, HOLD) };
		touch.current = t;
	};
	const move = (e: PointerEvent<HTMLButtonElement>) => {
		if (e.pointerType === "mouse") {
			const i = at(e.clientY);
			return setPointed((p) => (p?.i === i && p.from === "rail" ? p : { i, from: "rail" }));
		}
		const t = touch.current;
		if (!t || t.id !== e.pointerId) return;
		if (!t.on) {
			const dx = e.clientX - t.x;
			const dy = e.clientY - t.y;
			// Sideways: someone's swiping something else
			if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) return end();
			if (Math.abs(dy) < 4) return;
			clearTimeout(t.timer);
			t.on = true;
		}
		follow(e.clientX, e.clientY);
	};
	const up = (e: PointerEvent<HTMLButtonElement>) => {
		const t = touch.current;
		if (!t || t.id !== e.pointerId) return;
		const l = last.current;
		if (t.on) {
			swallow.current = true;
			if (l && !l.away) jump(l.i);
		}
		end();
	};
	// ↑ ↓ on the ticks: the previous or next item from the one in view
	const key = (e: KeyboardEvent<HTMLButtonElement>) => {
		const here = where() ?? -1;
		const i = e.key === "ArrowDown" ? here + 1 : e.key === "ArrowUp" ? here - 1 : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
		if (i === null) return;
		e.preventDefault();
		jump(Math.max(0, Math.min(n - 1, i)));
	};

	const lit = (i: number) => !!view && i >= view.a && i <= view.b;
	// Where you are: the item last jumped to while it's in view, else the first in view
	const where = () => (cursor.current !== null && lit(cursor.current) ? cursor.current : (view?.a ?? null));
	// A line in the list counts as pointed only while the list is open (closing, lines slide under the pointer)
	const hot = pointed?.from === "list" && !open ? null : pointed;
	// The floating item sits above-left of the finger; near the top, below-left
	const above = !!drag && drag.y > 72;
	if (n < 1) return null;
	return (
		// The column takes the full height the ticks may use (no pointer), the ticks center in it
		<div ref={box} data-slot="outline" className={cn("pointer-events-none flex items-center", className)}>
			<span role="status" className="sr-only">{said}</span>
			<Popsheet
				title={title}
				description={description}
				side="left"
				open={open}
				onOpenChange={openChange}
				className="max-h-[min(32rem,70vh)] w-80"
				contentProps={{
					onPointerEnter: enter,
					onPointerLeave: leave,
					// The list focuses where you are itself (opened by keyboard), not its first line
					onOpenAutoFocus: (e) => e.preventDefault(),
					onCloseAutoFocus: (e) => { if (!byKey.current) e.preventDefault(); },
				}}
				trigger={
					<button
						ref={rail}
						type="button"
						aria-label={description ? `${title}：${description}` : title}
						aria-keyshortcuts="ArrowUp ArrowDown"
						className="pointer-events-auto relative w-6 touch-none rounded-md outline-hidden select-none focus-visible:ring-2 focus-visible:ring-ring"
						style={{ height: n * pitch + 2 * PAD }}
						onPointerEnter={enter}
						onPointerLeave={(e) => {
							leave(e);
							if (e.pointerType === "mouse") setPointed(null);
						}}
						onPointerDown={down}
						onPointerMove={move}
						onPointerUp={up}
						onPointerCancel={end}
						onKeyDown={key}
						onWheel={(e) => scroller?.current?.scrollBy({ top: e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY })}
						onClick={(e) => {
							if (swallow.current) {
								swallow.current = false;
								return e.preventDefault();
							}
							// A mouse click jumps to the tick under it, without opening the list; a tap or a key (detail 0) opens it
							if (e.detail !== 0 && kind.current === "mouse") {
								e.preventDefault();
								return jump(at(e.clientY));
							}
							byKey.current = e.detail === 0;
						}}
					>
						{marks(n, pitch, lit, hot?.i ?? null).map((i) => (
							<span
								key={items[i]?.id ?? i}
								className={cn(
									"absolute right-1 h-0.5 -translate-y-1/2 rounded-full transition-[width,background-color] duration-150 motion-reduce:transition-none",
									hot?.i === i ? "w-5 bg-foreground" : lit(i) ? "w-4 bg-muted-foreground" : "w-1.5 bg-muted-foreground/40",
								)}
								style={{ top: PAD + (i + 0.5) * pitch }}
							/>
						))}
					</button>
				}
			>
				<List items={items} numbered={numbered} lit={lit} current={where()} focus={byKey.current} pointed={hot} onPoint={setPointed} onPick={jump} />
			</Popsheet>
			{/* A finger dragging: the item floats above-left of it, clear of the thumb */}
			{drag && pointed && (
				<div
					className={cn("pointer-events-none absolute right-full mr-2 w-max max-w-[min(18rem,calc(100vw-4rem))] rounded-lg bg-popover px-3 py-2 text-md text-popover-foreground shadow-float ring-1 ring-foreground/10", above && "-translate-y-full")}
					style={{ top: above ? drag.y - 8 : drag.y + 28 }}
				>
					{drag.away ? (
						<span className="text-muted-foreground">松开取消跳转</span>
					) : (
						<span className="flex gap-2">
							{numbered && <span className="shrink-0 pt-px text-2xs text-muted-foreground tabular-nums">{pointed.i + 1}</span>}
							<span className="line-clamp-3 min-w-0 break-words">{items[pointed.i]?.label}</span>
						</span>
					)}
				</div>
			)}
		</div>
	);
}

/** The whole list: lines in view are dark, the pointed one lit and scrolled into view; on opening it scrolls to where you are (and focuses it, opened by keyboard). ↑ ↓ Home End move focus */
function List({ items, numbered, lit, current, focus, pointed, onPoint, onPick }: { items: OutlineItem[]; numbered: boolean; lit: (i: number) => boolean; current: number | null; focus: boolean; pointed: { i: number; from: "rail" | "list" } | null; onPoint: (p: { i: number; from: "list" } | null) => void; onPick: (i: number) => void }) {
	const nav = useRef<HTMLElement>(null);
	const item = (i: number) => nav.current?.children[i] as HTMLElement | undefined;
	// Once, on opening: scroll to where you are; opened by keyboard, focus it
	useLayoutEffect(() => {
		const el = item(current ?? 0);
		el?.scrollIntoView({ block: "center" });
		if (focus) el?.focus();
	}, []);
	const follow = pointed?.from === "rail" ? pointed.i : null;
	useEffect(() => {
		if (follow !== null) item(follow)?.scrollIntoView({ block: "nearest" });
	}, [follow]);
	const key = (e: KeyboardEvent<HTMLElement>) => {
		const all = [...(nav.current?.children ?? [])] as HTMLElement[];
		const i = all.indexOf(document.activeElement as HTMLElement);
		const to = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : null;
		if (to === null) return;
		e.preventDefault();
		all[Math.max(0, Math.min(all.length - 1, to))]?.focus();
	};
	return (
		<nav ref={nav} onKeyDown={key} className="-mx-1 flex flex-col gap-0.5" onPointerLeave={(e) => e.pointerType === "mouse" && onPoint(null)}>
			{items.map((it, i) => (
				<button
					key={it.id}
					type="button"
					aria-current={current === i ? "location" : undefined}
					onClick={() => onPick(i)}
					onPointerEnter={(e) => e.pointerType === "mouse" && onPoint({ i, from: "list" })}
					className={cn(
						"flex gap-2.5 rounded-md px-2 py-2.5 text-left text-md outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:bg-accent md:py-1.5",
						pointed?.i === i && "bg-accent",
						lit(i) ? "text-foreground" : "text-muted-foreground",
					)}
				>
					{numbered && <span className="w-5 shrink-0 pt-px text-right text-2xs text-muted-foreground tabular-nums">{i + 1}</span>}
					<span className="line-clamp-2 min-w-0 flex-1 leading-snug break-words">{it.label}</span>
				</button>
			))}
		</nav>
	);
}

export { Outline };
