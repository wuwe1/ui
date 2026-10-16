// What DecisionInbox works out: the next decision to open, keys among the waiting, answers, accepting the rest, the final list
import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptRest, answerOf, byDecision, canAcceptRest, final, labelOf, moveOf, nextOf, noteRequired } from "../src/lib/decision-inbox.ts";

const OPTIONS = [{ id: "keep", label: "保留" }, { id: "drop", label: "删除" }, { id: "edit", label: "修改", note: "改成什么" }];
const ask = (id: string, proposed?: string) => ({ id, options: OPTIONS, proposed });
const LIST = [ask("a", "keep"), ask("b", "drop"), ask("c", "edit"), ask("d")];

test("labelOf: an option that opens a field ends with …", () => {
	assert.equal(labelOf(OPTIONS[1]!), "删除");
	assert.equal(labelOf(OPTIONS[2]!), "修改…");
});

test("answerOf: keeps the proposal, trims the note and drops an empty one", () => {
	assert.deepEqual(answerOf(LIST[1]!, "keep"), { decision: "b", option: "keep", proposed: "drop" });
	assert.deepEqual(answerOf(LIST[2]!, "edit", "  只留结论 "), { decision: "c", option: "edit", note: "只留结论", proposed: "edit" });
	assert.deepEqual(answerOf(LIST[3]!, "edit", "   "), { decision: "d", option: "edit" });
});

test("nextOf: the next waiting after the answered one, else back to the first waiting", () => {
	const answers = byDecision([answerOf(LIST[1]!, "drop")]);
	assert.equal(nextOf(LIST, answers, "b"), "c");
	assert.equal(nextOf(LIST, { ...answers, d: answerOf(LIST[3]!, "keep") }, "d"), "a");
	assert.equal(nextOf(LIST, {}, null), "a");
	assert.equal(nextOf(LIST, byDecision(LIST.map((d) => answerOf(d, "keep"))), "a"), null);
});

test("moveOf: arrows wrap, Home and End jump, other keys aren't ours", () => {
	const ids = ["a", "c", "d"];
	assert.equal(moveOf(ids, "a", "ArrowDown"), "c");
	assert.equal(moveOf(ids, "a", "ArrowUp"), "d");
	assert.equal(moveOf(ids, "d", "ArrowDown"), "a");
	assert.equal(moveOf(ids, null, "ArrowUp"), "d");
	assert.equal(moveOf(ids, "c", "Home"), "a");
	assert.equal(moveOf(ids, "c", "End"), "d");
	assert.equal(moveOf([], "c", "End"), null);
	assert.equal(moveOf(ids, "a", "Enter"), undefined);
});

test("noteRequired: an option with a note needs its sentence, unless it's the proposal", () => {
	assert.equal(noteRequired(LIST[0]!, OPTIONS[2]!), true);
	assert.equal(noteRequired(LIST[2]!, OPTIONS[2]!), false);
	assert.equal(noteRequired(LIST[2]!, OPTIONS[0]!), false);
});

test("acceptRest: answers the waiting with their proposals, a proposal with a note without one; no proposal keeps waiting", () => {
	const before = byDecision([answerOf(LIST[0]!, "drop")]);
	const after = acceptRest(LIST, before);
	assert.deepEqual(after.a, before.a);
	assert.deepEqual(after.b, { decision: "b", option: "drop", proposed: "drop" });
	assert.deepEqual(after.c, { decision: "c", option: "edit", proposed: "edit" });
	assert.equal(after.d, undefined);
	assert.equal(canAcceptRest(LIST, before), true);
	assert.equal(canAcceptRest(LIST, after), false);
});

test("final: one answer per answered decision, in the list's order", () => {
	const answers = byDecision([answerOf(LIST[3]!, "keep"), answerOf(LIST[0]!, "drop")]);
	assert.deepEqual(
		final(LIST, answers).map((a) => a.decision),
		["a", "d"],
	);
});
