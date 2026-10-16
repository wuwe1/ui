// 生成 src/theme/tokens.css：照 src/theme/themes.ts 的主题推出全部 token（css.ts）。改了主题或推的办法（roles.ts）后跑 pnpm gen；
// 生成的文件也提交（用的项目不用跑脚本），CI 里再生成一遍对比，没跑 gen 就提交的会挂
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { themeCss } from "../src/theme/css.ts";
import { THEMES } from "../src/theme/themes.ts";

const out = join(import.meta.dirname, "../src/theme/tokens.css");
const head = "/* 生成的，别手改：改 src/theme/themes.ts（旋钮）或 roles.ts（怎么推），再 pnpm gen。docs/theme.md */\n\n";
writeFileSync(out, `${head}${themeCss(THEMES)}\n`);
console.log(`写好了 ${out}`);
