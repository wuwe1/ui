// 主题 → CSS：每个 token 一行 light-dark(浅色, 深色)，深浅由 color-scheme 决定（base.css 里 .dark 换成 dark）。
// 所以套主题不用 JS、也不用写「深色下的这个主题」这种组合选择器：data-theme 套在哪一块，那一块就换；.dark 套在哪一块，那一块就变深。
// 默认主题（THEMES 的第一个）同时写在 :root 上。scripts/gen-theme.ts 用它生成 tokens.css；apply.ts 运行时套自定义主题也用它
import { css } from "./color.ts";
import { roles, type ThemeInput } from "./roles.ts";

/** 一个主题的全部变量：名字（带 --）→ 值 */
export function variables(theme: ThemeInput): Record<string, string> {
	const out: Record<string, string> = {};
	for (const r of roles(theme)) out[`--${r.name}`] = `light-dark(${css(r.value.light)}, ${css(r.value.dark)})`;
	theme.series.light.forEach((c, i) => {
		out[`--series-${i + 1}`] = `light-dark(${c}, ${theme.series.dark[i] ?? c})`;
	});
	out["--radius"] = `${theme.radius}rem`;
	return out;
}

/** 几个主题 → 一段 CSS；第一个是默认 */
export function themeCss(themes: ThemeInput[]): string {
	return themes
		.map((t, i) => {
			const sel = i === 0 ? `:root,\n[data-theme="${t.name}"]` : `[data-theme="${t.name}"]`;
			const body = Object.entries(variables(t)).map(([k, v]) => `\t${k}: ${v};`).join("\n");
			return `/* ${t.name}：${t.note} */\n${sel} {\n${body}\n}`;
		})
		.join("\n\n");
}
