// 语义 token：组件只用这一层。每个都由旋钮推出来，needs 是它要满足的对比度。
import { flatten, type Oklch, solve } from "./color.ts";

export type Mode = "light" | "dark";
/** 一种色调：色相（度）、彩度（0 是纯灰） */
export type Tint = { hue: number; chroma: number };

/** 有固定意思的颜色：状态（要你处理、新的 / 在跑、成功、出错）和改动（新增、修改、重命名；删除就是 destructive） */
export const SIGNALS = ["waiting", "unread", "success", "destructive", "added", "modified", "renamed"] as const;
export type Signal = (typeof SIGNALS)[number];

/** 一个主题：改主题只改这些 */
export type ThemeInput = {
	/** data-theme 的值 */
	name: string;
	/** 一句话：什么样子、给谁用 */
	note: string;
	/** 灰的色调，深浅色分开给（深色里的灰带一点冷色更像「屏幕」而不是「灰纸」） */
	neutral: Record<Mode, Tint>;
	/** 有固定意思的颜色的「实心」那份（点、图标、填色）。深色不给就和浅色一样 */
	signals: Record<Signal, { light: Oklch; dark?: Oklch }>;
	/** 系列色：图表里哪一组、构成图里哪一部分，按顺序用、不循环（相邻两色要过色盲区分度检查） */
	series: Record<Mode, string[]>;
	/** 圆角基准（rem），别的圆角是它的倍数（theme.css） */
	radius: number;
};

/** 面的亮度：从外到里一层比一层亮（浅色）/ 一层比一层浅（深色）。sidebar 最外层，background 主内容板，card / popover 板上的卡片、浮层 */
const SURFACE: Record<Mode, { sidebar: number; background: number; card: number; border: number; input: number; sidebarBorder: number; foreground: number; primary: number; ring: number }> = {
	light: { sidebar: 0.9702, background: 0.9911, card: 1, border: 0.9219, input: 0.9219, sidebarBorder: 0.9219, foreground: 0.1448, primary: 0.2046, ring: 0.708 },
	dark: { sidebar: 0.1548, background: 0.1826, card: 0.2143, border: 0.2694, input: 0.302, sidebarBorder: 0.2401, foreground: 0.9461, primary: 0.9461, ring: 0.556 },
};
/** 叠在面上的半透明层：浅色是黑的、深色是白的，叠在哪层上都比那层深（浅）一点。muted / secondary 是嵌的一层，accent 是悬停 */
const OVERLAY: Record<Mode, { muted: number; accent: number }> = { light: { muted: 0.039, accent: 0.051 }, dark: { muted: 0.051, accent: 0.071 } };
/** subtle：信号色的淡底（diff 的行、徽标的底），实心那份的这么多不透明度 */
const SUBTLE: Record<Mode, number> = { light: 0.12, dark: 0.18 };
/** 灰字的起点（够不够由对比度定，不够就往暗 / 亮挪） */
const MUTED_TEXT: Record<Mode, number> = { light: 0.5555, dark: 0.65 };

/** 文字要达到的对比度（WCAG 2）：正文 7（AAA），次要的字、有意思的颜色当字用 4.5（AA） */
export const TEXT = { strong: 7, normal: 4.5 } as const;

/** 一个 token：名字（CSS 变量，不带 --）、用途、两种模式的值；needs：[对比度, 要和哪些 token 比] */
export type Role = { name: string; doc: string; value: Record<Mode, Oklch>; needs?: [number, string[]] };

const gray = (t: Tint, l: number, alpha?: number): Oklch => (alpha === undefined ? { l, c: t.chroma, h: t.hue } : { l, c: 0, h: 0, alpha });

