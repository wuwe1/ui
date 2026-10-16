// What DataGrid works out: lines, group headers and folding, positions and what's on screen, widths, words and copies, the selection
import assert from "node:assert/strict";
import { test } from "node:test";
import {
	boxOf,
	checkAll,
	clickCell,
	colAt,
	copyOf,
	type DataGridColumn,
	type DataGridRow,
	dateText,
	dragTo,
	fromSelection,
	type GridState,
	indexOf,
	keyOf,
	layout,
	lineAt,
	linesOf,
	linkText,
	move,
	NONE,
	offsetsOf,
	paintOf,
	paintRows,
	pickColumn,
	rowLineAt,
	saidOf,
	textOf,
	toggleAll,
	toggleRow,
	toggleRows,
	toSelection,
	tsv,
	visible,
	widthOf,
} from "../src/lib/data-grid.ts";

const COLUMNS: DataGridColumn[] = [
	{ key: "sn", label: "订单号" },
	{ key: "step", label: "当前步骤", type: "tag" },
	{ key: "days", label: "剩几天", type: "number" },
	{ key: "url", label: "货源链接", type: "link" },
];
const row = (id: string, step: string, extra: Record<string, unknown> = {}): DataGridRow => ({ id, sn: `SN${id}`, step, days: Number(id), ...extra });
const ROWS = [row("1", "待加购"), row("2", "待加购"), row("3", "待预报"), row("4", "已打包")];
const GROUP = { key: "step" };
const lines = linesOf(ROWS, GROUP);
const ix = indexOf(lines, COLUMNS, ROWS);
const at = (r: string, c: string) => ({ row: r, col: c });
const shown = (ls: ReturnType<typeof linesOf>) => ls.map((l) => (l.kind === "group" ? `# ${l.label} ${l.count}${l.collapsed ? " ▸" : ""}` : l.row.id));

test("lines: a header before each run of equal values, with its rows; empty values read 空; a folded group keeps its header", () => {
	assert.deepEqual(shown(lines), ["# 待加购 2", "1", "2", "# 待预报 1", "3", "# 已打包 1", "4"]);
	assert.deepEqual(lines[0], { kind: "group", label: "待加购", count: 2, ids: ["1", "2"], collapsed: false });
	assert.deepEqual(shown(linesOf([row("9", "")], GROUP)), ["# 空 1", "9"]);
	assert.deepEqual(shown(linesOf(ROWS, { key: "step", label: (v) => `步骤 ${v}` })).slice(0, 1), ["# 步骤 待加购 2"]);
	assert.deepEqual(shown(linesOf(ROWS, GROUP, new Set(["待加购"]))), ["# 待加购 2 ▸", "# 待预报 1", "3", "# 已打包 1", "4"]);
	assert.equal(linesOf(ROWS).length, 4);
});

test("layout: group headers are 32px, rows their height; the line at y; what's on screen with a few more each side", () => {
	const { tops, total } = layout(lines, 40);
	assert.deepEqual(tops, [0, 32, 72, 112, 144, 184, 216]);
	assert.equal(total, 256);
	assert.equal(lineAt(tops, 0), 0);
	assert.equal(lineAt(tops, 71), 1);
	assert.equal(lineAt(tops, 72), 2);
	assert.equal(lineAt(tops, 9999), 6);
	assert.equal(lineAt([], 10), -1);
	assert.deepEqual(visible(tops, 80, 40, 0), [2, 4]);
	assert.deepEqual(visible(tops, 80, 40, 1), [1, 5]);
	assert.deepEqual(visible([], 0, 100), [0, 0]);
	// A group header gives the row after it; past the end, the last row; a folded last group, the row before it
	assert.equal(rowLineAt(lines, tops, 120), 4);
	assert.equal(rowLineAt(lines, tops, 0), 1);
	assert.equal(rowLineAt(lines, tops, 99999), 6);
	const folded = linesOf(ROWS, GROUP, new Set(["已打包"]));
	assert.equal(rowLineAt(folded, layout(folded, 40).tops, 99999), 4);
});

test("columns: left edges, and the column at x – past either end, the end one", () => {
	const offsets = offsetsOf([100, 50, 80]);
	assert.deepEqual(offsets, [0, 100, 150]);
	assert.equal(colAt(offsets, [100, 50, 80], 0), 0);
	assert.equal(colAt(offsets, [100, 50, 80], 120), 1);
	assert.equal(colAt(offsets, [100, 50, 80], 5000), 2);
	assert.equal(colAt([], [], 10), -1);
});

