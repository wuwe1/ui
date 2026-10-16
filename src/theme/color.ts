// Color math: OKLCH ↔ sRGB, WCAG 2 contrast, solving lightness for a contrast target.
// Output is clamped to P3 only – vivid on wide-gamut screens, and Chrome never clips a hue off course.

/** OKLCH: l lightness 0–1, c chroma (rarely above 0.37 in sRGB), h hue in degrees, alpha opacity (1 when absent) */
export type Oklch = { l: number; c: number; h: number; alpha?: number };

type Rgb = [number, number, number];

/** OKLCH → linear sRGB; outside 0–1 means outside sRGB */
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

/** Inside sRGB, with a little slack for rounding at the edge */
export function inGamut(o: Oklch): boolean {
	return linear(o).every((x) => x >= -1e-4 && x <= 1 + 1e-4);
}

/** Inside Display P3: linear sRGB → XYZ (D65) → linear P3 */
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

/** Out of gamut (sRGB, or inP3 via within): keeps lightness and hue, lowers chroma until it fits (bisection) */
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

/** OKLCH → encoded sRGB, clamped to 0–1 */
export function srgb(o: Oklch): Rgb {
	return linear(clampChroma(o)).map((x) => Math.min(1, Math.max(0, encode(x)))) as Rgb;
}

/** #rrggbb or #rrggbbaa → OKLCH – for porting hand-picked colors */
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

/** A translucent color over an opaque one, mixed in sRGB like browsers do */
function over(fg: Oklch, bg: Rgb): Rgb {
	const a = fg.alpha ?? 1;
	const f = srgb(fg);
	return [0, 1, 2].map((i) => a * f[i] + (1 - a) * bg[i]) as Rgb;
}

/** Encoded sRGB (0–1) → OKLCH */
function fromSrgb(rgb: Rgb): Oklch {
	const hex = rgb.map((x) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, "0")).join("");
	return fromHex(hex);
}

/** The color you see when a translucent layer sits on an opaque page – muted fills, diff tints */
export function flatten(layer: Oklch, page: Oklch): Oklch {
	return layer.alpha === undefined || layer.alpha >= 1 ? layer : fromSrgb(over(layer, srgb(page)));
}

/** Relative luminance (WCAG 2): decode sRGB to linear, then weight */
function luminanceOf(rgb: Rgb): number {
	const [r, g, b] = rgb.map(decode);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG 2 contrast, 1–21. A translucent bg (muted, accent) needs page – the surface under it.
 * A translucent fg is laid over the flattened bg
 */
export function contrast(fg: Oklch, bg: Oklch, page?: Oklch): number {
	const base = bg.alpha !== undefined && bg.alpha < 1 ? over(bg, srgb(page ?? { l: 1, c: 0, h: 0 })) : srgb(bg);
	const a = luminanceOf(over(fg, base));
	const b = luminanceOf(base);
	return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * Solves lightness for contrast: keeps base's hue and chroma (lowered if out of gamut) and moves only lightness, to the value
 * nearest base that reaches target against every color in against. toward – darker for light-mode text, lighter for dark.
 * base already passes – returned as is
 */
export function solve(base: Oklch, target: number, against: Oklch[], toward: "darker" | "lighter"): Oklch {
	const ok = (l: number) => against.every((bg) => contrast(clampChroma({ ...base, l }), bg) >= target);
	if (ok(base.l)) return base;
	let lo = toward === "darker" ? 0 : base.l;
	let hi = toward === "darker" ? base.l : 1;
	if (!ok(toward === "darker" ? lo : hi)) throw new Error(`Contrast ${target} is out of reach: ${css(base)}`);
	for (let i = 0; i < 30; i++) {
		const mid = (lo + hi) / 2;
		// Toward darker: darker passes more, so keep the lightest that passes; the reverse toward lighter
		if (toward === "darker" ? ok(mid) : !ok(mid)) lo = mid;
		else hi = mid;
	}
	return { ...base, l: toward === "darker" ? lo : hi };
}

const round = (x: number, n: number) => Number(x.toFixed(n));

/** As CSS: oklch(0.556 0 0), oklch(0 0 0 / 0.04). Chroma is clamped to P3 (see the top) */
export function css(o: Oklch): string {
	const c = clampChroma(o, inP3);
	const body = `${round(c.l, 4)} ${round(c.c, 4)} ${round(c.c < 1e-4 ? 0 : c.h, 2)}`;
	return c.alpha === undefined || c.alpha >= 1 ? `oklch(${body})` : `oklch(${body} / ${round(c.alpha, 3)})`;
}
