// Writes src/theme/tokens.css. The output is committed; CI regenerates it and diffs.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { themeCss } from "../src/theme/css.ts";
import { THEMES } from "../src/theme/themes.ts";

const out = join(import.meta.dirname, "../src/theme/tokens.css");
const head = "/* Generated – don't edit. Change themes.ts or roles.ts, then pnpm gen. */\n\n";
writeFileSync(out, `${head}${themeCss(THEMES)}\n`);
console.log(`Wrote ${out}`);
