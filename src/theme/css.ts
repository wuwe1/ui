// 主题 → CSS。每个 token 写成 light-dark(浅, 深)：主题、深浅色能套在任何一块上，不用组合选择器。
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
