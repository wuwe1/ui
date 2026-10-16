// Combobox: search, groups, keys, chips, initials, announcements
import assert from "node:assert/strict";
import { test } from "node:test";
import { announce, canCreate, firstRow, fit, settle, groupsOf, initials, matches, move, ranges, rowsOf, toggle, type ComboboxOption, type Row } from "../src/lib/combobox.ts";

const PEOPLE: ComboboxOption[] = [
	{ value: "maya", label: "Maya Chen", hint: "Product Designer", group: "Design" },
	{ value: "sara", label: "Sara Okafor", hint: "Staff Engineer", group: "Engineering" },
	{ value: "jonas", label: "Jonas Weber", hint: "Design Lead", group: "Design" },
	{ value: "wang", label: "王小明", hint: "前端", group: "Engineering", keywords: ["wangxiaoming"] },
	{ value: "solo", label: "Solo" },
];

test("matches: label, hint or keyword, ignoring case and outer spaces; empty matches all", () => {
	assert.ok(matches(PEOPLE[0]!, "maya"));
	assert.ok(matches(PEOPLE[0]!, " DESIGNER "));
	assert.ok(matches(PEOPLE[3]!, "小明"));
	assert.ok(matches(PEOPLE[3]!, "wangx"));
	assert.ok(!matches(PEOPLE[1]!, "design"));
	assert.ok(matches(PEOPLE[1]!, ""));
});

test("ranges: every place the text shows up, without overlaps", () => {
	assert.deepEqual(ranges("Priya Raman", "an"), [[9, 11]]);
	assert.deepEqual(ranges("Banana", "an"), [[1, 3], [3, 5]]);
	assert.deepEqual(ranges("aaaa", "aa"), [[0, 2], [2, 4]]);
	assert.deepEqual(ranges("Maya", "MA"), [[0, 2]]);
	assert.deepEqual(ranges("Maya", " "), []);
});

test("groupsOf: groups in the order they first appear; ungrouped ones in a group without a name", () => {
	const g = groupsOf(PEOPLE);
	assert.deepEqual(g.map((x) => x.name), ["Design", "Engineering", undefined]);
	assert.deepEqual(g[0]!.options.map((o) => o.value), ["maya", "jonas"]);
	assert.deepEqual(g[1]!.options.map((o) => o.value), ["sara", "wang"]);
});

test("canCreate: text that no label matches exactly, ignoring case", () => {
	assert.ok(canCreate(PEOPLE, "Alex"));
	assert.ok(canCreate(PEOPLE, "maya"));
	assert.ok(!canCreate(PEOPLE, "maya chen"));
	assert.ok(!canCreate(PEOPLE, "  "));
});

test("rowsOf: options as grouped, then the create row", () => {
	const rows = rowsOf(groupsOf(PEOPLE), "Alex");
	assert.deepEqual(rows.map((r) => (r.kind === "option" ? r.option.value : `+${r.text}`)), ["maya", "jonas", "sara", "wang", "solo", "+Alex"]);
});

const ROWS: Row[] = [
	{ kind: "option", option: { value: "a", label: "A", disabled: true } },
	{ kind: "option", option: { value: "b", label: "B" } },
	{ kind: "option", option: { value: "c", label: "C", disabled: true } },
	{ kind: "option", option: { value: "d", label: "D" } },
	{ kind: "create", text: "e" },
];

test("move: ↑ ↓ wrap and skip disabled rows; Home and End; other keys aren't moves", () => {
	assert.equal(firstRow(ROWS), 1);
	assert.equal(move(ROWS, 1, "ArrowDown"), 3);
	assert.equal(move(ROWS, 3, "ArrowDown"), 4);
	assert.equal(move(ROWS, 4, "ArrowDown"), 1);
	assert.equal(move(ROWS, 1, "ArrowUp"), 4);
	assert.equal(move(ROWS, 3, "Home"), 1);
	assert.equal(move(ROWS, 1, "End"), 4);
	assert.equal(move(ROWS, 1, "Enter"), null);
});

test("move: nothing active lands on an end; nothing pickable stays at -1", () => {
	assert.equal(move(ROWS, -1, "ArrowDown"), 1);
	assert.equal(move(ROWS, -1, "ArrowUp"), 4);
	assert.equal(move([ROWS[0]!], -1, "ArrowDown"), -1);
	assert.equal(firstRow([]), -1);
});

test("toggle: adds at the end or takes out; single replaces and keeps its value when picked again", () => {
	assert.deepEqual(toggle(["a", "b"], "c", true), ["a", "b", "c"]);
	assert.deepEqual(toggle(["a", "b"], "a", true), ["b"]);
	assert.deepEqual(toggle(["a"], "b", false), ["b"]);
	assert.deepEqual(toggle(["a"], "a", false), ["a"]);
	assert.deepEqual(toggle([], "a", false), ["a"]);
});

test("settle: values in order; gone ones stay in place, leaving", () => {
	const v = (cs: { value: string; leaving?: boolean }[]) => cs.map((c) => (c.leaving ? `-${c.value}` : c.value)).join(" ");
	assert.equal(v(settle([], ["a", "b"])), "a b");
	assert.equal(v(settle([{ value: "a" }, { value: "b" }, { value: "c" }], ["a", "c"])), "a -b c");
	assert.equal(v(settle([{ value: "a" }, { value: "b" }], ["b", "x"])), "-a b x");
	assert.equal(v(settle([{ value: "a" }, { value: "b", leaving: true }, { value: "c" }], ["a", "c", "d"])), "a -b c d");
	// Picked again while leaving: back as a chip
	assert.equal(v(settle([{ value: "a" }, { value: "b", leaving: true }], ["a", "b"])), "a b");
});

test("fit: the first max show, the rest count into +N", () => {
	assert.deepEqual(fit(["a", "b", "c"]), { shown: ["a", "b", "c"], more: 0 });
	assert.deepEqual(fit(["a", "b", "c"], 3), { shown: ["a", "b", "c"], more: 0 });
	assert.deepEqual(fit(["a", "b", "c", "d", "e"], 3), { shown: ["a", "b", "c"], more: 2 });
	assert.deepEqual(fit(["a", "b"], 0), { shown: [], more: 2 });
});

test("initials: two words' first letters, a Chinese name's first character", () => {
	assert.equal(initials("Maya Chen"), "MC");
	assert.equal(initials("leo"), "L");
	assert.equal(initials("王小明"), "王");
	assert.equal(initials("  "), "");
});

test("announce: what was done, and the count in multiple mode", () => {
	assert.equal(announce("picked", "Jonas Weber", 3, true), "已选 Jonas Weber，共 3 项");
	assert.equal(announce("removed", "Sara", 1, true), "已移除 Sara，共 1 项");
	assert.equal(announce("created", "Alex", 4, true), "已添加 Alex，共 4 项");
	assert.equal(announce("picked", "Maya", 1, false), "已选 Maya");
	assert.equal(announce("armed", "Tom Becker", 7, true), "再按一次退格键移除 Tom Becker");
});