test("words: each type says what it shows; format wins; dates by how long ago", () => {
	const now = new Date(2026, 9, 16, 18, 0).getTime();
	assert.equal(dateText(new Date(2026, 9, 16, 9, 5).getTime(), now), "09:05");
	assert.equal(dateText(new Date(2026, 2, 12, 9, 5), now), "3/12 09:05");
	assert.equal(dateText(new Date(2025, 2, 12, 9, 5).getTime(), now), "2025/3/12");
	assert.equal(dateText("不是日期", now), "不是日期");
	assert.equal(linkText("https://detail.1688.com/offer/860316641707.html?spm=a360q"), "detail.1688.com/offer/860316641707.html");
	assert.equal(linkText("https://www.example.com/"), "example.com");
	const r = { id: "x", t: "第一行\n第二行", c: true, tags: ["红", "蓝"], img: ["a.png", "b.png"], u: "https://shopee.tw/x?y=1", d: new Date(2026, 9, 16, 9, 5).getTime() };
	assert.equal(textOf({ key: "t", label: "" }, r), "第一行");
	assert.equal(textOf({ key: "c", label: "", type: "check" }, r), "是");
	assert.equal(textOf({ key: "c", label: "", type: "check" }, { ...r, c: false }), "");
	assert.equal(textOf({ key: "tags", label: "", type: "tag" }, r), "红、蓝");
	assert.equal(textOf({ key: "img", label: "", type: "image" }, r), "2 张图");
	assert.equal(textOf({ key: "u", label: "", type: "link" }, r), "shopee.tw/x");
	assert.equal(textOf({ key: "d", label: "", type: "date" }, r, now), "09:05");
	assert.equal(textOf({ key: "t", label: "", format: (v) => `【${String(v).length}】` }, r), "【7】");
	assert.equal(textOf({ key: "none", label: "" }, r), "");
	// ⌘C: a text's every line, links and images as URLs, the rest as shown
	assert.equal(copyOf({ key: "t", label: "" }, r), "第一行\n第二行");
	assert.equal(copyOf({ key: "u", label: "", type: "link", format: () => "货源" }, r), "https://shopee.tw/x?y=1");
	assert.equal(copyOf({ key: "img", label: "", type: "image" }, r), "a.png b.png");
	assert.equal(copyOf({ key: "c", label: "", type: "check" }, r), "是");
});

test("tsv: checked rows copy every column, a block its own; fields with tabs, breaks or quotes are quoted", () => {
	const rows = [row("1", "待加购", { url: "https://a.com" }), row("2", '说"明"\n第二行')];
	assert.equal(tsv({ rows: ["2", "1"] }, rows, COLUMNS), 'SN2\t"说""明""\n第二行"\t2\t\nSN1\t待加购\t1\thttps://a.com');
	assert.equal(tsv({ rows: ["1"], columns: ["days", "sn"] }, rows, COLUMNS), "SN1\t1");
	assert.equal(tsv(null, rows, COLUMNS), "");
	assert.equal(tsv({ rows: ["gone"] }, rows, COLUMNS), "");
});

test("widths: fixed, or the widest of label and values within 64 and the cap; checks, images and tags have their own", () => {
	const m = (s: string) => s.length * 10;
	const rows = [{ id: "1", a: "很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长", b: "短", img: ["1", "2", "3", "4", "5", "6"], tag: "待加购" }];
	assert.equal(widthOf({ key: "a", label: "名", width: 123 }, rows, m, 32), 123);
	assert.equal(widthOf({ key: "a", label: "名" }, rows, m, 32), 280);
	assert.equal(widthOf({ key: "a", label: "名", maxWidth: 360 }, rows, m, 32), 360);
	assert.equal(widthOf({ key: "b", label: "名" }, rows, m, 32), 64);
	assert.equal(widthOf({ key: "b", label: "一个很长的列名" }, rows, m, 32), 96);
	assert.equal(widthOf({ key: "c", label: "勾", type: "check" }, rows, m, 32), 56);
	// Four 30px thumbnails at 40px rows, gaps, padding and the line, and room for +N
	assert.equal(widthOf({ key: "img", label: "图", type: "image" }, rows, m, 40), 4 * 30 + 3 * 4 + 26 + 28);
	// One 22px thumbnail at 32px rows, and padding
	assert.equal(widthOf({ key: "img", label: "图", type: "image" }, [{ id: "1", img: "1" }], m, 32), 22 + 26);
	// A tag: its words, the pill's padding, the dot when it has one
	assert.equal(widthOf({ key: "tag", label: "步", type: "tag" }, rows, m, 32), 30 + 12 + 26);
	assert.equal(widthOf({ key: "tag", label: "步", type: "tag", tone: () => "waiting" }, rows, m, 32), 30 + 12 + 10 + 26);
	// Tabular digits are measured as zeros: a narrow 1 takes a zero's room
	const zeros = (s: string) => [...s].reduce((w, ch) => w + (ch === "0" ? 12 : 8), 0);
	assert.equal(widthOf({ key: "n", label: "数", type: "number" }, [{ id: "1", n: 1111111111 }], zeros, 32), 120 + 26);
});

