// groupState and stack: what a tool call group's header shows
import assert from "node:assert/strict";
import { test } from "node:test";
import { groupState, stack, type ToolCallStatus } from "../src/lib/tool-call.ts";

const call = (icon: string, status: ToolCallStatus) => ({ icon, status });

test("groupState: running calls, failures, the last call, done once nothing runs", () => {
	const s = groupState([call("a", "done"), call("b", "failed"), call("c", "running")]);
	assert.equal(s.running.length, 1);
	assert.equal(s.failed, 1);
	assert.equal(s.last?.icon, "c");
	assert.equal(s.done, false);
	assert.equal(groupState([call("a", "done")]).done, true);
	assert.equal(groupState([]).done, false);
});

test("stack: last three distinct icons, newest last; a failed last call marks the newest", () => {
	assert.deepEqual(stack([call("read", "done"), call("bash", "done"), call("read", "done"), call("edit", "done"), call("grep", "done")]).map((t) => t.icon), ["read", "edit", "grep"]);
	assert.deepEqual(stack([call("read", "done"), call("bash", "failed")]), [{ icon: "read", failed: false }, { icon: "bash", failed: true }]);
	assert.deepEqual(stack([call("bash", "failed"), call("read", "done")]), [{ icon: "bash", failed: false }, { icon: "read", failed: false }]);
});
