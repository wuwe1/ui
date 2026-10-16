// score and ranges: the search Command and Combobox share
import assert from "node:assert/strict";
import { test } from "node:test";
import { ranges, score } from "../src/lib/search.ts";

test("score: a start beats the middle, nothing is 0; case and outer spaces don't count", () => {
	assert.equal(score("mixer", "mix"), 1);
	assert.equal(score("~/repos/mixer", "mix"), 0.5);
	assert.equal(score("penna", "mix"), 0);
	assert.equal(score("Mixer", " MIX "), 1);
	assert.equal(score("王小明 设计负责人", "设计"), 0.5);
	// Empty matches everything, as a start
	assert.equal(score("anything", ""), 1);
});

test("score: no fuzzy matching – letters apart don't match", () => {
	assert.equal(score("repos", "rps"), 0);
	assert.equal(score("write email", "wrt"), 0);
});

test("ranges: every place the text shows up, without overlaps", () => {
	assert.deepEqual(ranges("Priya Raman", "an"), [[9, 11]]);
	assert.deepEqual(ranges("Banana", "an"), [[1, 3], [3, 5]]);
	assert.deepEqual(ranges("Maya", " MA "), [[0, 2]]);
	assert.deepEqual(ranges("Maya", ""), []);
});
