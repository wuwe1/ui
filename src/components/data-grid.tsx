// DataGrid: many records with the same fields, read only – thousands of rows scroll smoothly, and a person picks rows, a block of cells
// or whole columns to hand on. Drawn in the DOM, not on a canvas: tokens follow the block's mode, cells hold real words and the library's
// marks, and the selection is ours – ids and column keys, the shape a host turns into a reference. Only the rows on screen render, each row
// a fixed height; the checkbox column, the header row and the first column stay put. Props in, callbacks out – the logic lives in lib/data-grid.ts.
import { Check, Minus } from "lucide-react";
import {
	type ClipboardEvent,
	type KeyboardEvent,
	type MouseEvent,
	type PointerEvent,
	type RefObject,
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { Chevron, Placeholder } from "./placeholder.tsx";
import { Skeleton } from "./skeleton.tsx";
import {
	boxOf,
	type Cell,
	checkAll,
	clear,
	clickCell,
	colAt,
	type DataGridColumn,
	type DataGridGroup,
	type DataGridRow,
	type DataGridSelection,
	type DataGridTone,
	dragTo,
	fromSelection,
	GROUP_HEIGHT,
	type GridState,
	HEADER_HEIGHT,
	indexOf,
	keyOf,
	layout,
	lineAt,
	linesOf,
	MARKER_WIDTH,
	type Move,
	move,
	NONE,
	offsetsOf,
	paintOf,
	paintRows,
	pickColumn,
	ROW_HEIGHT,
	rowLineAt,
	saidOf,
	tagsOf,
	textOf,
	THUMBS,
	thumbOf,
	toggleAll,
	toggleRow,
	toggleRows,
	toSelection,
	tsv,
	urlsOf,
	visible,
	widthOf,
} from "../lib/data-grid.ts";
import { cn } from "../lib/utils.ts";

export type { DataGridColumn, DataGridGroup, DataGridRow, DataGridSelection, DataGridTone, DataGridType } from "../lib/data-grid.ts";

type DataGridProps = {
	/** The grid's accessible name */
	label: string;
	/** In display order; the first is the record's name and stays on the left */
	columns: DataGridColumn[];
	/** null – loading */
	rows: DataGridRow[] | null;
	group?: DataGridGroup;
	/** Group values folded at first */
	defaultCollapsed?: string[];
	/** 32, 40 or 56px; md with an image column, else sm. A finger gets 44 */
	rowHeight?: keyof typeof ROW_HEIGHT;
	/** Controlled: what is selected. Leave it out and the grid keeps its own */
	selection?: DataGridSelection;
	/** After each click or key; a drag, once when it ends */
	onSelectionChange?: (s: DataGridSelection) => void;
	/** 「打开」, Enter, double-click. Without it 「打开」 doesn't show */
	onOpen?: (id: string) => void;
	/** ⌘-click a link (Ctrl on Windows), or ⌘Enter on it */
	onLink?: (url: string, row: DataGridRow) => void;
	/** The line when there are no rows */
	empty?: string;
	className?: string;
};

/** The cells' type size, and what widths are measured in */
const FONT = 13;
const NO_ROWS: DataGridRow[] = [];
/** Tints mixed into the card – opaque, so cells that stay put over others hide what scrolls under them */
const TINTS =
	"[--grid-hover:color-mix(in_oklab,var(--color-foreground)_4%,var(--color-card))] [--grid-checked:color-mix(in_oklab,var(--color-primary)_8%,var(--color-card))] [--grid-picked:color-mix(in_oklab,var(--color-primary)_14%,var(--color-card))]";
/** A cell's ground, one variable per state: 「打开」's fade reads it too */
const GROUND = {
	plain: "[--cell-bg:var(--color-card)] group-hover/row:[--cell-bg:var(--grid-hover)]",
	checked: "[--cell-bg:var(--grid-checked)]",
	picked: "[--cell-bg:var(--grid-picked)]",
};
const RING = "var(--color-primary)";
const MOVES: Record<string, Move> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", Home: "home", End: "end", PageUp: "pageUp", PageDown: "pageDown" };
const TONE: Record<DataGridTone, string> = { waiting: "bg-waiting", running: "bg-unread", done: "bg-success", error: "bg-destructive" };
/** A drag scrolls once the pointer is this close to an edge, at most this many px a frame */
const EDGE = 28;
const SPEED = 24;
/** On a narrow card the first column gives up room: at most this share of the width */
const NARROW = 600;
const FIRST_SHARE = 0.4;
/** The smallest a tap hits: rows, headers and the checkbox column on touch */
const TOUCH = 44;
/** Skeleton rows while loading, and their bars' widths */
const BARS = [62, 48, 74, 55, 68, 44];

let canvas: HTMLCanvasElement | null = null;

/** Text widths in the cells' font – a canvas measures without layout; fonts that arrive late measure again */
function useMeasure(ref: RefObject<HTMLElement | null>) {
	const [font, setFont] = useState(`${FONT}px sans-serif`);
	const [loaded, setLoaded] = useState(0);
	useLayoutEffect(() => {
		if (ref.current) setFont(`${FONT}px ${getComputedStyle(ref.current).fontFamily}`);
		let on = true;
		document.fonts?.ready.then(() => on && setLoaded((n) => n + 1));
		return () => {
			on = false;
		};
	}, [ref]);
	return useMemo(() => {
		canvas ??= document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		return (s: string) => {
			if (!ctx) return s.length * FONT;
			ctx.font = font;
			return ctx.measureText(s).width;
		};
	}, [font, loaded]);
}

const coarse = typeof matchMedia === "function" ? matchMedia("(pointer: coarse)") : null;
/** A finger: rows, headers and the checkbox column grow to 44px */
function useCoarse() {
	return useSyncExternalStore(
		(fn) => {
			coarse?.addEventListener("change", fn);
			return () => coarse?.removeEventListener("change", fn);
		},
		() => coarse?.matches ?? false,
		() => false,
	);
}

/**
 * A box in the checkbox column – a row's, a group's, the header's. The whole cell takes the press. A row's box checks on the press,
 * so a drag from it checks the rows it passes (onPress); a click with no pointer behind it – a screen reader's, detail 0 – toggles it
 */
function Box({ checked, label, onPress, onToggle }: { checked: boolean | "mixed"; label: string; onPress?: (e: PointerEvent<HTMLButtonElement>) => void; onToggle: (shift: boolean) => void }) {
	const on = checked !== false;
	return (
		<button
			type="button"
			role="checkbox"
			aria-checked={checked}
			aria-label={label}
			tabIndex={-1}
			data-grid-skip=""
			onMouseDown={(e) => e.preventDefault()}
			onPointerDown={(e) => {
				if (e.button === 0) onPress?.(e);
			}}
			onClick={(e) => {
				if (!onPress || e.detail === 0) onToggle(e.shiftKey);
			}}
			className={cn("grid size-full place-items-center outline-none", onPress && "touch-none")}
		>
			<span className={cn("grid size-4 place-items-center rounded-[4px] border", on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card")}>
				{checked === "mixed" ? <Minus className="size-3" aria-hidden /> : checked ? <Check className="size-3" aria-hidden /> : null}
			</span>
		</button>
	);
}

type Drag = { x: number; y: number; raf: number; mode: { kind: "cells" } | { kind: "rows"; base: string[]; from: string; on: boolean } };

function DataGrid({ label, columns, rows, group, defaultCollapsed, rowHeight, selection, onSelectionChange, onOpen, onLink, empty = "暂无记录", className }: DataGridProps) {
	const uid = useId();
	const root = useRef<HTMLDivElement>(null);
	const scroller = useRef<HTMLDivElement>(null);
	const list = rows ?? NO_ROWS;
	const touch = useCoarse();
	const MARKER = touch ? TOUCH : MARKER_WIDTH;
	const headerH = touch ? TOUCH : HEADER_HEIGHT;
	const groupH = touch ? TOUCH : GROUP_HEIGHT;
	const rh = Math.max(touch ? TOUCH : 0, ROW_HEIGHT[rowHeight ?? (columns.some((c) => c.type === "image") ? "md" : "sm")]);
	// The label function is read when rows, the key or the folds change – an inline one doesn't regroup on every render
	const groupLabel = useRef(group?.label);
	groupLabel.current = group?.label;
	const groupKey = group?.key;
	const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set(defaultCollapsed));
	const lines = useMemo(() => linesOf(list, groupKey ? { key: groupKey, label: groupLabel.current } : undefined, collapsed), [list, groupKey, collapsed]);
	const ix = useMemo(() => indexOf(lines, columns, list), [lines, columns, list]);
	const groupNo = useMemo(() => new Map(lines.flatMap((l) => (l.kind === "group" ? [l.label] : [])).map((g, n) => [g, n])), [lines]);
	const { tops, total } = useMemo(() => layout(lines, rh, groupH), [lines, rh, groupH]);
	const [view, setView] = useState({ width: 0, height: 0 });
	const measure = useMeasure(root);
	const measured = useMemo(() => columns.map((c) => widthOf(c, list, measure, rh)), [columns, list, measure, rh]);
	const widths = useMemo(() => {
		const cap = view.width && view.width < NARROW ? Math.max(96, Math.round(view.width * FIRST_SHARE)) : Number.POSITIVE_INFINITY;
		return measured.map((w, i) => (i === 0 ? Math.min(w, cap) : w));
	}, [measured, view.width]);
	const offsets = useMemo(() => offsetsOf(widths), [widths]);
	const width = MARKER + widths.reduce((a, b) => a + b, 0);
	const frozen = MARKER + (widths[0] ?? 0);

	const [state, setState] = useState<GridState>(NONE);
	const [range, setRange] = useState<[number, number]>([0, 0]);
	const [said, setSaid] = useState("");
	/** Keys in use: the active cell or group header shows its ring. A pointer turns it off */
	const [keys, setKeys] = useState(false);
	const [focused, setFocused] = useState(false);
	/** The selection the host last heard from the grid, or passed in – what comes back equal isn't applied again */
	const sent = useRef<string | null>(null);
	const pointer = useRef("mouse");
	const drag = useRef<Drag | null>(null);
	const copied = useRef(false);
	// What the window's pointer listeners read: they're made once, the render moves on
	const live = useRef({ state, ix, lines, tops, widths, offsets, frozen, headerH, onSelectionChange });
	live.current = { ...live.current, ix, lines, tops, widths, offsets, frozen, headerH, onSelectionChange };

	const set = (next: GridState) => {
		live.current.state = next;
		setState(next);
	};
	const emit = (next: GridState) => {
		const pub = toSelection(next.sel, live.current.ix);
		const k = keyOf(pub);
		if (k === sent.current) return;
		sent.current = k;
		live.current.onSelectionChange?.(pub);
		setSaid(saidOf(pub, live.current.ix.allIds.length));
	};
	const commit = (next: GridState) => {
		set(next);
		emit(next);
	};
	const focusGrid = () => {
		scroller.current?.focus({ preventScroll: true });
		setKeys(false);
	};

	/** The body's y under a viewport y: negative over the header row */
	const bodyY = (y: number) => {
		const el = scroller.current;
		return el ? y - el.getBoundingClientRect().top - live.current.headerH + el.scrollTop : -1;
	};
	/** The row under a viewport y, clamped to the rows on screen – a group header gives the row after it */
	const rowAt = (y: number): string | null => {
		const g = live.current;
		const l = g.lines[rowLineAt(g.lines, g.tops, bodyY(y))];
		return l?.kind === "row" ? l.row.id : null;
	};
	/** The cell under a point, or null off the rows. A drag clamps – above the rows is the first one */
	const cellAt = (x: number, y: number, clamp = false): Cell | null => {
		const el = scroller.current;
		const g = live.current;
		if (!el || !g.ix.ids.length) return null;
		const by = bodyY(y);
		if (!clamp && (by < 0 || g.lines[lineAt(g.tops, by)]?.kind !== "row")) return null;
		const id = rowAt(y);
		if (!id) return null;
		const vx = x - el.getBoundingClientRect().left;
		const c = colAt(g.offsets, g.widths, Math.max(0, (vx < g.frozen ? vx : vx + el.scrollLeft) - MARKER));
		return { row: id, col: g.ix.columns[c]! };
	};
	const api = useRef<{ cellAt: typeof cellAt; rowAt: typeof rowAt; set: typeof set; emit: typeof emit; update: () => void } | null>(null);

	// Drags: a block of cells, or rows checked down the boxes. The window's listeners follow the pointer past the card; near an edge the grid scrolls
	const [dragging] = useState(() => {
		const extend = (x: number, y: number) => {
			const d = drag.current;
			const s = live.current.state;
			if (!d) return;
			if (d.mode.kind === "rows") {
				const id = api.current?.rowAt(y);
				if (id) api.current?.set(paintRows(d.mode.base, d.mode.from, id, d.mode.on, live.current.ix, s));
				return;
			}
			const cell = api.current?.cellAt(x, y, true);
			if (cell && !(s.sel.kind === "block" && s.sel.head.row === cell.row && s.sel.head.col === cell.col)) api.current?.set(dragTo(s, cell));
		};
		const onMove = (e: globalThis.PointerEvent) => {
			const d = drag.current;
			if (!d) return;
			d.x = e.clientX;
			d.y = e.clientY;
			extend(d.x, d.y);
		};
		const tick = () => {
			const d = drag.current;
			const el = scroller.current;
			if (!d || !el) return;
			const r = el.getBoundingClientRect();
			const top = r.top + live.current.headerH + EDGE;
			const left = r.left + live.current.frozen + EDGE;
			const dy = d.y < top ? d.y - top : d.y > r.bottom - EDGE ? d.y - (r.bottom - EDGE) : 0;
			const dx = d.mode.kind === "rows" ? 0 : d.x < left ? d.x - left : d.x > r.right - EDGE ? d.x - (r.right - EDGE) : 0;
			if (dy || dx) {
				el.scrollTop += Math.max(-SPEED, Math.min(SPEED, dy / 2));
				el.scrollLeft += Math.max(-SPEED, Math.min(SPEED, dx / 2));
				extend(d.x, d.y);
			}
			d.raf = requestAnimationFrame(tick);
		};
		const end = () => {
			const d = drag.current;
			if (!d) return;
			cancelAnimationFrame(d.raf);
			drag.current = null;
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", end);
			window.removeEventListener("pointercancel", end);
			api.current?.emit(live.current.state);
		};
		const start = (x: number, y: number, mode: Drag["mode"]) => {
			drag.current = { x, y, raf: requestAnimationFrame(tick), mode };
			window.addEventListener("pointermove", onMove);
			window.addEventListener("pointerup", end);
			window.addEventListener("pointercancel", end);
		};
		return { start, end };
	});
	useEffect(() => dragging.end, [dragging]);

	// The rows on screen: after layout changes, on scroll, when the card resizes
	const update = () => {
		const el = scroller.current;
		if (!el) return;
		const [a, b] = visible(live.current.tops, el.scrollTop, Math.max(0, el.clientHeight - live.current.headerH));
		setRange((r) => (r[0] === a && r[1] === b ? r : [a, b]));
	};
	// The scroller mounts once rows arrive: measure then too
	useLayoutEffect(update, [tops, rows === null, list.length === 0]);
	useLayoutEffect(() => {
		const el = root.current;
		if (!el) return;
		const ro = new ResizeObserver(() => {
			setView((v) => (v.width === el.clientWidth && v.height === el.clientHeight ? v : { width: el.clientWidth, height: el.clientHeight }));
			api.current?.update();
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	api.current = { cellAt, rowAt, set, emit, update };

	/** Scroll a line into view under the header; center puts it mid-screen when it's out of view */
	const revealLine = (line: number, center = false) => {
		const el = scroller.current;
		if (!el) return;
		const top = tops[line] ?? 0;
		const h = lines[line]?.kind === "group" ? groupH : rh;
		const room = el.clientHeight - headerH;
		const out = top < el.scrollTop || top + h > el.scrollTop + room;
		if (center) {
			if (out) el.scrollTop = Math.max(0, top - room / 2 + h / 2);
		} else if (top < el.scrollTop) el.scrollTop = top;
		else if (top + h > el.scrollTop + room) el.scrollTop = top + h - room;
	};
	/** Scroll where the keys are into view – a group header, or a cell past the columns that stay put */
	const reveal = (s: GridState) => {
		const el = scroller.current;
		if (!el) return;
		const line = s.group !== null ? ix.stopOf.get(`g:${s.group}`) : s.active ? ix.stopOf.get(`r:${s.active.row}`) : undefined;
		if (line === undefined) return;
		revealLine(line);
		const c = s.group === null && s.active ? ix.colOf.get(s.active.col) : undefined;
		if (!c) return;
		const x0 = MARKER + offsets[c]!;
		const x1 = x0 + widths[c]!;
		if (x0 < el.scrollLeft + frozen) el.scrollLeft = x0 - frozen;
		else if (x1 > el.scrollLeft + el.clientWidth) el.scrollLeft = x1 - el.clientWidth;
	};

	// The host's selection: applied when it differs from what the grid last sent; it waits for rows to land
	useEffect(() => {
		if (selection === undefined) return;
		const k = keyOf(selection);
		if (k === sent.current || (selection && !ix.allIds.length)) return;
		sent.current = k;
		const next = fromSelection(selection, ix);
		set(next);
		const line = next.active ? ix.stopOf.get(`r:${next.active.row}`) : undefined;
		if (line !== undefined) revealLine(line, true);
	}, [selection, ix]);

	/** Fold or unfold a group: given a side, to it; else the other way */
	const fold = (g: string, shut?: boolean) =>
		setCollapsed((c) => {
			const next = new Set(c);
			if (shut ?? !c.has(g)) next.add(g);
			else next.delete(g);
			return next;
		});

	const rowById = (id: string) => {
		const l = lines[ix.stopOf.get(`r:${id}`) ?? -1];
		return l?.kind === "row" ? l.row : undefined;
	};
	const linkOf = (cell: Cell) => {
		const c = columns[ix.colOf.get(cell.col) ?? -1];
		const row = rowById(cell.row);
		const url = c?.type === "link" && row ? row[c.key] : null;
		return typeof url === "string" && url && row ? { url, row } : null;
	};

	/** A row's box pressed: checks or unchecks it, and a drag from here takes the rows it passes the same way. Shift checks the rows between */
	const pressBox = (e: PointerEvent<HTMLButtonElement>, id: string) => {
		focusGrid();
		const s = live.current.state;
		if (e.shiftKey) {
			commit(toggleRow(s, id, ix, true));
			return;
		}
		const base = s.sel.kind === "rows" ? s.sel.ids : [];
		const on = !base.includes(id);
		set(paintRows(base, id, id, on, ix, s));
		dragging.start(e.clientX, e.clientY, { kind: "rows", base, from: id, on });
	};
	const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
		pointer.current = e.pointerType;
		if (e.button !== 0 || (e.target as HTMLElement).closest("[data-grid-skip]")) return;
		setKeys(false);
		// Touch and pen: a tap selects on click, a drag scrolls
		if (e.pointerType !== "mouse") return;
		const cell = cellAt(e.clientX, e.clientY);
		if (!cell) return;
		scroller.current?.focus({ preventScroll: true });
		// ⌘-click on a link opens it on click; the selection stays
		if ((e.metaKey || e.ctrlKey) && linkOf(cell)) return;
		e.preventDefault();
		set(clickCell(live.current.state, cell, e.shiftKey));
		dragging.start(e.clientX, e.clientY, { kind: "cells" });
	};
	const onClick = (e: MouseEvent<HTMLDivElement>) => {
		if ((e.target as HTMLElement).closest("[data-grid-skip]")) return;
		const cell = cellAt(e.clientX, e.clientY);
		if (!cell) return;
		const link = linkOf(cell);
		if ((e.metaKey || e.ctrlKey) && link) {
			onLink?.(link.url, link.row);
			return;
		}
		if (pointer.current !== "mouse") commit(clickCell(live.current.state, cell, e.shiftKey));
	};
	const onDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
		if ((e.target as HTMLElement).closest("[data-grid-skip]")) return;
		const cell = cellAt(e.clientX, e.clientY);
		if (cell) onOpen?.(cell.row);
	};

	const copyable = () => {
		const pub = toSelection(state.sel, ix) ?? (state.active && state.group === null ? { rows: [state.active.row], columns: [state.active.col] } : null);
		return pub ? { pub, text: tsv(pub, list, columns) } : null;
	};
	const onCopy = (e: ClipboardEvent<HTMLDivElement>) => {
		const c = copyable();
		if (!c) return;
		e.preventDefault();
		e.clipboardData.setData("text/plain", c.text);
		copied.current = true;
		setSaid(`已复制 ${c.pub.rows.length} 行`);
	};
	const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		const meta = e.metaKey || e.ctrlKey;
		const k = e.key;
		// On a group header: left folds, right unfolds, Enter switches, Space checks its rows
		if (state.group !== null && !meta && (k === "ArrowLeft" || k === "ArrowRight" || k === "Enter" || k === " ")) {
			e.preventDefault();
			setKeys(true);
			const g = state.group;
			if (k === " ") commit(toggleRows(state, ix.groups.get(g) ?? [], ix));
			else fold(g, k === "ArrowLeft" ? true : k === "ArrowRight" ? false : undefined);
			return;
		}
		const to = MOVES[k];
		if (to) {
			e.preventDefault();
			setKeys(true);
			const el = scroller.current;
			const page = el ? Math.max(1, Math.floor((el.clientHeight - headerH) / rh) - 1) : 10;
			const next = move(state, to, ix, { shift: e.shiftKey, meta, page });
			commit(next);
			reveal(next);
			return;
		}
		if (meta && k.toLowerCase() === "a") {
			e.preventDefault();
			commit(checkAll(state, ix));
			return;
		}
		if (meta && k.toLowerCase() === "c") {
			// Safari fires no copy event with nothing selected as text: write it ourselves when the event didn't come
			copied.current = false;
			const c = copyable();
			setTimeout(() => {
				if (copied.current || !c) return;
				navigator.clipboard
					?.writeText(c.text)
					.then(() => setSaid(`已复制 ${c.pub.rows.length} 行`))
					.catch(() => {});
			}, 0);
			return;
		}
		if (k === " " && state.active) {
			e.preventDefault();
			setKeys(true);
			commit(toggleRow(state, state.active.row, ix, e.shiftKey));
			return;
		}
		if (k === "Enter" && state.active) {
			const link = meta ? linkOf(state.active) : null;
			if (link) {
				e.preventDefault();
				onLink?.(link.url, link.row);
			} else if (onOpen) {
				e.preventDefault();
				onOpen(state.active.row);
			}
			return;
		}
		if (k === "Escape" && state.sel.kind !== "none") {
			e.preventDefault();
			e.stopPropagation();
			commit(clear(state));
		}
	};

	const paint = useMemo(() => paintOf(state.sel, ix), [state.sel, ix]);
	const all = boxOf(state, ix.allIds);
	const onGroup = state.group;
	const activeK = state.active && onGroup === null ? ix.order.get(state.active.row) : undefined;
	const activeC = state.active && onGroup === null ? ix.colOf.get(state.active.col) : undefined;
	const cellId = (k: number, c: number) => `${uid}-${k}-${c}`;
	const groupId = (g: string) => `${uid}-g${groupNo.get(g)}`;
	const picked = (k: number, c: number) =>
		(paint.columns !== null && c >= paint.columns[0] && c <= paint.columns[1]) ||
		(paint.block !== null && k >= paint.block.r[0] && k <= paint.block.r[1] && c >= paint.block.c[0] && c <= paint.block.c[1]);
	/** The block's ring, drawn on its edge cells – they move with the columns that stay put. Keys show the active cell too */
	const ring = (k: number, c: number) => {
		const out: string[] = [];
		const b = paint.block;
		if (b && k >= b.r[0] && k <= b.r[1] && c >= b.c[0] && c <= b.c[1]) {
			if (k === b.r[0]) out.push(`inset 0 2px 0 0 ${RING}`);
			if (k === b.r[1]) out.push(`inset 0 -2px 0 0 ${RING}`);
			if (c === b.c[0]) out.push(`inset 2px 0 0 0 ${RING}`);
			if (c === b.c[1]) out.push(`inset -2px 0 0 0 ${RING}`);
		}
		const single = b && b.r[0] === b.r[1] && b.c[0] === b.c[1];
		if (keys && focused && k === activeK && c === activeC && !single) out.push(`inset 0 0 0 2px ${RING}`);
		return out.length ? out.join(", ") : undefined;
	};

	const cellBody = (c: DataGridColumn, r: DataGridRow) => {
		const v = r[c.key];
		const words = textOf(c, r);
		switch (c.type) {
			case "check":
				return v ? (
					<>
						<Check className="size-3.5 text-muted-foreground" aria-hidden />
						<span className="sr-only">{words}</span>
					</>
				) : null;
			case "tag": {
				const tags = c.format ? [words].filter(Boolean) : tagsOf(v);
				return (
					<span className="flex min-w-0 items-center gap-1" title={words}>
						{tags.map((t) => {
							const tone = c.tone?.(c.format ? v : t);
							return (
								<span key={t} className="inline-flex h-5 min-w-0 shrink-0 items-center gap-1 rounded-md bg-muted px-1.5 text-xs whitespace-nowrap">
									{tone && <span className={cn("size-1.5 shrink-0 rounded-full", TONE[tone])} aria-hidden />}
									<span className="truncate">{t}</span>
								</span>
							);
						})}
					</span>
				);
			}
			case "image": {
				const urls = urlsOf(v);
				const side = thumbOf(rh);
				return (
					<span className="flex items-center gap-1">
						{urls.slice(0, THUMBS).map((u, i) => (
							<img
								key={`${i}:${u}`}
								src={u}
								alt=""
								loading="lazy"
								draggable={false}
								className="shrink-0 rounded-[5px] bg-muted object-cover ring-1 ring-foreground/10"
								style={{ width: side, height: side }}
							/>
						))}
						{urls.length > THUMBS && <span className="pl-1 text-xs text-muted-foreground tabular-nums">+{urls.length - THUMBS}</span>}
						<span className="sr-only">{words}</span>
					</span>
				);
			}
			case "link":
				return (
					<span className="truncate text-primary" title={typeof v === "string" ? v : undefined}>
						{words}
					</span>
				);
			case "number":
			case "date":
				return (
					<span className="truncate tabular-nums" title={words}>
						{words}
					</span>
				);
			default:
				return (
					<span className="truncate" title={words}>
						{words}
					</span>
				);
		}
	};

	const headerRow = (interactive: boolean) => (
		<div role="row" aria-rowindex={1} className="sticky top-0 z-20 flex w-full border-b bg-card" style={{ height: headerH }}>
			<div role="columnheader" aria-colindex={1} className="sticky left-0 z-10 flex shrink-0 bg-card" style={{ width: MARKER }}>
				{interactive && (
					<Box
						checked={all}
						label="全选"
						onToggle={() => {
							focusGrid();
							commit(toggleAll(state, ix));
						}}
					/>
				)}
			</div>
			{columns.map((c, ci) => {
				const on = paint.columns !== null && ci >= paint.columns[0] && ci <= paint.columns[1];
				return (
					<div
						key={c.key}
						role="columnheader"
						aria-colindex={ci + 2}
						aria-selected={interactive ? on : undefined}
						onMouseDown={(e) => e.preventDefault()}
						onClick={(e) => {
							if (!interactive) return;
							focusGrid();
							commit(pickColumn(state, c.key, ix, e.shiftKey));
						}}
						className={cn(
							"flex shrink-0 items-center px-3 text-xs font-medium select-none",
							ci === 0 ? "sticky z-10 border-r" : "border-r border-border/60 last:border-r-0",
							c.type === "number" && "justify-end",
							on ? "bg-(--grid-picked) text-foreground" : cn("bg-card text-muted-foreground", interactive && "hover:bg-(--grid-hover)"),
						)}
						style={{ width: widths[ci], left: ci === 0 ? MARKER : undefined }}
					>
						<span className="truncate">{c.label}</span>
					</div>
				);
			})}
		</div>
	);

	const card = cn("flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs", TINTS, className);

	if (rows === null)
		return (
			<div ref={root} data-slot="data-grid" aria-busy="true" aria-label={label} className={card}>
				<div className="min-h-0 overflow-hidden" style={{ width, minWidth: "100%" }}>
					{headerRow(false)}
					{BARS.map((w, i) => (
						<div key={w} className="flex border-b last:border-b-0" style={{ height: rh }}>
							<div className="grid shrink-0 place-items-center" style={{ width: MARKER }}>
								<span className="size-4 rounded-[4px] border border-input opacity-40" />
							</div>
							{columns.map((c, ci) => (
								<div key={c.key} className={cn("flex shrink-0 items-center px-3", c.type === "number" && "justify-end")} style={{ width: widths[ci] }}>
									{c.type === "image" ? (
										<Skeleton className="rounded-[5px]" style={{ width: thumbOf(rh), height: thumbOf(rh) }} />
									) : (
										<Skeleton className="h-3" style={{ width: `${((w + ci * 9 + i * 7) % 60) + 30}%` }} />
									)}
								</div>
							))}
						</div>
					))}
				</div>
			</div>
		);

	if (!list.length)
		return (
			<div ref={root} data-slot="data-grid" className={card}>
				<Placeholder text={empty} className="py-10" />
			</div>
		);

	const [from, to] = range;
	const activeLine = onGroup !== null ? ix.stopOf.get(`g:${onGroup}`) : activeK !== undefined ? ix.stopOf.get(`r:${state.active!.row}`) : undefined;
	const rendered = activeLine !== undefined && activeLine >= from && activeLine < to;
	return (
		<div ref={root} data-slot="data-grid" className={card}>
			<div
				ref={scroller}
				role="grid"
				aria-label={label}
				aria-multiselectable
				aria-rowcount={lines.length + 1}
				aria-colcount={columns.length + 1}
				aria-activedescendant={!rendered ? undefined : onGroup !== null ? groupId(onGroup) : cellId(activeK!, activeC!)}
				tabIndex={0}
				onScroll={update}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				onKeyDown={onKeyDown}
				onCopy={onCopy}
				onPointerDown={onPointerDown}
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				className="min-h-0 overflow-auto overscroll-contain outline-none select-none"
			>
				<div className="relative" style={{ width, minWidth: "100%", height: headerH + total }}>
					{headerRow(true)}
					{lines.slice(from, to).map((l, n) => {
						const i = from + n;
						const top = headerH + tops[i]!;
						if (l.kind === "group") {
							const ringed = keys && focused && onGroup === l.label;
							return (
								<div
									key={`g:${l.label}`}
									role="row"
									aria-rowindex={i + 2}
									className="absolute inset-x-0 flex border-b bg-background"
									style={{ top, height: groupH, boxShadow: ringed ? `inset 0 0 0 2px ${RING}` : undefined }}
								>
									<div role="gridcell" aria-colindex={1} className="sticky left-0 z-10 flex shrink-0 bg-background" style={{ width: MARKER }}>
										<Box
											checked={boxOf(state, l.ids)}
											label={`选择「${l.label}」这一组`}
											onToggle={() => {
												focusGrid();
												commit(toggleRows(state, l.ids, ix));
											}}
										/>
									</div>
									<div role="gridcell" id={groupId(l.label)} aria-colspan={columns.length} className="sticky flex min-w-0 bg-background" style={{ left: MARKER }}>
										<button
											type="button"
											tabIndex={-1}
											data-grid-skip=""
											aria-expanded={!l.collapsed}
											onMouseDown={(e) => e.preventDefault()}
											onClick={() => {
												focusGrid();
												fold(l.label);
											}}
											className="flex h-full min-w-0 items-center gap-1.5 pr-3 pl-2 text-xs font-medium outline-none"
										>
											<Chevron open={!l.collapsed} className="size-3.5 duration-150 motion-reduce:transition-none" />
											<span className="truncate">{l.label}</span>
											<span className="font-normal text-muted-foreground tabular-nums">{l.count}</span>
										</button>
									</div>
								</div>
							);
						}
						const r = l.row;
						const k = ix.order.get(r.id)!;
						const checked = paint.checked.has(k);
						const ground = (on: boolean) => (checked ? GROUND.checked : on ? GROUND.picked : GROUND.plain);
						return (
							<div key={r.id} role="row" aria-rowindex={i + 2} aria-selected={checked} className="group/row absolute inset-x-0 flex border-b" style={{ top, height: rh }}>
								<div role="gridcell" aria-colindex={1} className={cn("sticky left-0 z-10 flex shrink-0 bg-(--cell-bg)", ground(false))} style={{ width: MARKER }}>
									<Box
										checked={checked}
										label={`选择 ${columns[0] ? textOf(columns[0], r) : r.id}`}
										onPress={(e) => pressBox(e, r.id)}
										onToggle={(shift) => {
											focusGrid();
											commit(toggleRow(state, r.id, ix, shift));
										}}
									/>
								</div>
								{columns.map((c, ci) => {
									const on = picked(k, ci);
									return (
										<div
											key={c.key}
											id={cellId(k, ci)}
											role="gridcell"
											aria-colindex={ci + 2}
											aria-selected={on || checked}
											className={cn(
												"relative flex shrink-0 items-center overflow-hidden bg-(--cell-bg) px-3 text-md",
												ci === 0 ? "sticky z-10 border-r" : "border-r border-border/60 last:border-r-0",
												c.type === "number" && "justify-end",
												ground(on),
											)}
											style={{ width: widths[ci], left: ci === 0 ? MARKER : undefined, boxShadow: ring(k, ci) }}
										>
											{cellBody(c, r)}
											{ci === 0 && onOpen && (
												<button
													type="button"
													tabIndex={-1}
													data-grid-skip=""
													onMouseDown={(e) => e.preventDefault()}
													onClick={() => onOpen(r.id)}
													className={cn(
														"absolute top-1/2 right-1.5 flex h-6 -translate-y-1/2 items-center rounded-md border bg-card px-2 text-2xs font-medium text-muted-foreground shadow-xs outline-none hover:bg-(--grid-hover) hover:text-foreground",
														// The words under it fade out rather than end at its edge
														"before:pointer-events-none before:absolute before:inset-y-0 before:right-full before:w-6 before:bg-linear-to-l before:from-(--cell-bg) before:to-transparent",
														"opacity-0 group-hover/row:opacity-100",
														// No hover on touch: the row a tap picked shows it
														k === activeK && "pointer-coarse:opacity-100",
													)}
												>
													打开
												</button>
											)}
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
			<div role="status" aria-live="polite" className="sr-only">
				{said}
			</div>
		</div>
	);
}

export { DataGrid };
