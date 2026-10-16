// 颜色算法：OKLCH ↔ sRGB、对比度（WCAG 2）、按对比度求亮度。
// 输出只降到 P3 放得下：广色域屏上照样鲜艳，Chrome 也不会截断跑偏。

/** OKLCH：l 亮度 0–1，c 彩度（sRGB 里一般不超过 0.37），h 色相（度），alpha 不透明度（不写是 1） */
export type Oklch = { l: number; c: number; h: number; alpha?: number };

type Rgb = [number, number, number];

/** OKLCH → 线性 sRGB（可能超出 0–1：在 sRGB 外面） */
export function linear({ l, c, h }: Oklch): Rgb {
	const a = c * Math.cos((h * Math.PI) / 180);
	const b = c * Math.sin((h * Math.PI) / 180);
	const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [
		4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
		-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
		-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
	];
}

const encode = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
const decode = (x: number) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);

/** 在不在 sRGB 里（留一点余量，算出来的边界值会有舍入） */
export function inGamut(o: Oklch): boolean {
	return linear(o).every((x) => x >= -1e-4 && x <= 1 + 1e-4);
}

/** 在不在 Display P3 里：线性 sRGB → XYZ（D65）→ 线性 P3 */
export function inP3(o: Oklch): boolean {
	const [r, g, b] = linear(o);
	const x = 0.4123908 * r + 0.3575843 * g + 0.1804808 * b;
	const y = 0.212639 * r + 0.7151687 * g + 0.0721923 * b;
	const z = 0.0193308 * r + 0.1191948 * g + 0.9505322 * b;
	return [
		2.4934969 * x - 0.9313836 * y - 0.4027108 * z,
		-0.829489 * x + 1.7626641 * y + 0.0236247 * z,
		0.0358458 * x - 0.0761724 * y + 0.9568845 * z,
	].every((v) => v >= -1e-4 && v <= 1 + 1e-4);
}

/** 放不下（sRGB，或者 within 给 inP3）：亮度、色相不动，彩度往下降到刚好放得下（二分） */
export function clampChroma(o: Oklch, within: (o: Oklch) => boolean = inGamut): Oklch {
	if (within(o)) return o;
	let lo = 0;
	let hi = o.c;
	for (let i = 0; i < 24; i++) {
		const mid = (lo + hi) / 2;
		if (within({ ...o, c: mid })) lo = mid;
		else hi = mid;
	}
	return { ...o, c: lo };
}

/** OKLCH → sRGB（0–1，已经编码、夹到范围里） */
export function srgb(o: Oklch): Rgb {
	return linear(clampChroma(o)).map((x) => Math.min(1, Math.max(0, encode(x)))) as Rgb;
}

/** sRGB 的 #rrggbb / #rrggbbaa → OKLCH（校准用：把手挑的旧色值换算过来） */
export function fromHex(hex: string): Oklch {
	const n = hex.replace("#", "");
	const v = [0, 2, 4].map((i) => decode(Number.parseInt(n.slice(i, i + 2), 16) / 255));
	const alpha = n.length === 8 ? Number.parseInt(n.slice(6, 8), 16) / 255 : undefined;
	const l_ = Math.cbrt(0.4122214708 * v[0] + 0.5363325363 * v[1] + 0.0514459929 * v[2]);
	const m_ = Math.cbrt(0.2119034982 * v[0] + 0.6806995451 * v[1] + 0.1073969566 * v[2]);
	const s_ = Math.cbrt(0.0883024619 * v[0] + 0.2817188376 * v[1] + 0.6299787005 * v[2]);
	const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
	const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
	const b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
	const c = Math.hypot(a, b);
	const h = c < 1e-4 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
	return alpha === undefined ? { l: L, c, h } : { l: L, c, h, alpha };
}

/** 半透明的颜色叠到底色上（在 sRGB 里混，和浏览器一样）；底色自己是不透明的 */
function over(fg: Oklch, bg: Rgb): Rgb {
	const a = fg.alpha ?? 1;
	const f = srgb(fg);
	return [0, 1, 2].map((i) => a * f[i] + (1 - a) * bg[i]) as Rgb;
}

/** 编码过的 sRGB（0–1）→ OKLCH */
function fromSrgb(rgb: Rgb): Oklch {
	const hex = rgb.map((x) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, "0")).join("");
	return fromHex(hex);
}

/** 半透明的层叠在不透明的 page 上，眼睛看到的那个颜色（muted 的底、diff 那一行的淡底） */
export function flatten(layer: Oklch, page: Oklch): Oklch {
	return layer.alpha === undefined || layer.alpha >= 1 ? layer : fromSrgb(over(layer, srgb(page)));
}

/** 相对亮度（WCAG 2）：sRGB 解码回线性再加权 */
function luminanceOf(rgb: Rgb): number {
	const [r, g, b] = rgb.map(decode);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG 2 对比度（1–21）。bg 可以是半透明的（muted、accent 这种叠在面上的层），这时给 page：它底下那层面；
 * fg 半透明就叠到（叠好的）bg 上
 */
export function contrast(fg: Oklch, bg: Oklch, page?: Oklch): number {
	const base = bg.alpha !== undefined && bg.alpha < 1 ? over(bg, srgb(page ?? { l: 1, c: 0, h: 0 })) : srgb(bg);
	const a = luminanceOf(over(fg, base));
	const b = luminanceOf(base);
	return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * 按对比度求亮度：色相、彩度照 base（放不下就降彩度），只动亮度，找到和 against 里每一个都至少 target 的、离 from 最近的那个亮度。
 * toward：往暗（浅色模式里的字）还是往亮（深色模式里的字）找。from 本身已经够了就不动
 */
export function solve(base: Oklch, target: number, against: Oklch[], toward: "darker" | "lighter"): Oklch {
	const ok = (l: number) => against.every((bg) => contrast(clampChroma({ ...base, l }), bg) >= target);
	if (ok(base.l)) return base;
	let lo = toward === "darker" ? 0 : base.l;
	let hi = toward === "darker" ? base.l : 1;
	if (!ok(toward === "darker" ? lo : hi)) throw new Error(`达不到对比度 ${target}：${css(base)}`);
	for (let i = 0; i < 30; i++) {
		const mid = (lo + hi) / 2;
		// 往暗找：越暗越够，找最亮的那个够的；往亮找反过来
		if (toward === "darker" ? ok(mid) : !ok(mid)) lo = mid;
		else hi = mid;
	}
	return { ...base, l: toward === "darker" ? lo : hi };
}

const round = (x: number, n: number) => Number(x.toFixed(n));

/** 写成 CSS：oklch(0.556 0 0)、oklch(0 0 0 / 0.04)。彩度降到 P3 放得下（见开头） */
export function css(o: Oklch): string {
	const c = clampChroma(o, inP3);
	const body = `${round(c.l, 4)} ${round(c.c, 4)} ${round(c.c < 1e-4 ? 0 : c.h, 2)}`;
	return c.alpha === undefined || c.alpha >= 1 ? `oklch(${body})` : `oklch(${body} / ${round(c.alpha, 3)})`;
}