test("click, shift-click, drag: a cell, then a block from where it started", () => {
	let s: GridState = clickCell(NONE, at("1", "sn"));
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["1"], columns: ["sn"] });
	s = clickCell(s, at("3", "days"), true);
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["1", "2", "3"], columns: ["sn", "step", "days"] });
	s = clickCell(s, at("2", "step"), true);
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["1", "2"], columns: ["sn", "step"] });
	// Dragging up and left from a cell: still ids in their order
	s = dragTo(clickCell(NONE, at("3", "url")), at("2", "days"));
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["2", "3"], columns: ["days", "url"] });
	assert.deepEqual(s.active, at("2", "days"));
});

test("boxes: check and uncheck a row, shift checks the rows between, the header's box all or none", () => {
	let s = toggleRow(NONE, "2", ix);
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["2"] });
	s = toggleRow(s, "4", ix, true);
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["2", "3", "4"] });
	s = toggleRow(s, "3", ix);
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["2", "4"] });
	assert.equal(toggleRow(toggleRow(NONE, "1", ix), "1", ix).sel.kind, "none");
	s = toggleAll(NONE, ix);
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["1", "2", "3", "4"] });
	assert.equal(toggleAll(s, ix).sel.kind, "none");
	assert.deepEqual(toSelection(checkAll(clickCell(NONE, at("1", "sn")), ix).sel, ix), { rows: ["1", "2", "3", "4"] });
});

test("drag down the boxes: rows from the first to here take its new state, over what was checked before", () => {
	const before = toggleRow(NONE, "4", ix);
	// Starting on an unchecked box checks; the rows passed join the ones checked before
	let s = paintRows(["4"], "1", "3", true, ix, before);
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["1", "2", "3", "4"] });
	// Back up: only what's between the first box and the pointer now
	s = paintRows(["4"], "1", "2", true, ix, s);
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["1", "2", "4"] });
	// Starting on a checked box unchecks
	s = paintRows(["1", "2", "3", "4"], "3", "2", false, ix, s);
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["1", "4"] });
	assert.equal(paintRows(["4"], "4", "4", false, ix, s).sel.kind, "none");
	assert.equal(paintRows([], "gone", "1", true, ix, s), s);
});

test("group boxes: all, some, none; a click checks the group's rows, again unchecks them – folded rows count", () => {
	let s = toggleRows(toggleRow(NONE, "4", ix), ["1", "2"], ix);
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["1", "2", "4"] });
	assert.equal(boxOf(s, ["1", "2"]), true);
	assert.equal(boxOf(toggleRow(s, "1", ix), ["1", "2"]), "mixed");
	assert.equal(boxOf(NONE, ["1", "2"]), false);
	s = toggleRows(s, ["1", "2"], ix);
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["4"] });
	// Folded: the rows leave the screen, not the selection
	const folded = linesOf(ROWS, GROUP, new Set(["待加购"]));
	const fx = indexOf(folded, COLUMNS, ROWS);
	assert.deepEqual(fx.ids, ["3", "4"]);
	assert.deepEqual(fx.allIds, ["1", "2", "3", "4"]);
	const checked = toggleRows(NONE, fx.groups.get("待加购")!, fx);
	assert.deepEqual(toSelection(checked.sel, fx), { rows: ["1", "2"] });
	assert.deepEqual([...paintOf(checked.sel, fx).checked], []);
	assert.deepEqual(toSelection(checkAll(NONE, fx).sel, fx), { rows: ["1", "2", "3", "4"] });
	// Whole columns are every row; a block only rows on screen
	assert.deepEqual(toSelection(pickColumn(NONE, "sn", fx).sel, fx), { rows: ["1", "2", "3", "4"], columns: ["sn"] });
	assert.equal(fromSelection({ rows: ["1", "2"], columns: ["sn"] }, fx).sel.kind, "rows");
});

test("headers: a column, shift for the columns between; columns are every row", () => {
	let s = pickColumn(NONE, "step", ix);
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["1", "2", "3", "4"], columns: ["step"] });
	s = pickColumn(s, "url", ix, true);
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["1", "2", "3", "4"], columns: ["step", "days", "url"] });
	assert.deepEqual(paintOf(s.sel, ix).columns, [1, 3]);
});

