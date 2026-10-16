// Theme → CSS. Every token is light-dark(light, dark), so themes and modes apply to any subtree without compound selectors.
import { css } from "./color.ts";
import { roles, type ThemeInput } from "./roles.ts";

/** Every variable of a theme: name with -- → value */
export function variables(theme: ThemeInput): Record<string, string> {
	const out: Record<string, string> = {};
	for (const r of roles(theme)) out[`--${r.name}`] = `light-dark(${css(r.value.light)}, ${css(r.value.dark)})`;
	theme.series.light.forEach((c, i) => {
		out[`--series-${i + 1}`] = `light-dark(${c}, ${theme.series.dark[i] ?? c})`;
	});
	out["--radius"] = `${theme.radius}rem`;
	return out;
}

/** Themes → one stylesheet; the first is the default */
export function themeCss(themes: ThemeInput[]): string {
	return themes
		.map((t, i) => {
			const sel = i === 0 ? `:root,\n[data-theme="${t.name}"]` : `[data-theme="${t.name}"]`;
			const body = Object.entries(variables(t)).map(([k, v]) => `\t${k}: ${v};`).join("\n");
			return `/* ${t.name} – ${t.note} */\n${sel} {\n${body}\n}`;
		})
		.join("\n\n");
}
