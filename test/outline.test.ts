// pitchOf, indexAt, marks, inView: Outline's geometry
import assert from "node:assert/strict";
import { test } from "node:test";
import { indexAt, inView, marks, pitchOf } from "../src/lib/outline.ts";

test("pitchOf: 8px apart, 12 for a finger; packed tighter when they don't fit", () => {
	assert.equal(pitchOf(10, 500, false), 8);
	assert.equal(pitchOf(10, 500, true), 12);
	assert.equal(pitchOf(100, 224, false), 2);
	assert.equal(pitchOf(0, 500, false), 0);
});

test("indexAt: clamped to the items", () => {
	assert.equal(indexAt(12, 8, 10), 0);
	assert.equal(indexAt(12 + 8 * 3 + 1, 8, 10), 3);
	assert.equal(indexAt(-50, 8, 10), 0);
	assert.equal(indexAt(9999, 8, 10), 9);
});

test("marks: all when roomy; every few when packed, plus those in view and the pointed one", () => {
	assert.deepEqual(marks(4, 8, () => false, null), [0, 1, 2, 3]);
	assert.deepEqual(marks(8, 2, (i) => i === 5, 3), [0, 2, 3, 4, 5, 6]);
});

test("inView: the item the reading line is in, through the last whose top shows", () => {
	const box = { top: 0, bottom: 800 };
	assert.deepEqual(inView([-500, -100, 300, 700, 900], box), { a: 1, b: 3 });
	// Nothing above the line yet: the first one that shows
	assert.deepEqual(inView([400, 600], box), { a: 0, b: 1 });
	assert.equal(inView([900], box), null);
	assert.equal(inView([], box), null);
});