test("keys: arrows stop on rows and group headers; the selection follows rows, stays on headers; meta to an end, a page; shift grows over rows", () => {
	// The first key lands on the first stop – here a group header
	let s = move(NONE, "down", ix);
	assert.equal(s.group, "待加购");
	assert.equal(s.sel.kind, "none");
	s = move(s, "down", ix);
	assert.deepEqual(s.active, at("1", "sn"));
	assert.equal(s.group, null);
	s = move(move(s, "down", ix), "right", ix);
	assert.deepEqual(toSelection(s.sel, ix), { rows: ["2"], columns: ["step"] });
	// Down onto the next header: the selection stays, left and right don't move, then on to its row in the same column
	const h = move(s, "down", ix);
	assert.equal(h.group, "待预报");
	assert.deepEqual(toSelection(h.sel, ix), { rows: ["2"], columns: ["step"] });
	assert.equal(move(h, "left", ix), h);
	assert.deepEqual(move(h, "down", ix).active, at("3", "step"));
	assert.deepEqual(move(s, "down", ix, { meta: true }).active, at("4", "step"));
	assert.equal(move(s, "up", ix, { meta: true }).group, "待加购");
	assert.deepEqual(move(s, "right", ix, { meta: true }).active, at("2", "url"));
	assert.deepEqual(move(s, "end", ix).active, at("2", "url"));
	assert.equal(move(s, "home", ix, { meta: true }).group, "待加购");
	assert.deepEqual(move(s, "pageDown", ix, { page: 10 }).active, at("4", "step"));
	// Shift: the block grows over rows, skipping headers, and keeps growing from its far corner
	let g = move(s, "down", ix, { shift: true });
	g = move(g, "right", ix, { shift: true });
	assert.deepEqual(toSelection(g.sel, ix), { rows: ["2", "3"], columns: ["step", "days"] });
	g = move(move(g, "up", ix, { shift: true }), "up", ix, { shift: true });
	assert.deepEqual(toSelection(g.sel, ix), { rows: ["1", "2"], columns: ["step", "days"] });
	// A plain arrow after a block: one cell again, from the active one
	assert.deepEqual(toSelection(move(g, "left", ix).sel, ix), { rows: ["1"], columns: ["step"] });
	assert.equal(move(NONE, "down", indexOf([], COLUMNS)), NONE);
	// Without groups the first key lands on the first row
	const flat = indexOf(linesOf(ROWS), COLUMNS);
	assert.deepEqual(move(NONE, "down", flat).active, at("1", "sn"));
});

test("from the host: rows checked, a block, whole columns; ids that are gone drop out", () => {
	assert.deepEqual(fromSelection(null, ix), NONE);
	assert.equal(fromSelection({ rows: ["gone"] }, ix), NONE);
	const rows = fromSelection({ rows: ["3", "1", "gone"] }, ix);
	assert.deepEqual(toSelection(rows.sel, ix), { rows: ["1", "3"] });
	const block = fromSelection({ rows: ["2", "3"], columns: ["step", "days"] }, ix);
	assert.equal(block.sel.kind, "block");
	assert.deepEqual(toSelection(block.sel, ix), { rows: ["2", "3"], columns: ["step", "days"] });
	assert.equal(fromSelection({ rows: ["1", "2", "3", "4"], columns: ["days"] }, ix).sel.kind, "columns");
	// Rows apart, or columns apart: the rows are checked
	assert.equal(fromSelection({ rows: ["1", "3"], columns: ["sn"] }, ix).sel.kind, "rows");
	assert.equal(fromSelection({ rows: ["1", "2"], columns: ["sn", "days"] }, ix).sel.kind, "rows");
	// What the grid sent comes back equal
	assert.equal(keyOf(toSelection(block.sel, ix)), keyOf({ rows: ["2", "3"], columns: ["step", "days"] }));
	assert.notEqual(keyOf(toSelection(block.sel, ix)), keyOf(null));
});

test("rows that go away: a block whose corner is gone selects nothing; checked rows keep the ones left", () => {
	const fewer = indexOf(linesOf([ROWS[0]!, ROWS[1]!, ROWS[3]!], GROUP), COLUMNS);
	const block = clickCell(clickCell(NONE, at("1", "sn")), at("3", "days"), true);
	assert.equal(toSelection(block.sel, fewer), null);
	const checked = toggleRow(toggleRow(NONE, "1", ix), "3", ix);
	assert.deepEqual(toSelection(checked.sel, fewer), { rows: ["1"] });
});

test("paint and words: positions to tint, and what the live region says", () => {
	assert.deepEqual([...paintOf(toggleRow(NONE, "3", ix).sel, ix).checked], [2]);
	assert.deepEqual(paintOf(clickCell(clickCell(NONE, at("1", "sn")), at("2", "step"), true).sel, ix).block, { r: [0, 1], c: [0, 1] });
	assert.equal(saidOf({ rows: ["1", "2", "3"] }, 4), "已选 3 行");
	assert.equal(saidOf({ rows: ["1", "2", "3", "4"], columns: ["sn", "step"] }, 4), "已选 2 列");
	assert.equal(saidOf({ rows: ["1", "2"], columns: ["sn", "step"] }, 4), "已选 2 行 2 列");
	assert.equal(saidOf({ rows: ["1"], columns: ["sn"] }, 4), "");
	assert.equal(saidOf(null, 4), "");
});
