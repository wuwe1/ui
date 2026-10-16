// Components color with theme tokens only – what a theme change can't reach is a bug. Fails on palette classes (zinc-500), hex,
// color functions (rgb(), oklch()) and opaque black or white. Allowed: color-mix() of tokens, black or white with an opacity (bg-black/10 – a scrim
// that darkens either mode). Comments may name colors; only code counts
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const ROOT = join(import.meta.dirname, "..");
const DIRS = ["src/components", "src/lib", "src/hooks"];
const PALETTE = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTILITY = "bg|text|border|ring|fill|stroke|from|via|to|outline|shadow|divide|decoration|caret|accent|placeholder";
const RULES: [string, RegExp][] = [
	["palette color", new RegExp(`(?<![\\w-])(?:[a-z]+-)+(?:${PALETTE})-(?:50|[1-9]00|950)\\b`)],
	["hex color", /(?<![\w&])#[0-9a-fA-F]{3,8}\b/],
	["color function", /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/],
	["opaque black or white", new RegExp(`(?<![\\w-])(?:${UTILITY})-(?:black|white)(?![\\w/-])`)],
];

/** Comments blanked out, line numbers kept */
const code = (src: string) =>
	src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|[^:"'`\\])\/\/.*$/gm, (m, lead: string) => lead + " ".repeat(m.length - lead.length));

const broken = (src: string) => RULES.filter(([, re]) => re.test(src)).map(([name]) => name);

test("the rules catch raw colors and let tokens through", () => {
	for (const bad of ["bg-zinc-500", "hover:text-amber-600", "dark:border-sky-950/40", "#fff", "bg-[#1e1e1e]", "rgb(0 0 0 / 0.5)", "oklch(0.5 0 0)", "bg-white", "text-black"])
		assert.ok(broken(bad).length, `should catch ${bad}`);
	for (const ok of ["bg-card", "text-muted-foreground", "border-border/55", "bg-black/10", "hover:bg-white/5", "color-mix(in oklab, var(--border) 55%, transparent)", "bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]", "href: \"https://x.dev\"", "// #fff on white"])
		assert.deepEqual(broken(code(ok)), [], `should allow ${ok}`);
});

test("components, lib and hooks color with tokens only", () => {
	const found: string[] = [];
	for (const dir of DIRS) {
		for (const name of readdirSync(join(ROOT, dir)).filter((f) => /\.tsx?$/.test(f))) {
			code(readFileSync(join(ROOT, dir, name), "utf8"))
				.split("\n")
				.forEach((line, i) => {
					for (const what of broken(line)) found.push(`${dir}/${name}:${i + 1} ${what}: ${line.trim().slice(0, 120)}`);
				});
		}
	}
	assert.deepEqual(found, [], `Use a token (docs/theme.md):\n${found.join("\n")}`);
});
