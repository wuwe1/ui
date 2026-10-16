// lineTotals and splitPath: the numbers and names TurnStats shows
import assert from "node:assert/strict";
import { test } from "node:test";
import { lineTotals, splitPath } from "../src/lib/turn-stats.ts";

test("lineTotals: sums added and removed; none is zero", () => {
	assert.deepEqual(lineTotals([{ path: "a", added: 3, removed: 1 }, { path: "b", added: 45, removed: 11 }]), { added: 48, removed: 12 });
	assert.deepEqual(lineTotals([]), { added: 0, removed: 0 });
});

test("splitPath: name, then folder; a bare name has no folder; a trailing slash drops", () => {
	assert.deepEqual(splitPath("web/src/lib/thread.ts"), { name: "thread.ts", dir: "web/src/lib" });
	assert.deepEqual(splitPath("README.md"), { name: "README.md", dir: "" });
	assert.deepEqual(splitPath("/repo/docs/"), { name: "docs", dir: "/repo" });
});
