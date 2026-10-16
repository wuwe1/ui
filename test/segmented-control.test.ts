// next, stop: SegmentedControl's keys and tab stop
import assert from "node:assert/strict";
import { test } from "node:test";
import { next, stop } from "../src/lib/segmented-control.ts";

const OPTIONS = [{ value: "a" }, { value: "b", disabled: true }, { value: "c" }, { value: "d" }];

test("next: ← → move and wrap, skipping disabled options", () => {
	assert.equal(next(OPTIONS, "a", "ArrowRight"), "c");
	assert.equal(next(OPTIONS, "d", "ArrowRight"), "a");
	assert.equal(next(OPTIONS, "a", "ArrowLeft"), "d");
	assert.equal(next(OPTIONS, "c", "ArrowLeft"), "a");
});

test("next: ↑ ↓ in a radiogroup, not in a tablist; Home and End; other keys pass", () => {
	assert.equal(next(OPTIONS, "a", "ArrowDown"), "c");
	assert.equal(next(OPTIONS, "c", "ArrowUp"), "a");
	assert.equal(next(OPTIONS, "a", "ArrowDown", "tabs"), null);
	assert.equal(next(OPTIONS, "c", "Home"), "a");
	assert.equal(next(OPTIONS, "a", "End"), "d");
	assert.equal(next(OPTIONS, "a", "Enter"), null);
});

test("next: with nothing picked the first step lands on an end; with nothing enabled there's no step", () => {
	assert.equal(next(OPTIONS, undefined, "ArrowRight"), "a");
	assert.equal(next(OPTIONS, undefined, "ArrowLeft"), "d");
	assert.equal(next([{ value: "x", disabled: true }], "x", "ArrowRight"), null);
});

test("stop: the pick, or the first enabled option when the pick is missing or disabled", () => {
	assert.equal(stop(OPTIONS, "c"), "c");
	assert.equal(stop(OPTIONS, "b"), "a");
	assert.equal(stop(OPTIONS, undefined), "a");
	assert.equal(stop([{ value: "x", disabled: true }], "x"), undefined);
});
