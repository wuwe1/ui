// step: arrow keys in a toolbar
import assert from "node:assert/strict";
import { test } from "node:test";
import { step } from "../src/lib/roving.ts";

test("step: arrows wrap, Home and End jump, other keys pass", () => {
	assert.equal(step("ArrowRight", 0, 3), 1);
	assert.equal(step("ArrowRight", 2, 3), 0);
	assert.equal(step("ArrowLeft", 0, 3), 2);
	assert.equal(step("Home", 2, 3), 0);
	assert.equal(step("End", 0, 3), 2);
	assert.equal(step("Enter", 0, 3), null);
	assert.equal(step("ArrowRight", 0, 0), null);
});
