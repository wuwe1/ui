// elapsed: the stopwatch format the clocks use
import assert from "node:assert/strict";
import { test } from "node:test";
import { elapsed } from "../src/lib/time.ts";

test("under 10 seconds – one decimal, never negative", () => {
	assert.equal(elapsed(0), "0.0");
	assert.equal(elapsed(1149), "1.1");
	assert.equal(elapsed(9999), "9.9");
	assert.equal(elapsed(-500), "0.0");
});

test("then a stopwatch: 0:12, 2:13, 1:02:13", () => {
	assert.equal(elapsed(10_000), "0:10");
	assert.equal(elapsed(12_900), "0:12");
	assert.equal(elapsed(133_000), "2:13");
	assert.equal(elapsed(3_733_000), "1:02:13");
});
