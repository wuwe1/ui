// left: the countdown on an approval card
import assert from "node:assert/strict";
import { test } from "node:test";
import { left } from "../src/lib/approval.ts";

test("over a minute – whole minutes, rounded up", () => {
	assert.deepEqual(left(10 * 60_000, 0), { text: "剩 10 分钟", soon: false });
	assert.deepEqual(left(60_001, 0), { text: "剩 2 分钟", soon: false });
});

test("the last minute – seconds, soon; never negative", () => {
	assert.deepEqual(left(60_000, 0), { text: "剩 60 秒", soon: true });
	assert.deepEqual(left(1_200, 0), { text: "剩 2 秒", soon: true });
	assert.deepEqual(left(0, 5_000), { text: "剩 0 秒", soon: true });
});
