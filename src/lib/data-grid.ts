// What DataGrid works out: the lines – records and group headers – and where each sits, which are on screen, column widths,
// what a value shows and copies as, and the selection: each change an old state and an action giving a new one. Pure – test/data-grid.test.ts.

export type DataGridType = "text" | "number" | "date" | "check" | "tag" | "image" | "link";
/** A tag's dot, in StatusIcon's colors: waiting needs you, running, done, error */
export type DataGridTone = "waiting" | "running" | "done" | "error";
export type DataGridRow = { id: string } & Record<string, unknown>;
export type DataGridColumn = {
	key: string;
	label: string;
	/** text by default */
	type?: DataGridType;
	/** Fixed width in px; without it, measured from the label and the first 100 rows */
	width?: number;
	/** Cap for a measured width */
	maxWidth?: number;
	/** The words a value shows and copies as */
	format?: (value: unknown, row: DataGridRow) => string;
	/** tag only: the dot before a value */
	tone?: (value: unknown) => DataGridTone | null | undefined;
};
/** A header before each run of equal values under key; rows come sorted by it */
export type DataGridGroup = { key: string; label?: (value: unknown) => string };
/** null – nothing; rows – those rows checked; rows and columns – those cells: a block, or whole columns when rows is every row */
export type DataGridSelection = { rows: string[]; columns?: string[] } | null;

/** A record, or a group's header: its value, how many rows have it, their ids – folded hides them */
export type Line = { kind: "row"; row: DataGridRow } | { kind: "group"; label: string; count: number; ids: string[]; collapsed: boolean };

/** Compact: 32px rows, 40 with thumbnails, 56 tall; a finger gets 44 (the component) */
export const ROW_HEIGHT = { sm: 32, md: 40, lg: 56 } as const;
export const HEADER_HEIGHT = 32;
export const GROUP_HEIGHT = 32;
export const MARKER_WIDTH = 36;
const MIN_WIDTH = 64;
const MAX_WIDTH = 280;
/** A cell's padding both sides, the line after it, and a pixel so text that just fits isn't cut */
const PAD = 26;
/** Between thumbnails, between tags */
const GAP = 4;
/** A tag's own padding, and its dot with the gap after it */
const PILL = 12;
const DOT = 10;
/** The 「+N」 after four thumbnails */
const MORE = 28;
/** Thumbnails show up to this many */
export const THUMBS = 4;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// ── lines ──

const groupText = (v: unknown) => (v === null || v === undefined || v === "" ? "空" : typeof v === "boolean" ? (v ? "是" : "否") : String(v).split("\n")[0]!);

/** Records in order; with a group, a header before each run of equal values, with every row of that value. Folded groups keep their header only */
export function linesOf(rows: DataGridRow[], group?: DataGridGroup, collapsed: ReadonlySet<string> = new Set()): Line[] {
	if (!group) return rows.map((row) => ({ kind: "row", row }));
	const label = (r: DataGridRow) => (group.label ? group.label(r[group.key]) : groupText(r[group.key]));
	const ids = new Map<string, string[]>();
	for (const r of rows) {
		const l = label(r);
		const list = ids.get(l);
		if (list) list.push(r.id);
		else ids.set(l, [r.id]);
	}
	const out: Line[] = [];
	let last: string | null = null;
	for (const row of rows) {
		const l = label(row);
		const folded = collapsed.has(l);
		if (l !== last) out.push({ kind: "group", label: l, count: ids.get(l)!.length, ids: ids.get(l)!, collapsed: folded });
		last = l;
		if (!folded) out.push({ kind: "row", row });
	}
	return out;
}

/** Each line's top in the body, and the body's height */
export function layout(lines: Line[], rowHeight: number, groupHeight = GROUP_HEIGHT): { tops: number[]; total: number } {
	const tops: number[] = [];
	let y = 0;
	for (const l of lines) {
		tops.push(y);
		y += l.kind === "group" ? groupHeight : rowHeight;
	}
	return { tops, total: y };
}

/** The line at y in the body; -1 with no lines */
export function lineAt(tops: number[], y: number): number {
	let lo = 0;
	let hi = tops.length - 1;
	if (hi < 0) return -1;
	while (lo < hi) {
		const mid = (lo + hi + 1) >> 1;
		if (tops[mid]! <= y) lo = mid;
		else hi = mid - 1;
	}
	return lo;
}

