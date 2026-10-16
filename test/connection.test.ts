// openAfter: when a ConnectionCard opens itself
import assert from "node:assert/strict";
import { test } from "node:test";
import { needsYou, openAfter } from "../src/lib/connection.ts";

test("needsYou: waiting and error only", () => {
	assert.deepEqual((["ok", "waiting", "error", "off"] as const).filter(needsYou), ["waiting", "error"]);
});

test("openAfter: opens when it starts needing you, never closes itself", () => {
	assert.equal(openAfter({ open: false, was: "ok", mark: "waiting" }), true);
	assert.equal(openAfter({ open: false, was: "off", mark: "error" }), true);
	assert.equal(openAfter({ open: true, was: "waiting", mark: "ok" }), true);
	// Still needing you after someone folded it: stays folded
	assert.equal(openAfter({ open: false, was: "waiting", mark: "error" }), false);
	assert.equal(openAfter({ open: false, was: "ok", mark: "off" }), false);
});