/** 主题 → 全部 token。顺序就是生成的 CSS 里的顺序 */
export function roles(theme: ThemeInput): Role[] {
	const by = (f: (mode: Mode) => Oklch): Record<Mode, Oklch> => ({ light: f("light"), dark: f("dark") });
	const s = (mode: Mode) => SURFACE[mode];
	const n = (mode: Mode, l: number) => gray(theme.neutral[mode], l);
	const surfaces = (mode: Mode) => [n(mode, s(mode).background), n(mode, s(mode).card), n(mode, s(mode).sidebar)];
	/** muted 叠在 background 上：代码块、徽标的底，灰字也要在上面读得清 */
	const mutedBg = (mode: Mode) => flatten(gray(theme.neutral[mode], ink(mode), OVERLAY[mode].muted), n(mode, s(mode).background));
	const away = (mode: Mode) => (mode === "light" ? "darker" : "lighter");
	const ink = (mode: Mode) => (mode === "light" ? 0 : 1);
	const SURFACES = ["background", "card", "popover", "sidebar"];

	const list: Role[] = [
		{ name: "sidebar", doc: "最外层：侧栏", value: by((m) => n(m, s(m).sidebar)) },
		{ name: "background", doc: "主内容板", value: by((m) => n(m, s(m).background)) },
		{ name: "card", doc: "卡片", value: by((m) => n(m, s(m).card)) },
		{ name: "popover", doc: "菜单、浮层、对话框", value: by((m) => n(m, s(m).card)) },
		{ name: "foreground", doc: "正文", value: by((m) => n(m, s(m).foreground)), needs: [TEXT.strong, SURFACES] },
		{ name: "card-foreground", doc: "卡片上的正文", value: by((m) => n(m, s(m).foreground)), needs: [TEXT.strong, ["card"]] },
		{ name: "popover-foreground", doc: "浮层上的正文", value: by((m) => n(m, s(m).foreground)), needs: [TEXT.strong, ["popover"]] },
		{ name: "sidebar-foreground", doc: "侧栏上的字", value: by((m) => n(m, s(m).foreground)), needs: [TEXT.strong, ["sidebar"]] },
		{ name: "muted-foreground", doc: "次要的字：时间、说明", value: by((m) => solve(n(m, MUTED_TEXT[m]), TEXT.normal, [...surfaces(m), mutedBg(m)], away(m))), needs: [TEXT.normal, [...SURFACES, "muted"]] },
		{ name: "primary", doc: "主按钮的底", value: by((m) => n(m, s(m).primary)) },
		{ name: "primary-foreground", doc: "主按钮的字", value: by((m) => n(m, m === "light" ? 1 : s(m).background)), needs: [TEXT.normal, ["primary"]] },
		{ name: "secondary", doc: "次按钮的底，半透明", value: by((m) => gray(theme.neutral[m], ink(m), OVERLAY[m].muted)) },
		{ name: "secondary-foreground", doc: "次按钮的字", value: by((m) => n(m, s(m).foreground)), needs: [TEXT.strong, ["secondary"]] },
		{ name: "muted", doc: "嵌的一层：代码、徽标，半透明", value: by((m) => gray(theme.neutral[m], ink(m), OVERLAY[m].muted)) },
		{ name: "accent", doc: "悬停、选中，半透明", value: by((m) => gray(theme.neutral[m], ink(m), OVERLAY[m].accent)) },
		{ name: "accent-foreground", doc: "悬停、选中那一层上的字", value: by((m) => n(m, s(m).foreground)), needs: [TEXT.strong, ["accent"]] },
		{ name: "sidebar-accent", doc: "侧栏里悬停、选中的一行", value: by((m) => gray(theme.neutral[m], ink(m), OVERLAY[m].accent)) },
		{ name: "sidebar-accent-foreground", doc: "侧栏里选中那一行的字", value: by((m) => n(m, s(m).foreground)), needs: [TEXT.strong, ["sidebar-accent"]] },
		{ name: "sidebar-primary", doc: "侧栏里最强的一层", value: by((m) => n(m, s(m).primary)) },
		{ name: "sidebar-primary-foreground", doc: "侧栏里最强那一层上的字", value: by((m) => n(m, m === "light" ? 1 : s(m).background)), needs: [TEXT.normal, ["sidebar-primary"]] },
		{ name: "border", doc: "分隔线、卡片边", value: by((m) => n(m, s(m).border)) },
		{ name: "input", doc: "输入框的边", value: by((m) => n(m, s(m).input)) },
		{ name: "sidebar-border", doc: "侧栏里的分隔线", value: by((m) => n(m, s(m).sidebarBorder)) },
		{ name: "ring", doc: "焦点环", value: by((m) => n(m, s(m).ring)) },
		{ name: "sidebar-ring", doc: "侧栏里的焦点环", value: by((m) => n(m, s(m).ring)) },
	];

	for (const sig of SIGNALS) {
		const solid = (m: Mode) => theme.signals[sig][m] ?? theme.signals[sig].light;
		const subtle = (m: Mode): Oklch => ({ ...solid(m), alpha: SUBTLE[m] });
		const what = SIGNAL_DOC[sig];
		list.push(
			{ name: sig, doc: `${what}：点、图标`, value: by(solid) },
			{
				name: `${sig}-strong`,
				doc: `${what}：字`,
				value: by((m) => solve(solid(m), TEXT.normal, [...surfaces(m), flatten(subtle(m), n(m, s(m).background))], away(m))),
				needs: [TEXT.normal, [...SURFACES, `${sig}-subtle`]],
			},
			{ name: `${sig}-subtle`, doc: `${what}：淡底`, value: by(subtle) },
		);
	}
	return list;
}

/** 有固定意思的颜色各是什么意思（全站一样，不拿来装饰、分类） */
export const SIGNAL_DOC: Record<Signal, string> = {
	waiting: "要你处理",
	unread: "新的、在跑",
	success: "成功",
	destructive: "出错、删除",
	added: "新增",
	modified: "修改",
	renamed: "重命名",
};