/** The lines to render for a viewport over the body, with a few more each side: [from, to) */
export function visible(tops: number[], scrollTop: number, height: number, overscan = 6): [number, number] {
	if (!tops.length) return [0, 0];
	return [Math.max(0, lineAt(tops, scrollTop) - overscan), Math.min(tops.length, lineAt(tops, scrollTop + height) + 1 + overscan)];
}

/** The record line at y – a group header gives the record after it, then the one before; -1 with no records on screen */
export function rowLineAt(lines: Line[], tops: number[], y: number): number {
	const at = lineAt(tops, clamp(y, 0, Number.MAX_SAFE_INTEGER));
	if (at < 0) return -1;
	for (let i = at; i < lines.length; i++) if (lines[i]!.kind === "row") return i;
	for (let i = at; i >= 0; i--) if (lines[i]!.kind === "row") return i;
	return -1;
}

/** Each column's left edge, from the first column's */
export function offsetsOf(widths: number[]): number[] {
	const out: number[] = [];
	let x = 0;
	for (const w of widths) {
		out.push(x);
		x += w;
	}
	return out;
}

/** The column at x, from the first column's left edge; past either end, the end one */
export function colAt(offsets: number[], widths: number[], x: number): number {
	if (!offsets.length) return -1;
	for (let i = 0; i < offsets.length; i++) if (x < offsets[i]! + widths[i]!) return i;
	return offsets.length - 1;
}

// ── values ──

export const urlsOf = (v: unknown): string[] =>
	typeof v === "string" ? (v ? [v] : []) : Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x !== "") : [];

export const tagsOf = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).filter(Boolean) : v === null || v === undefined || v === "" ? [] : [String(v)]);

