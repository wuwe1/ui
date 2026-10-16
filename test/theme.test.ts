// What the theme guarantees: in every built-in theme and both modes, each text and line token meets its contrast on every surface it sits on
// (needs in roles.ts, per mode for lines; translucent surfaces flattened over background); tokens.css matches the themes; the color math matches WCAG's examples
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { contrast, css, flatten, fromHex, inGamut, inP3 } from "../src/theme/color.ts";
import { themeCss } from "../src/theme/css.ts";
import { type Mode, needOf, roles } from "../src/theme/roles.ts";
import { THEMES } from "../src/theme/themes.ts";

test("color math: black on white is 21:1, #767676 on white 4.54 (the usual WCAG example), round trips hold", () => {
	assert.equal(contrast(fromHex("#000000"), fromHex("#ffffff")).toFixed(2), "21.00");
	assert.equal(contrast(fromHex("#767676"), fromHex("#ffffff")).toFixed(2), "4.54");
	assert.equal(css(fromHex("#ffffff")), "oklch(1 0 0)");
	assert.ok(inGamut(fromHex("#2a78d6")));
	// Tailwind's amber-500 is outside sRGB, inside P3
	assert.ok(!inGamut({ l: 0.769, c: 0.188, h: 70.08 }) && inP3({ l: 0.769, c: 0.188, h: 70.08 }));
});

for (const theme of THEMES) {
	for (const mode of ["light", "dark"] as Mode[]) {
		test(`${theme.name} ${mode}: every text and line token meets its contrast on its surfaces`, () => {
			const list = roles(theme);
			const value = new Map(list.map((r) => [r.name, r.value[mode]]));
			const page = value.get("background");
			assert.ok(page);
			for (const r of list) {
				const target = needOf(r, mode);
				if (!r.needs || target === undefined) continue;
				const unders = r.needs[1];
				for (const u of unders) {
					const under = value.get(u);
					assert.ok(under, `${r.name} sits on ${u}, which doesn't exist`);
					const c = contrast(r.value[mode], flatten(under, page));
					assert.ok(c >= target - 0.01, `${r.name} on ${u} is ${c.toFixed(2)}, needs ${target}`);
				}
			}
		});
	}
	test(`${theme.name}: 8 series colors per mode`, () => {
		assert.equal(theme.series.light.length, 8);
		assert.equal(theme.series.dark.length, 8);
	});
}

test("tokens.css matches the themes (pnpm gen after changing themes.ts or roles.ts)", () => {
	const file = readFileSync(join(import.meta.dirname, "../src/theme/tokens.css"), "utf8");
	assert.equal(file.slice(file.indexOf("\n\n") + 2), `${themeCss(THEMES)}\n`);
});
