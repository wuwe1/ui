// What PromptLibrary works out: blanks, values, the finished prompt, the next empty blank, search, sections, a template tidied for saving
import assert from "node:assert/strict";
import { test } from "node:test";
import { blanks, fill, groupsOf, matches, missing, nextEmpty, parts, type PromptTemplate, sections, tidy, valuesOf } from "../src/lib/prompt-library.ts";

const T: PromptTemplate = {
	id: "polish",
	title: "抠界面细节",
	group: "界面",
	body: "UI 细节抠一下：{哪里}有问题。改完截图看过，宽度 {宽度}、{模式}；{哪里}改完再看一遍。",
	variables: { 宽度: { default: "390" }, 哪里: { description: "看到问题的地方" } },
};

test("parts: text and blanks in order; names in any script; code braces stay text", () => {
	assert.deepEqual(parts("你接手 {项目}：{path_1}。"), [{ text: "你接手 " }, { name: "项目" }, { text: "：" }, { name: "path_1" }, { text: "。" }]);
	assert.deepEqual(parts("if (a) { return b }"), [{ text: "if (a) { return b }" }]);
	assert.deepEqual(parts("{a}{b}"), [{ name: "a" }, { name: "b" }]);
});

test("blanks: first appearance, a name used twice once", () => {
	assert.deepEqual(blanks(T.body), ["哪里", "宽度", "模式"]);
});

test("valuesOf and missing: typed beats default; spaces don't fill", () => {
	const v = valuesOf(T, { 模式: "  " });
	assert.deepEqual(v, { 哪里: "", 宽度: "390", 模式: "  " });
	assert.deepEqual(missing(T, v), ["哪里", "模式"]);
	assert.deepEqual(missing(T, valuesOf(T, { 哪里: "侧栏", 模式: "深色" })), []);
});

test("fill: values trimmed, every use of a name filled, empty blanks kept as written", () => {
	assert.equal(fill(T.body, { 哪里: " 侧栏 ", 宽度: "390" }), "UI 细节抠一下：侧栏有问题。改完截图看过，宽度 390、{模式}；侧栏改完再看一遍。");
});

test("nextEmpty: after the current one, wrapping; null once all are filled", () => {
	const names = ["a", "b", "c"];
	assert.equal(nextEmpty(names, { a: "", b: "x", c: "" }, "a"), "c");
	assert.equal(nextEmpty(names, { a: "", b: "x", c: "x" }, "c"), "a");
	assert.equal(nextEmpty(names, { a: "", b: "", c: "" }, null), "a");
	assert.equal(nextEmpty(names, { a: "x", b: "x", c: "x" }, "a"), null);
	assert.equal(nextEmpty(names, { a: "x", b: "x", c: "" }, "c"), null, "the current blank doesn't count");
});

test("matches: every word somewhere in title, group or body, case aside", () => {
	assert.ok(matches(T, "界面 截图"));
	assert.ok(matches({ ...T, title: "Release Notes" }, "release"));
	assert.ok(!matches(T, "界面 penna"));
	assert.ok(matches(T, "  "));
});

test("sections: groups in order of first appearance; no group – a section with no name", () => {
	const ts: PromptTemplate[] = [
		{ id: "1", title: "a", group: "交接", body: "" },
		{ id: "2", title: "b", body: "" },
		{ id: "3", title: "c", group: "界面", body: "" },
		{ id: "4", title: "d", group: "交接 ", body: "" },
	];
	assert.deepEqual(
		sections(ts).map((s) => [s.group, s.templates.map((t) => t.id)]),
		[["交接", ["1", "4"]], [null, ["2"]], ["界面", ["3"]]],
	);
	assert.deepEqual(groupsOf(ts), ["交接", "界面"]);
});

test("tidy: trimmed, variables only for blanks in the body, empty fields dropped", () => {
	const t = tidy({
		id: "x",
		title: " 接手项目 ",
		group: "  ",
		body: " 你接手 {项目}。\n",
		variables: { 项目: { description: " 项目名 ", default: "" }, 旧的: { description: "删掉的空" }, 空的: {} },
	});
	assert.deepEqual(t, { id: "x", title: "接手项目", body: "你接手 {项目}。", variables: { 项目: { description: "项目名" } } });
	assert.deepEqual(tidy({ id: "y", title: "提交", body: "提交", variables: { 提交: { default: "x" } } }), { id: "y", title: "提交", body: "提交" });
});