/** A URL as people read it: no scheme, no www, no query – detail.1688.com/offer/86031.html */
export const linkText = (url: string) =>
	url
		.replace(/^[a-z][\w+.-]*:\/\//i, "")
		.replace(/^www\./, "")
		.replace(/[?#].*$/, "")
		.replace(/\/$/, "");

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Today 09:05; this year 3/12 09:05; before that 2025/3/12. Local time */
export function dateText(v: unknown, now: number): string {
	const d = v instanceof Date ? v : new Date(typeof v === "number" ? v : String(v));
	if (Number.isNaN(d.getTime())) return String(v);
	const n = new Date(now);
	const hm = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
	if (d.toDateString() === n.toDateString()) return hm;
	if (d.getFullYear() === n.getFullYear()) return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
	return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/** What a cell says in words – shown, measured, read aloud. Images and checks show marks; these are their words */
export function textOf(c: DataGridColumn, row: DataGridRow, now = Date.now()): string {
	const v = row[c.key];
	if (c.format) return c.format(v, row);
	if (v === null || v === undefined || v === "") return "";
	switch (c.type) {
		case "date":
			return dateText(v, now);
		case "check":
			return v ? "是" : "";
		case "tag":
			return tagsOf(v).join("、");
		case "image": {
			const n = urlsOf(v).length;
			return n ? `${n} 张图` : "";
		}
		case "link":
			return linkText(String(v));
		default:
			return String(v).split("\n")[0]!;
	}
}

/** What ⌘C takes from a cell: its words – a text's every line, a link's and the images' URLs */
export function copyOf(c: DataGridColumn, row: DataGridRow, now = Date.now()): string {
	const v = row[c.key];
	if (v === null || v === undefined) return "";
	if (c.type === "image") return urlsOf(v).join(" ");
	if (c.type === "link") return String(v);
	if (c.format) return c.format(v, row);
	if (!c.type || c.type === "text") return String(v);
	return textOf(c, row, now);
}

/** A thumbnail's side for a row height */
export const thumbOf = (rowHeight: number) => rowHeight - 10;

/** A column's width: fixed, or the widest of its label and its first 100 values, kept within 64 and its cap */
export function widthOf(c: DataGridColumn, rows: DataGridRow[], measure: (s: string) => number, rowHeight: number, now = Date.now()): number {
	if (c.width) return c.width;
	const head = measure(c.label) + PAD;
	const first = rows.slice(0, 100);
	if (c.type === "check") return Math.round(Math.max(56, head));
	if (c.type === "image") {
		const most = Math.max(1, ...first.map((r) => urlsOf(r[c.key]).length));
		const n = Math.min(THUMBS, most);
		return Math.round(Math.max(head, n * thumbOf(rowHeight) + (n - 1) * GAP + PAD + (most > THUMBS ? MORE : 0)));
	}
	// Numbers and dates show tabular digits, wider than the ones a canvas measures: measure zeros, the widest
	const tabular = c.type === "number" || c.type === "date";
	const valueWidth = (r: DataGridRow) => {
		if (tabular) return measure(textOf(c, r, now).slice(0, 60).replace(/\d/g, "0"));
		if (c.type !== "tag" || c.format) return measure(textOf(c, r, now).slice(0, 60));
		const tags = tagsOf(r[c.key]);
		return tags.reduce((w, t, i) => w + measure(t) + PILL + (c.tone?.(t) ? DOT : 0) + (i ? GAP : 0), 0);
	};
	const widest = Math.max(0, ...first.map(valueWidth));
	return Math.round(Math.min(c.maxWidth ?? MAX_WIDTH, Math.max(MIN_WIDTH, head, widest + PAD)));
}

/** A field of tab-separated text, quoted when it holds a tab, a line break or a quote – Excel and Google Sheets read that */
const field = (s: string) => (/[\t\n\r"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** The selection as tab-separated text, rows in their order; checked rows copy every column */
export function tsv(s: DataGridSelection, rows: DataGridRow[], columns: DataGridColumn[], now = Date.now()): string {
	if (!s) return "";
	const byId = new Map(rows.map((r) => [r.id, r]));
	const cols = s.columns ? columns.filter((c) => s.columns!.includes(c.key)) : columns;
	return s.rows
		.map((id) => byId.get(id))
		.filter((r): r is DataGridRow => Boolean(r))
		.map((r) => cols.map((c) => field(copyOf(c, r, now))).join("\t"))
		.join("\n");
}

// ── selection ──

/** A cell by its row's id and its column's key – positions shift when rows come and go, ids don't */
export type Cell = { row: string; col: string };
export type Sel =
	| { kind: "none" }
	| { kind: "rows"; ids: string[]; anchor: string | null }
	| { kind: "block"; anchor: Cell; head: Cell }
	| { kind: "columns"; anchor: string; head: string };
/** sel – what is selected; active – where the keys move from; group – the group header the keys are on, the active cell kept for when they leave */
export type GridState = { sel: Sel; active: Cell | null; group: string | null };
export const NONE: GridState = { sel: { kind: "none" }, active: null, group: null };

/** What the keys stop on, top to bottom: each row on screen, and each group header */
export type Stop = { kind: "row"; id: string } | { kind: "group"; label: string };
/**
 * Where things are. ids – the rows on screen, top to bottom, for blocks and keys; all – every row, a folded group's too,
 * so checking and whole columns reach them; stops – what the keys land on
 */
export type Index = {
	ids: string[];
	order: Map<string, number>;
	allIds: string[];
	all: Map<string, number>;
	columns: string[];
	colOf: Map<string, number>;
	stops: Stop[];
	stopOf: Map<string, number>;
	groups: Map<string, string[]>;
};

const stopKey = (s: Stop) => (s.kind === "row" ? `r:${s.id}` : `g:${s.label}`);

/** rows: every row in order – folded ones too; without it, the rows in lines */
export function indexOf(lines: Line[], columns: { key: string }[], rows?: DataGridRow[]): Index {
	const ids = lines.flatMap((l) => (l.kind === "row" ? [l.row.id] : []));
	const allIds = rows ? rows.map((r) => r.id) : ids;
	const stops = lines.map((l): Stop => (l.kind === "row" ? { kind: "row", id: l.row.id } : { kind: "group", label: l.label }));
	return {
		ids,
		order: new Map(ids.map((id, i) => [id, i])),
		allIds,
		all: new Map(allIds.map((id, i) => [id, i])),
		columns: columns.map((c) => c.key),
		colOf: new Map(columns.map((c, i) => [c.key, i])),
		stops,
		stopOf: new Map(stops.map((s, i) => [stopKey(s), i])),
		groups: new Map(lines.flatMap((l) => (l.kind === "group" ? [[l.label, l.ids] as const] : []))),
	};
}

/** Ids that still exist, once each, in the rows' order – folded rows count */
const sorted = (ids: Iterable<string>, ix: Index) => [...new Set(ids)].filter((id) => ix.all.has(id)).sort((a, b) => ix.all.get(a)! - ix.all.get(b)!);
const pair = (a: number, b: number): [number, number] => (a <= b ? [a, b] : [b, a]);
const checkedOf = (s: GridState) => (s.sel.kind === "rows" ? s.sel.ids : []);
const rowsSel = (ids: string[], anchor: string | null): Sel => (ids.length ? { kind: "rows", ids, anchor } : { kind: "none" });

/** A block's rows and columns as positions among the rows on screen, low to high; null when a corner is gone or folded away */
export function spanOf(a: Cell, b: Cell, ix: Index): { r: [number, number]; c: [number, number] } | null {
	const r0 = ix.order.get(a.row);
	const r1 = ix.order.get(b.row);
	const c0 = ix.colOf.get(a.col);
	const c1 = ix.colOf.get(b.col);
	if (r0 === undefined || r1 === undefined || c0 === undefined || c1 === undefined) return null;
	return { r: pair(r0, r1), c: pair(c0, c1) };
}

/** What the host hears: ids in the rows' order, keys in the columns'. Checked rows and whole columns include folded rows */
export function toSelection(sel: Sel, ix: Index): DataGridSelection {
	switch (sel.kind) {
		case "none":
			return null;
		case "rows": {
			const ids = sorted(sel.ids, ix);
			return ids.length ? { rows: ids } : null;
		}
		case "block": {
			const s = spanOf(sel.anchor, sel.head, ix);
			return s ? { rows: ix.ids.slice(s.r[0], s.r[1] + 1), columns: ix.columns.slice(s.c[0], s.c[1] + 1) } : null;
		}
		case "columns": {
			const a = ix.colOf.get(sel.anchor);
			const b = ix.colOf.get(sel.head);
			if (a === undefined || b === undefined || !ix.allIds.length) return null;
			const [c0, c1] = pair(a, b);
			return { rows: [...ix.allIds], columns: ix.columns.slice(c0, c1 + 1) };
		}
	}
}

const together = (xs: number[]) => xs.every((x, i) => i === 0 || x === xs[i - 1]! + 1);

/** What the host passes, read back: whole columns, a block when its rows are on screen and run together, else the rows checked */
export function fromSelection(s: DataGridSelection, ix: Index): GridState {
	if (!s) return NONE;
	const rows = sorted(s.rows, ix);
	if (!rows.length) return NONE;
	const cs = [...new Set((s.columns ?? []).map((c) => ix.colOf.get(c)).filter((c): c is number => c !== undefined))].sort((a, b) => a - b);
	const firstShown = rows.find((id) => ix.order.has(id));
	const active = firstShown ? { row: firstShown, col: ix.columns[cs[0] ?? 0]! } : null;
	const checked: GridState = { sel: { kind: "rows", ids: rows, anchor: rows[0]! }, active, group: null };
	if (!cs.length || !together(cs)) return checked;
	const c0 = ix.columns[cs[0]!]!;
	const c1 = ix.columns[cs[cs.length - 1]!]!;
	if (rows.length === ix.allIds.length && rows.length > 1) return { sel: { kind: "columns", anchor: c0, head: c1 }, active, group: null };
	const ks = rows.map((id) => ix.order.get(id));
	if (ks.some((k) => k === undefined) || !together(ks as number[])) return checked;
	return { sel: { kind: "block", anchor: { row: rows[0]!, col: c0 }, head: { row: rows[rows.length - 1]!, col: c1 } }, active: { row: rows[0]!, col: c0 }, group: null };
}

/** A key that's equal for equal selections */
export const keyOf = (s: DataGridSelection | undefined) => (s ? JSON.stringify([s.rows, s.columns ?? null]) : "null");

/** A cell clicked: that cell alone; with shift, the block from where the last one started */
export function clickCell(s: GridState, cell: Cell, shift = false): GridState {
	const anchor = shift ? (s.sel.kind === "block" ? s.sel.anchor : s.active) : null;
	return { sel: { kind: "block", anchor: anchor ?? cell, head: cell }, active: cell, group: null };
}

/** A drag reaches a cell: the block from where it started */
export function dragTo(s: GridState, cell: Cell): GridState {
	const anchor = s.sel.kind === "block" ? s.sel.anchor : (s.active ?? cell);
	return { sel: { kind: "block", anchor, head: cell }, active: cell, group: null };
}

/** A row's box: checks or unchecks it; with shift, checks every row on screen from the last one ticked */
export function toggleRow(s: GridState, id: string, ix: Index, shift = false): GridState {
	const had = checkedOf(s);
	const active = { row: id, col: s.active?.col ?? ix.columns[0]! };
	const from = s.sel.kind === "rows" ? s.sel.anchor : null;
	if (shift && from !== null && ix.order.has(from) && ix.order.has(id)) {
		const [a, b] = pair(ix.order.get(from)!, ix.order.get(id)!);
		return { sel: rowsSel(sorted([...had, ...ix.ids.slice(a, b + 1)], ix), from), active, group: null };
	}
	const ids = had.includes(id) ? had.filter((x) => x !== id) : sorted([...had, id], ix);
	return { sel: rowsSel(ids, id), active, group: null };
}

/**
 * A drag down the boxes: the rows on screen from where it started to here take the first box's new state – checked or not –
 * over what was checked before the drag (base)
 */
export function paintRows(base: string[], from: string, to: string, on: boolean, ix: Index, s: GridState): GridState {
	const a = ix.order.get(from);
	const b = ix.order.get(to);
	if (a === undefined || b === undefined) return s;
	const [lo, hi] = pair(a, b);
	const span = new Set(ix.ids.slice(lo, hi + 1));
	const ids = on ? sorted([...base, ...span], ix) : base.filter((id) => !span.has(id));
	return { sel: rowsSel(ids, from), active: { row: to, col: s.active?.col ?? ix.columns[0]! }, group: null };
}

/** A group's box: all its rows checked – unchecked; otherwise all checked, added to the rest. Folded rows count */
export function toggleRows(s: GridState, ids: string[], ix: Index): GridState {
	if (!ids.length) return s;
	const had = checkedOf(s);
	const on = new Set(had);
	const drop = new Set(ids);
	const left = ids.every((id) => on.has(id)) ? had.filter((id) => !drop.has(id)) : sorted([...had, ...ids], ix);
	return { ...s, sel: rowsSel(left, ids[0]!) };
}

/** Every row checked, folded ones too */
export function checkAll(s: GridState, ix: Index): GridState {
	if (!ix.allIds.length) return s;
	return { ...s, sel: { kind: "rows", ids: [...ix.allIds], anchor: ix.allIds[0]! } };
}

/** The header's box: all checked – none; otherwise all */
export function toggleAll(s: GridState, ix: Index): GridState {
	const had = new Set(checkedOf(s));
	const all = ix.allIds.length > 0 && ix.allIds.every((id) => had.has(id));
	return all ? { ...s, sel: { kind: "none" } } : checkAll(s, ix);
}

/** How a box over these rows reads: all checked, some, none */
export function boxOf(s: GridState, ids: string[]): boolean | "mixed" {
	if (!ids.length || s.sel.kind !== "rows") return false;
	const on = new Set(s.sel.ids);
	const n = ids.filter((id) => on.has(id)).length;
	return n === 0 ? false : n === ids.length ? true : "mixed";
}

/** A header clicked: its column; with shift, the columns from the last one picked */
export function pickColumn(s: GridState, key: string, ix: Index, shift = false): GridState {
	const anchor = shift && s.sel.kind === "columns" ? s.sel.anchor : key;
	return { sel: { kind: "columns", anchor, head: key }, active: { row: s.active?.row ?? ix.ids[0] ?? "", col: key }, group: null };
}

export const clear = (s: GridState): GridState => ({ ...s, sel: { kind: "none" } });

export type Move = "up" | "down" | "left" | "right" | "home" | "end" | "pageUp" | "pageDown";

/**
 * A key moves the active cell – to an end with meta, a screen with page – and the selection follows it as one cell.
 * Up and down stop on group headers too; there the selection stays and left and right are the host's – fold, unfold.
 * With shift the block grows from where it started instead, over rows only. With nothing active the first key lands on the first stop
 */
export function move(s: GridState, to: Move, ix: Index, m: { shift?: boolean; meta?: boolean; page?: number } = {}): GridState {
	if (!ix.stops.length || !ix.columns.length) return s;
	const lastC = ix.columns.length - 1;
	if (m.shift) {
		if (!ix.ids.length) return s;
		const from = s.sel.kind === "block" ? s.sel.head : s.active;
		let r = from ? (ix.order.get(from.row) ?? 0) : 0;
		let c = from ? (ix.colOf.get(from.col) ?? 0) : 0;
		const lastR = ix.ids.length - 1;
		if (from)
			if (to === "up") r = m.meta ? 0 : r - 1;
			else if (to === "down") r = m.meta ? lastR : r + 1;
			else if (to === "left") c = m.meta ? 0 : c - 1;
			else if (to === "right") c = m.meta ? lastC : c + 1;
			else if (to === "home") c = 0;
			else if (to === "end") c = lastC;
			else if (to === "pageUp") r -= m.page ?? 10;
			else r += m.page ?? 10;
		const cell = { row: ix.ids[clamp(r, 0, lastR)]!, col: ix.columns[clamp(c, 0, lastC)]! };
		return { sel: { kind: "block", anchor: s.sel.kind === "block" ? s.sel.anchor : (s.active ?? cell), head: cell }, active: cell, group: null };
	}
	const here = s.group !== null ? ix.stopOf.get(`g:${s.group}`) : s.active ? ix.stopOf.get(`r:${s.active.row}`) : undefined;
	const lastS = ix.stops.length - 1;
	let at = here ?? -1;
	let c = s.active ? (ix.colOf.get(s.active.col) ?? 0) : 0;
	if (here === undefined) at = 0;
	else if (s.group !== null && (to === "left" || to === "right" || to === "home" || to === "end")) return s;
	else if (to === "up") at = m.meta ? 0 : at - 1;
	else if (to === "down") at = m.meta ? lastS : at + 1;
	else if (to === "pageUp") at -= m.page ?? 10;
	else if (to === "pageDown") at += m.page ?? 10;
	else if (to === "left") c = m.meta ? 0 : c - 1;
	else if (to === "right") c = m.meta ? lastC : c + 1;
	else if (to === "home") {
		c = 0;
		if (m.meta) at = 0;
	} else if (to === "end") {
		c = lastC;
		if (m.meta) at = lastS;
	}
	const stop = ix.stops[clamp(at, 0, lastS)]!;
	if (stop.kind === "group") return { ...s, group: stop.label };
	const cell = { row: stop.id, col: ix.columns[clamp(c, 0, lastC)]! };
	return { sel: { kind: "block", anchor: cell, head: cell }, active: cell, group: null };
}

/** What to paint, by position among the rows on screen: checked rows, the block's span, the picked columns */
export type Paint = { checked: Set<number>; block: { r: [number, number]; c: [number, number] } | null; columns: [number, number] | null };

export function paintOf(sel: Sel, ix: Index): Paint {
	const none: Paint = { checked: new Set(), block: null, columns: null };
	if (sel.kind === "rows") return { ...none, checked: new Set(sel.ids.map((id) => ix.order.get(id)).filter((k): k is number => k !== undefined)) };
	if (sel.kind === "block") return { ...none, block: spanOf(sel.anchor, sel.head, ix) };
	if (sel.kind === "columns") {
		const a = ix.colOf.get(sel.anchor);
		const b = ix.colOf.get(sel.head);
		return a === undefined || b === undefined ? none : { ...none, columns: pair(a, b) };
	}
	return none;
}

/** What the live region says about a selection; one cell says nothing – the screen reader is already on it */
export function saidOf(s: DataGridSelection, total: number): string {
	if (!s) return "";
	if (!s.columns) return `已选 ${s.rows.length} 行`;
	if (s.rows.length === total && total > 1) return `已选 ${s.columns.length} 列`;
	if (s.rows.length === 1 && s.columns.length === 1) return "";
	return `已选 ${s.rows.length} 行 ${s.columns.length} 列`;
}
