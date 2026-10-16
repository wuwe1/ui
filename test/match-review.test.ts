// What MatchReview works out: groups of pairs that share a right item, keeping, deciding, accepting, the answer, labels cut by links
import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptAll, blocks, decide, EMPTY, final, isOpen, keep, keepAll, type MatchPair, segments, settled, step } from "../src/lib/match-review.ts";

const it = (id: string) => ({ id, label: id });
const pair = (id: string, right: string | null, confidence: "sure" | "unsure" = "unsure", alts: string[] = []): MatchPair => ({
	id,
	left: it(`L${id}`),
	right: right ? it(right) : null,
	confidence,
	candidates: right ? [right, ...alts].map((r) => ({ item: it(r) })) : undefined,
});

const PAIRS = [pair("a", "k5", "unsure", ["k3"]), pair("b", "k5", "unsure", ["k6"]), pair("c", "w100", "unsure", ["b150"]), pair("s", "b150", "sure")];

test("blocks: pairs pointing at the same item make one group where the first of them is; sure pairs stay folded", () => {
	const { blocks: bs, sure } = blocks(PAIRS, EMPTY);
	assert.deepEqual(
		bs.map((b) => b.key),
		["g:k5", "p:c"],
	);
	const g = bs[0]!;
	assert.equal(g.kind, "group");
	assert.deepEqual(g.kind === "group" && g.pairs.map((p) => p.id), ["a", "b"]);
	assert.deepEqual(
		sure.map((p) => p.id),
		["s"],
	);
});

test("decide: a pair that moves onto a sure pair's item pulls it into a group", () => {
	const c = PAIRS[2]!;
	const s = decide(c, "b150", EMPTY);
	const { blocks: bs, sure } = blocks(PAIRS, s);
	assert.deepEqual(
		bs.map((b) => b.key),
		["g:k5", "g:b150"],
	);
	assert.deepEqual(sure, []);
	assert.equal(s.decisions.c!.proposed, "w100");
});

test("keep: the shared item goes to one, the other moves to its next candidate and waits; undecided again", () => {
	const g = blocks(PAIRS, EMPTY).blocks[0]!;
	if (g.kind !== "group") throw new Error("not a group");
	const s = keep(PAIRS, g, PAIRS[0]!, EMPTY);
	assert.deepEqual(s.decisions.a, { pair: "a", right: "k5", proposed: "k5" });
	assert.equal(s.moved.b, "k6");
	const bs = blocks(PAIRS, s).blocks;
	assert.deepEqual(
		bs.map((b) => b.key),
		["p:a", "p:b", "p:c"],
	);
	assert.deepEqual(
		bs.filter((b) => isOpen(b, s)).map((b) => b.key),
		["p:b", "p:c"],
	);
	// b accepted as moved: proposed is the moved one
	assert.equal(decide(PAIRS[1]!, "k6", s).decisions.b!.proposed, "k6");
});

test("keep: a sure pair that loses its item comes into review with nothing proposed when it has no other candidate", () => {
	const c = PAIRS[2]!;
	const s1 = decide(c, "b150", EMPTY);
	const g = blocks(PAIRS, s1).blocks.find((b) => b.key === "g:b150")!;
	if (g.kind !== "group") throw new Error("not a group");
	const s2 = keep(PAIRS, g, c, s1);
	assert.deepEqual(s2.promoted, ["s"]);
	assert.equal(s2.moved.s, null);
	assert.ok(blocks(PAIRS, s2).blocks.some((b) => b.key === "p:s"));
});

