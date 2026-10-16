// tokens, cells, percent: what ContextWindow shows
import assert from "node:assert/strict";
import { test } from "node:test";
import { cells, percent, tokens } from "../src/lib/context-window.ts";

test("tokens: plain under 10 000, then 万 with one decimal", () => {
	assert.equal(tokens(4200), "4200");
	assert.equal(tokens(132_800), "13.3 万");
	assert.equal(tokens(200_000), "20 万");
});

test("cells: in order, at least one per part with tokens, the rest empty, never more than count", () => {
	assert.deepEqual(cells([{ id: "a", tokens: 50 }, { id: "b", tokens: 1 }, { id: "c", tokens: 0 }], 100, 4), ["a", "a", "b", null]);
	assert.equal(cells([{ id: "a", tokens: 500 }], 100, 4).length, 4);
});

test("percent: rounded, capped at 100", () => {
	assert.equal(percent(132_800, 200_000), 66);
	assert.equal(percent(300, 200), 100);
	assert.equal(percent(1, 0), 0);
});
