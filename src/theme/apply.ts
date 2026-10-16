// 运行时套主题、切深浅色。内置主题用不着这里：在任何元素上写 data-theme="paper"，那一块就换了（tokens.css）；
// 这里给的是自定义的主题（展示页拖旋钮调出来的、用户自己存的）和深浅色的偏好
import { variables } from "./css.ts";
import type { ThemeInput } from "./roles.ts";

/** 把一套主题的变量写在 el 的行内样式上（盖过 data-theme 的那套），返回撤销 */
export function applyTheme(theme: ThemeInput, el: HTMLElement = document.documentElement): () => void {
	const vars = variables(theme);
	const old = Object.keys(vars).map((k) => [k, el.style.getPropertyValue(k)] as const);
	for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
	return () => {
		for (const [k, v] of old) {
			if (v) el.style.setProperty(k, v);
			else el.style.removeProperty(k);
		}
	};
}

export type ModePreference = "light" | "dark" | "system";

/**
 * 深浅色：light / dark 写死，system 跟着系统（系统变了也跟着）。在 el 上加 .dark 或 .light（Tailwind 的 dark: 要 class），
 * 返回撤销（system 的也停止跟随）
 */
export function applyMode(pref: ModePreference, el: HTMLElement = document.documentElement): () => void {
	const media = matchMedia("(prefers-color-scheme: dark)");
	const set = () => {
		const dark = pref === "dark" || (pref === "system" && media.matches);
		el.classList.toggle("dark", dark);
		el.classList.toggle("light", !dark);
	};
	set();
	if (pref === "system") media.addEventListener("change", set);
	return () => {
		media.removeEventListener("change", set);
		el.classList.remove("dark", "light");
	};
}
