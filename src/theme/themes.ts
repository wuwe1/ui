// Built-in themes. Change a theme here, then pnpm gen.
import type { ThemeInput } from "./roles.ts";

/** Default: grayscale, four grays brightening inward (affectUI's base), cool dark grays; color only where it means something */
export const base: ThemeInput = {
	name: "base",
	note: "Grayscale; color only for status and changes",
	neutral: { light: { hue: 0, chroma: 0 }, dark: { hue: 286, chroma: 0.003 } },
	signals: {
		waiting: { light: { l: 0.769, c: 0.188, h: 70.08 } },
		unread: { light: { l: 0.623, c: 0.214, h: 259.815 } },
		success: { light: { l: 0.627, c: 0.17, h: 149.214 }, dark: { l: 0.723, c: 0.192, h: 149.579 } },
		destructive: { light: { l: 0.577, c: 0.245, h: 27.325 }, dark: { l: 0.704, c: 0.191, h: 22.216 } },
		added: { light: { l: 0.596, c: 0.145, h: 163.225 }, dark: { l: 0.765, c: 0.177, h: 163.223 } },
		modified: { light: { l: 0.666, c: 0.179, h: 58.318 }, dark: { l: 0.828, c: 0.189, h: 84.429 } },
		renamed: { light: { l: 0.588, c: 0.158, h: 241.966 }, dark: { l: 0.746, c: 0.16, h: 232.661 } },
	},
	// A reference dataviz palette: neighbors pass a color-blindness check. Dark mode takes the same hues, tuned for dark surfaces
	series: {
		light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"],
		dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
	},
	radius: 0.625,
};

/** Paper: warm grays like ink on paper, tighter corners. Shows a new look from knobs alone */
export const paper: ThemeInput = {
	...base,
	name: "paper",
	note: "Warm grays like ink on paper; tighter corners",
	neutral: { light: { hue: 75, chroma: 0.008 }, dark: { hue: 60, chroma: 0.006 } },
	radius: 0.375,
};

/** Every built-in theme; the first is the default on :root */
export const THEMES: ThemeInput[] = [base, paper];
