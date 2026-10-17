// stepTitle and runLabel: what a Run's steps and header say. The narrations are real ones from a Claude Code session
import assert from "node:assert/strict";
import { test } from "node:test";
import { runLabel, sentences, stepTitle } from "../src/lib/run.ts";

test("stepTitle: the last sentence – the first ones report the step before", () => {
	assert.equal(stepTitle("类型检查过了。UsageMeter 里还有 3 处像托盘的写法，看一下。"), "UsageMeter 里还有 3 处像托盘的写法，看一下");
	assert.equal(stepTitle("检查和测试都过了。截「改后」，和「改前」逐页并排对比。"), "截「改后」，和「改前」逐页并排对比");
	assert.equal(stepTitle("先在临时 mixer 里试一遍这个 block。"), "先在临时 mixer 里试一遍这个 block");
});

test("stepTitle: code and bold marks dropped, a closing colon trimmed, a question mark kept", () => {
	assert.equal(stepTitle("8 个组件都换成了 `Tray`，126 个测试全过。写 `Tray` 的规格和展示页，主题文档补上「两档阴影」。"), "写 Tray 的规格和展示页，主题文档补上「两档阴影」");
	assert.equal(stepTitle("「改前」截好了（14 页 × 3 种宽度和深浅色，共 42 张）。现在加阴影 token："), "现在加阴影 token");
	assert.equal(stepTitle("两条提示词已经加好了。mixer 自己的页面代码里，有没有也在用 Tailwind 默认阴影的？"), "mixer 自己的页面代码里，有没有也在用 Tailwind 默认阴影的？");
	assert.equal(stepTitle("Now the **important** part:"), "Now the important part");
});

test("stepTitle: English, line breaks, numbers with dots", () => {
	assert.equal(stepTitle("The tests pass. Now fix the lint errors."), "Now fix the lint errors");
	assert.equal(stepTitle("好。\n\n先看 roles.ts"), "先看 roles.ts");
	assert.equal(stepTitle("升级到 v1.2.3 再试"), "升级到 v1.2.3 再试");
});

test("stepTitle: while the agent writes – the sentence in progress; nothing said – empty", () => {
	assert.equal(stepTitle("先提交。确认一下组件库的改动都"), "确认一下组件库的改动都");
	assert.equal(stepTitle(""), "");
	assert.equal(stepTitle("  \n "), "");
});

test("sentences: cut after 。！？!?, after a period and a space, at line breaks", () => {
	assert.deepEqual(sentences("一。二！三？四"), ["一。", "二！", "三？", "四"]);
	assert.deepEqual(sentences("One. Two!\nThree"), ["One.", "Two!", "Three"]);
});

test("runLabel: a status – running, done, or where it was interrupted", () => {
	assert.equal(runLabel("running", 3), "正在执行第 3 步");
	assert.equal(runLabel("running", 0), "正在执行第 1 步");
	assert.equal(runLabel("done", 18), "已完成 18 步");
	assert.equal(runLabel("stopped", 5), "已中断于第 5 步");
	assert.equal(runLabel("failed", 5), "出错于第 5 步");
});
