// pitchOf, indexAt, marks, inView, spreadRail, spreadAt: Outline's geometry
import assert from "node:assert/strict";
import { test } from "node:test";
import { focusAt, indexAt, inView, marks, nearness, PAD, pitchOf, spreadAt, spreadRail } from "../src/lib/outline.ts";

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

test("spreadRail: 16px apart when there's room, packed when not; item i stays at y, the rail kept in the column", () => {
	const r = spreadRail(12, 5, 300, 600);
	assert.equal(r.pitch, 16);
	assert.equal(r.top + PAD + 5.5 * 16, 300);
	assert.equal(spreadRail(240, 0, 0, 600).pitch, (600 - 2 * PAD) / 240);
	assert.equal(spreadRail(12, 0, 0, 600).top, 0);
	assert.equal(focusAt(300, r, 12), 5);
	assert.equal(focusAt(-50, r, 12), 0);
});

test("spreadAt: the focus stays put and gets a full row; far ones keep the rail's pitch; nothing leaves the column", () => {
	const room = 600;
	const r = spreadRail(12, 5, 300, room);
	const s = spreadAt(12, 5, r, room);
	assert.ok(Math.abs((s.y[5] ?? 0) - 300) < 1e-9);
	assert.equal(s.near[5], 1);
	assert.ok((s.gap[5] ?? 0) > 23, `focus gap ${s.gap[5]}`);
	assert.ok(Math.abs((s.y[11] ?? 0) - (s.y[10] ?? 0) - 16) < 1);
	for (let j = 1; j < 12; j++) assert.ok((s.y[j] ?? 0) > (s.y[j - 1] ?? 0));
	// Packed: the ends squeeze in, the focus still at its place
	const d = spreadRail(240, 3, 30, room);
	const t = spreadAt(240, 3, d, room);
	assert.ok((t.y[0] ?? 0) >= PAD - 1e-9 && (t.y[239] ?? 0) <= room - PAD + 1e-9);
	assert.ok(Math.abs((t.y[3] ?? 0) - (d.top + PAD + 3.5 * d.pitch)) < 1e-9);
	for (let j = 1; j < 240; j++) assert.ok((t.y[j] ?? 0) > (t.y[j - 1] ?? 0));
	assert.ok(Math.abs(nearness(1) - Math.exp(-1 / 4.5)) < 1e-12);
});
