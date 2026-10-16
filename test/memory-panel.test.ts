// counts, visible, trayLine, short: what MemoryPanel shows
import assert from "node:assert/strict";
import { test } from "node:test";
import { counts, type MemoryItem, short, trayLine, visible } from "../src/lib/memory-panel.ts";

const items: MemoryItem[] = [
	{ id: "a", text: "Prefers TypeScript", group: "user" },
	{ id: "b", text: "回复用中文", detail: "术语用英文原名", group: "feedback", paused: true },
	{ id: "c", text: "颜色克制", group: "feedback" },
];

test("counts: per group and all", () => {
	assert.deepEqual(counts(items), { all: 3, user: 1, feedback: 2 });
	assert.deepEqual(counts([]), { all: 0 });
});

test("visible: a group, a search over text and detail, both", () => {
	assert.deepEqual(visible(items, "feedback", "").map((m) => m.id), ["b", "c"]);
	assert.deepEqual(visible(items, "all", "typescript").map((m) => m.id), ["a"]);
	assert.deepEqual(visible(items, "all", "英文").map((m) => m.id), ["b"]);
	assert.deepEqual(visible(items, "user", "颜色"), []);
});

test("trayLine and short", () => {
	assert.equal(trayLine(items), "3 条 memory，1 条已暂停");
	assert.equal(trayLine(items.slice(0, 1)), "1 条 memory");
	assert.equal(short("一二三四五", 3), "一二三…");
	assert.equal(short("  a \n b "), "a b");
});
