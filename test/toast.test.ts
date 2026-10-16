// durationOf, upsert, shown: what the Toaster keeps and for how long
import assert from "node:assert/strict";
import { test } from "node:test";
import { durationOf, shown, type ToastItem, upsert } from "../src/lib/toast.ts";

const t = (id: string, title = id): ToastItem => ({ id, kind: "info", title, duration: 4000 });

test("durationOf: 4s; errors and buttons 6s; loading stays; a given one wins", () => {
	assert.equal(durationOf("info"), 4000);
	assert.equal(durationOf("success"), 4000);
	assert.equal(durationOf("error"), 6000);
	assert.equal(durationOf("info", { label: "撤销", onClick: () => {} }), 6000);
	assert.equal(durationOf("loading"), Number.POSITIVE_INFINITY);
	assert.equal(durationOf("info", undefined, Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY);
});

test("upsert: new on top, a known id updates in place", () => {
	const l = upsert(upsert([], t("a")), t("b"));
	assert.deepEqual(l.map((x) => x.id), ["b", "a"]);
	const u = upsert(l, t("a", "已更新"));
	assert.deepEqual(u.map((x) => `${x.id}:${x.title}`), ["b:b", "a:已更新"]);
});

test("shown: three newest on screen, the rest wait", () => {
	const l = ["e", "d", "c", "b", "a"].map((id) => t(id));
	assert.deepEqual(shown(l).visible.map((x) => x.id), ["e", "d", "c"]);
	assert.equal(shown(l).waiting, 2);
	assert.equal(shown([]).waiting, 0);
});
