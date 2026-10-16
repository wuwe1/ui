// What InlineDiff works out: words, the diff, changes joined across small gaps, the text decisions make, steps between open changes
import assert from "node:assert/strict";
import { test } from "node:test";
import { changesOf, describe, type DiffSegment, diffWords, resolve, step, suggestedOf, words } from "../src/lib/inline-diff.ts";

const show = (segs: DiffSegment[]) => segs.map((s) => (s.type === "equal" ? s.text : `[-${s.remove}-]{+${s.insert}+}`)).join("");

test("words: Chinese splits into words, English into words and spaces; joined they give the text back", () => {
	const zh = "保温效果长达 12 小时";
	assert.ok(words(zh).length > 4);
	assert.equal(words(zh).join(""), zh);
	assert.deepEqual(words("is now live"), ["is", " ", "now", " ", "live"]);
});

test("diffWords: the same text is one unchanged run; empty is nothing", () => {
	assert.deepEqual(diffWords("一样", "一样"), [{ type: "equal", text: "一样" }]);
	assert.deepEqual(diffWords("", ""), []);
});

test("diffWords: a Chinese edit replaces words, not the whole sentence", () => {
	const segs = diffWords("这款保温杯采用 316 不锈钢内胆，保温效果长达 12 小时。", "这款保温杯采用 316 不锈钢内胆，保温 12 小时。");
	assert.equal(show(segs), "这款保温杯采用 316 不锈钢内胆，保温[-效果长达-]{++} 12 小时。");
});

test("diffWords: removals and insertions side by side are one change", () => {
	const segs = diffWords("It loads a lot faster than before, and", "It loads twice as fast, and");
	assert.equal(show(segs), "It loads [-a lot faster than before-]{+twice as fast+}, and");
	assert.equal(changesOf(segs).length, 1);
});

test("diffWords: two changes one Chinese word apart join; a longer run keeps them apart", () => {
	assert.equal(show(diffWords("杯盖带有防漏设计，放进包里", "杯盖防漏，放进包里")), "杯盖[-带有防漏设计-]{+防漏+}，放进包里");
	const apart = diffWords("非常适合上班族和学生党日常使用", "适合通勤和上学的日常使用");
	assert.ok(changesOf(apart).length >= 1);
	assert.equal(suggestedOf(apart), "适合通勤和上学的日常使用");
});

test("diffWords: changes never join across a line break", () => {
	const segs = diffWords("第一段写完了\n第二段也写完了", "第一段改好了\n第二段也改好了");
	assert.equal(changesOf(segs).length, 2);
	assert.ok(segs.some((s) => s.type === "equal" && s.text.includes("\n")));
});

test("diffWords: accepting every change gives the suggestion, rejecting every one the original", () => {
	const pairs: [string, string][] = [
		["Hi everyone, we are very excited to announce that the new dashboard is now available for all users.", "Hi everyone, the new dashboard is now live for all users."],
		["你是网店助手。根据 1688 的商品页写蝦皮的标题和描述，标题不超过 60 个字。", "你是网店助手。根据 1688 的商品页，为蝦皮台湾站写繁体中文的标题和描述：标题不超过 60 个字，关键词放前面。"],
		["", "全新的一段"],
		["要删掉的一段", ""],
		["a b c d e f", "f e d c b a"],
	];
	for (const [a, b] of pairs) {
		const segs = diffWords(a, b);
		const n = changesOf(segs).length;
		assert.equal(resolve(segs, Array(n).fill("accept")), b);
		assert.equal(resolve(segs, Array(n).fill("reject")), a);
		assert.equal(resolve(segs, []), a, "undecided changes keep the original words");
	}
});

test("resolve: each decision applies to its own change", () => {
	const segs = diffWords("保温效果长达 12 小时，非常适合上班族", "保温 12 小时，适合通勤");
	const n = changesOf(segs).length;
	assert.equal(n, 2);
	assert.equal(resolve(segs, ["accept", "reject"]), "保温 12 小时，非常适合上班族");
	assert.equal(resolve(segs, [null, "accept"]), "保温效果长达 12 小时，适合通勤");
});

test("diffWords: texts with almost nothing in common become one change in the middle", () => {
	const a = Array.from({ length: 3000 }, (_, i) => `a${i}`).join(" ");
	const b = Array.from({ length: 3000 }, (_, i) => `b${i}`).join(" ");
	const segs = diffWords(`开头 ${a} 结尾`, `开头 ${b} 结尾`);
	assert.equal(changesOf(segs).length, 1);
	assert.equal(suggestedOf(segs), `开头 ${b} 结尾`);
});

test("describe: what a change does, cut at 40 characters", () => {
	assert.equal(describe({ remove: "available", insert: "live" }), "把「available」改成「live」");
	assert.equal(describe({ remove: "效果长达", insert: "" }), "删掉「效果长达」");
	assert.equal(describe({ remove: "", insert: "、提示词" }), "加上「、提示词」");
	assert.ok(describe({ remove: "长".repeat(50), insert: "" }).endsWith("…」"));
});

test("step: through the open changes, wrapping; from nowhere, the first or the last", () => {
	assert.equal(step([1, 3, 5], 3, 1), 5);
	assert.equal(step([1, 3, 5], 5, 1), 1);
	assert.equal(step([1, 3, 5], 1, -1), 5);
	assert.equal(step([1, 3, 5], null, 1), 1);
	assert.equal(step([1, 3, 5], 4, -1), 5);
	assert.equal(step([], 0, 1), null);
});