test("keep: the next candidate skips what is settled elsewhere – decided for another pair, or held by a sure pair still folded", () => {
	const three = (id: string) => pair(id, "k1", "unsure", ["k2", "k3"]);
	const P = [three("x"), three("y"), three("z")];
	const g1 = blocks(P, EMPTY).blocks[0]!;
	if (g1.kind !== "group") throw new Error("not a group");
	const s1 = keep(P, g1, P[0]!, EMPTY);
	assert.deepEqual([s1.moved.y, s1.moved.z], ["k2", "k2"]);
	const g2 = blocks(P, s1).blocks.find((b) => b.key === "g:k2")!;
	if (g2.kind !== "group") throw new Error("not a group");
	// z doesn't go back to k1: x has it
	assert.equal(keep(P, g2, P[1]!, s1).moved.z, "k3");
	const Q = [pair("x", "k1", "unsure", ["k2", "k3"]), pair("y", "k1", "unsure", ["k2", "k3"]), pair("s", "k2", "sure")];
	const g = blocks(Q, EMPTY).blocks[0]!;
	if (g.kind !== "group") throw new Error("not a group");
	const s = keep(Q, g, Q[0]!, EMPTY);
	assert.equal(s.moved.y, "k3");
	assert.deepEqual(
		blocks(Q, s).sure.map((p) => p.id),
		["s"],
	);
});

test("keepAll: every pair keeps the item, the group stays and is no longer open", () => {
	const g = blocks(PAIRS, EMPTY).blocks[0]!;
	if (g.kind !== "group") throw new Error("not a group");
	const s = keepAll(g, EMPTY);
	assert.deepEqual([s.decisions.a?.right, s.decisions.b?.right], ["k5", "k5"]);
	assert.equal(isOpen(blocks(PAIRS, s).blocks[0]!, s), false);
});

test("acceptAll and final: the rest take their proposals, groups are kept, sure pairs answer as proposed", () => {
	const s = acceptAll(PAIRS, decide(PAIRS[2]!, null, EMPTY));
	assert.deepEqual(blocks(PAIRS, s).blocks.filter((b) => isOpen(b, s)), []);
	assert.deepEqual(
		final(PAIRS, s).map((d) => [d.pair, d.right]),
		[
			["a", "k5"],
			["b", "k5"],
			["c", null],
			["s", "b150"],
		],
	);
});

test("settled: decisions passed back read as a closed review – groups kept, changed sure pairs shown", () => {
	const s = settled(PAIRS, [
		{ pair: "a", right: "k5", proposed: "k5" },
		{ pair: "b", right: "k6", proposed: "k5" },
		{ pair: "c", right: null, proposed: "w100" },
		{ pair: "s", right: "b150", proposed: "b150" },
	]);
	const { blocks: bs, sure } = blocks(PAIRS, s);
	assert.deepEqual(
		bs.map((b) => b.key),
		["p:a", "p:b", "p:c"],
	);
	assert.deepEqual(bs.filter((b) => isOpen(b, s)), []);
	assert.deepEqual(
		sure.map((p) => p.id),
		["s"],
	);
});

test("step: wraps, and starts from an end when the current key is gone", () => {
	assert.equal(step(["a", "b", "c"], "c", 1), "a");
	assert.equal(step(["a", "b", "c"], "a", -1), "c");
	assert.equal(step(["a", "b"], "x", 1), "a");
	assert.equal(step(["a", "b"], null, -1), "b");
	assert.equal(step([], "a", 1), null);
});

test("segments: plain and linked parts in order; ranges clipped to the text and to each other", () => {
	assert.deepEqual(segments("雙桿150白+輪", [{ left: [5, 6], right: [0, 0] }, { left: [0, 2], right: [0, 0] }, { left: [2, 5], right: [0, 0], ok: false }], "left"), [
		{ text: "雙桿", link: 1, ok: true },
		{ text: "150", link: 2, ok: false },
		{ text: "白", link: 0, ok: true },
		{ text: "+輪" },
	]);
	assert.deepEqual(segments("abc", [{ left: [1, 9], right: [0, 0] }, { left: [0, 2], right: [0, 0] }], "left"), [
		{ text: "ab", link: 1, ok: true },
		{ text: "c", link: 0, ok: true },
	]);
	assert.deepEqual(segments("abc", undefined, "right"), [{ text: "abc" }]);
});
