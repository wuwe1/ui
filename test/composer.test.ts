// submits, joinSpeech: what Composer decides on its own
import assert from "node:assert/strict";
import { test } from "node:test";
import { joinSpeech, submits } from "../src/lib/composer.ts";

const key = (k: Partial<Parameters<typeof submits>[0]> = {}) => ({ key: "Enter", shiftKey: false, metaKey: false, ctrlKey: false, ...k });

test("submits: ↵ sends with a keyboard, ⇧↵ doesn't; on touch only ⌘↵", () => {
	assert.equal(submits(key(), false), true);
	assert.equal(submits(key({ shiftKey: true }), false), false);
	assert.equal(submits(key(), true), false);
	assert.equal(submits(key({ metaKey: true }), true), true);
	assert.equal(submits(key({ ctrlKey: true }), false), true);
	assert.equal(submits(key({ key: "a" }), false), false);
});

test("submits: never while an input method is composing", () => {
	assert.equal(submits(key({ isComposing: true }), false), false);
	assert.equal(submits(key({ keyCode: 229 }), false), false);
	assert.equal(submits(key({ isComposing: true, metaKey: true }), false), false);
});

test("joinSpeech: a space between Latin words, none around Chinese", () => {
	assert.equal(joinSpeech("", " 你好 "), "你好");
	assert.equal(joinSpeech("改一下", "首页标题"), "改一下首页标题");
	assert.equal(joinSpeech("fix the", "title"), "fix the title");
	assert.equal(joinSpeech("fix ", "title"), "fix title");
	assert.equal(joinSpeech("看 README", "然后改"), "看 README然后改");
	assert.equal(joinSpeech("line\n", "next"), "line\nnext");
	assert.equal(joinSpeech("keep", "  "), "keep");
});
