// Components lift with two shadows – shadow-rest for what rests on a surface, shadow-float for what floats over the page (theme.css) –
// never Tailwind's scale, so every card and every menu lifts the same way. Arbitrary lines (shadow-[0_0_0_1px_…]) and shadow-none pass
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const ROOT = join(import.meta.dirname, "..");
const SCALE = /(?<![\w-])shadow-(?:2xs|xs|sm|md|lg|xl|2xl)(?![\w-])/;

test("the rule catches Tailwind's shadow scale and lets the two tokens through", () => {
	for (const bad of ["shadow-md", "data-open:shadow-lg", "group-data-[variant=floating]:shadow-sm", "shadow-xs ring-1", "md:peer-data-[variant=inset]:shadow-sm"]) assert.ok(SCALE.test(bad), `should catch ${bad}`);
	for (const ok of ["shadow-rest", "shadow-float", "shadow-none", "shadow-[0_0_0_1px_var(--sidebar-border)]", "drop-shadow-md", "inset-shadow-sm"]) assert.ok(!SCALE.test(ok), `should allow ${ok}`);
});

test("components lift with shadow-rest or shadow-float only", () => {
	const found: string[] = [];
	for (const name of readdirSync(join(ROOT, "src/components")).filter((f) => f.endsWith(".tsx"))) {
		readFileSync(join(ROOT, "src/components", name), "utf8")
			.split("\n")
			.forEach((line, i) => {
				const m = SCALE.exec(line);
				if (m) found.push(`src/components/${name}:${i + 1} ${m[0]}`);
			});
	}
	assert.deepEqual(found, [], `Use shadow-rest or shadow-float (docs/theme.md):\n${found.join("\n")}`);
});
