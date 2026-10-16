// 主题的保证：每个内置主题、深浅两种模式下，字的 token 在它要放的每种底上对比度够（roles.ts 的 needs，半透明的底叠在 background 上看）；
// 生成的 tokens.css 是照现在的主题写的；颜色算法本身对得上 WCAG 的例子
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { contrast, css, flatten, fromHex, inGamut, inP3 } from "../src/theme/color.ts";
import { themeCss } from "../src/theme/css.ts";
import { type Mode, roles } from "../src/theme/roles.ts";
import { THEMES } from "../src/theme/themes.ts";

test("颜色算法：黑白 21:1，#767676 在白底上 4.54（WCAG 常用的例子），换算回去不走样", () => {
	assert.equal(contrast(fromHex("#000000"), fromHex("#ffffff")).toFixed(2), "21.00");
	assert.equal(contrast(fromHex("#767676"), fromHex("#ffffff")).toFixed(2), "4.54");
	assert.equal(css(fromHex("#ffffff")), "oklch(1 0 0)");
	assert.ok(inGamut(fromHex("#2a78d6")));
	// Tailwind 的 amber-500 在 sRGB 外面、P3 里面
	assert.ok(!inGamut({ l: 0.769, c: 0.188, h: 70.08 }) && inP3({ l: 0.769, c: 0.188, h: 70.08 }));
});

for (const theme of THEMES) {
	for (const mode of ["light", "dark"] as Mode[]) {
		test(`${theme.name} ${mode === "light" ? "浅色" : "深色"}：每个字的 token 在它要放的底上对比度够`, () => {
			const list = roles(theme);
			const value = new Map(list.map((r) => [r.name, r.value[mode]]));
			const page = value.get("background");
			assert.ok(page);
			for (const r of list) {
				if (!r.needs) continue;
				const [target, unders] = r.needs;
				for (const u of unders) {
					const under = value.get(u);
					assert.ok(under, `${r.name} 要比的 ${u} 不存在`);
					const c = contrast(r.value[mode], flatten(under, page));
					assert.ok(c >= target - 0.01, `${r.name} 在 ${u} 上 ${c.toFixed(2)}，要 ${target}`);
				}
			}
		});
	}
	test(`${theme.name}：系列色深浅各 8 个`, () => {
		assert.equal(theme.series.light.length, 8);
		assert.equal(theme.series.dark.length, 8);
	});
}

test("tokens.css 是照现在的主题生成的（改了 themes.ts、roles.ts 要 pnpm gen）", () => {
	const file = readFileSync(join(import.meta.dirname, "../src/theme/tokens.css"), "utf8");
	assert.equal(file.slice(file.indexOf("\n\n") + 2), `${themeCss(THEMES)}\n`);
});
