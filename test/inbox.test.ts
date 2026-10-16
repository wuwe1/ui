// sections, sectionOf, changed: what Inbox shows
import assert from "node:assert/strict";
import { test } from "node:test";
import { changed, sectionOf, sections } from "../src/lib/inbox.ts";

test("sections: 待处理 (waiting before error, oldest first), 运行中 (running before background, newest first), 已完成 (newest first)", () => {
	const got = sections([
		{ id: "e", status: "error" as const, at: 1 },
		{ id: "w2", status: "waiting" as const, at: 5 },
		{ id: "w1", status: "waiting" as const, at: 2 },
		{ id: "b", status: "background" as const, at: 9 },
		{ id: "r1", status: "running" as const, at: 3 },
		{ id: "r2", status: "running" as const, at: 7 },
		{ id: "d1", status: "done" as const, at: 4 },
		{ id: "d2", status: "done" as const, at: 8 },
	]);
	assert.deepEqual(got.map((s) => [s.title, s.items.map((x) => x.id)]), [["待处理", ["w1", "w2", "e"]], ["运行中", ["r2", "r1", "b"]], ["已完成", ["d2", "d1"]]]);
});

test("sections: empty ones are left out", () => {
	assert.deepEqual(sections([{ status: "running" as const, at: 1 }]).map((s) => s.title), ["运行中"]);
	assert.deepEqual(sections([]), []);
});

test("sectionOf", () => {
	assert.equal(sectionOf("error"), "todo");
	assert.equal(sectionOf("background"), "running");
	assert.equal(sectionOf("done"), "done");
});

test("changed: only rows seen before with another status", () => {
	const before = new Map([["a", "running" as const], ["b", "waiting" as const]]);
	assert.deepEqual(changed(before, [{ id: "a", status: "done" }, { id: "b", status: "waiting" }, { id: "c", status: "error" }]), [{ id: "a", status: "done" }]);
});
