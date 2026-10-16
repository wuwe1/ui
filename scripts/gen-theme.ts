// 生成 src/theme/tokens.css。生成的文件也提交，CI 会再生成一遍对比。
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { themeCss } from "../src/theme/css.ts";
import { THEMES } from "../src/theme/themes.ts";

const out = join(import.meta.dirname, "../src/theme/tokens.css");
const head = "/* 生成的，别手改。改 themes.ts 或 roles.ts，再 pnpm gen。 */\n\n";
writeFileSync(out, `${head}${themeCss(THEMES)}\n`);
console.log(`写好了 ${out}`);
