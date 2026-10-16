// Runtime: apply a custom theme, switch modes. Built-in themes need only data-theme.
import { variables } from "./css.ts";
import type { ThemeInput } from "./roles.ts";

/** Writes a theme's variables inline on el, over any data-theme. Returns undo */
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
 * Mode: light and dark are fixed; system follows the OS, live. Sets .dark or .light on el – Tailwind's dark: needs the class.
 * Returns undo, which also stops following the OS
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
