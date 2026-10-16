// settle, depths, short: what MessageQueue draws while messages come and go
import assert from "node:assert/strict";
import { test } from "node:test";
import { depths, settle, short, type Shown } from "../src/lib/message-queue.ts";

const m = (id: string) => ({ id, text: id });
const ids = (s: Shown[]) => s.map((x) => (x.out ? `${x.m.id}:${x.out}` : x.m.id));

test("settle: new messages go to the end; ones that left stay in place, marked how they went", () => {
	const a = settle([], [m("a"), m("b")], new Set());
	assert.deepEqual(ids(a), ["a", "b"]);
	const b = settle(a, [m("a"), m("b"), m("c")], new Set());
	assert.deepEqual(ids(b), ["a", "b", "c"]);
	const c = settle(b, [m("a")], new Set(["c"]));
	assert.deepEqual(ids(c), ["a", "b:taken", "c:withdrawn"]);
	// Still leaving next time round: keeps its mark
	assert.deepEqual(ids(settle(c, [m("a")], new Set())), ["a", "b:taken", "c:withdrawn"]);
});

test("settle: a message that comes back is drawn again, and takes the new text", () => {
	const gone = settle(settle([], [m("a")], new Set()), [], new Set());
	assert.deepEqual(ids(gone), ["a:taken"]);
	const back = settle(gone, [{ id: "a", text: "again" }], new Set());
	assert.deepEqual(ids(back), ["a"]);
	assert.equal(back[0]?.m.text, "again");
});

test("depths: the newest is in front; staying cards move forward past one that leaves", () => {
	assert.deepEqual(depths(settle([], [m("a"), m("b"), m("c")], new Set())), [2, 1, 0]);
	// The front one is withdrawn: it stays at 0 while it sinks, the next is already at 0 under it
	assert.deepEqual(depths([{ m: m("a") }, { m: m("b") }, { m: m("c"), out: "withdrawn" }]), [1, 0, 0]);
	// All taken at once: each keeps its place as it lifts away
	assert.deepEqual(depths([{ m: m("a"), out: "taken" }, { m: m("b"), out: "taken" }]), [1, 0]);
});

test("short: one line, cut by characters, not bytes", () => {
	assert.equal(short("  用 Postgres 16\n的语法  ", 20), "用 Postgres 16 的语法");
	assert.equal(short("另外给 accounts.email 加唯一索引"), "另外给 accounts.ema…");
	assert.equal(short("😀".repeat(20), 3), "😀😀😀…");
});
