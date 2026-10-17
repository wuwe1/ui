// Outline's geometry: how far apart the ticks sit, which ones get drawn, which item a point on the rail means, what's in view, where each item goes when they spread. Pure – test/outline.test.ts.

/** Widest gap between ticks, px – a finger's wider, easier to drag; packed tighter when they don't fit */
export const PITCH = { fine: 8, coarse: 12 };
/** Packed under this many px a tick, only every few are drawn (the ones in view and the pointed one always are) */
export const DENSE = 4;
/** Room above and below the ticks that still counts as the rail */
export const PAD = 12;

/** Gap between ticks for n items in room px */
export const pitchOf = (n: number, room: number, coarse: boolean) => (n ? Math.min(coarse ? PITCH.coarse : PITCH.fine, Math.max(0, room - 2 * PAD) / n) : 0);

/** The item a point y (px from the rail's top) means */
export const indexAt = (y: number, pitch: number, n: number) => Math.max(0, Math.min(n - 1, Math.floor((y - PAD) / (pitch || 1))));

/** The ticks to draw: every one, or every few when packed – plus those in view and the pointed one */
export function marks(n: number, pitch: number, lit: (i: number) => boolean, hot: number | null): number[] {
	const every = pitch >= DENSE ? 1 : Math.ceil(DENSE / (pitch || 1));
	const out: number[] = [];
	for (let i = 0; i < n; i++) if (i % every === 0 || lit(i) || hot === i) out.push(i);
	return out;
}

/** What's in view: tops of the items (px, in order) against the box – a is the item the reading line is in, b the last whose top shows */
export function inView(tops: number[], box: { top: number; bottom: number }, read = 96): { a: number; b: number } | null {
	const line = box.top + Math.min(read, (box.bottom - box.top) / 4) + 2;
	let a: number | undefined;
	let b: number | undefined;
	for (let i = 0; i < tops.length; i++) {
		const y = tops[i] ?? 0;
		if (y >= box.bottom - 24) break;
		if (y <= line || a === undefined) a = i;
		b = i;
	}
	return a === undefined || b === undefined ? null : { a, b };
}


/**
 * Hovered, the ticks spread like a dock under the pointer: the item there gets ROW px, its neighbours less, falling off as a bell SIGMA items wide;
 * the rest sit PITCH px apart when the column has room – enough for a small label each – packed tighter when it hasn't
 */
export const SPREAD = { pitch: 16, row: 28, sigma: 1.5 };

/** How near an item d items from the focus is: 1 there, falling off as a bell */
export const nearness = (d: number) => Math.exp(-(d * d) / (2 * SPREAD.sigma ** 2));

/** Abramowitz–Stegun 7.1.26, to 1e-7 */
function erf(x: number) {
	const t = 1 / (1 + 0.3275911 * Math.abs(x));
	const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
	return Math.sign(x) * y;
}
/** How far the bell pushes an item d items from the focus, per px of extra room: the integral of nearness from 0 to d */
const push = (d: number) => SPREAD.sigma * Math.sqrt(Math.PI / 2) * erf(d / (SPREAD.sigma * Math.SQRT2));

export type SpreadRail = { top: number; pitch: number };

/** The rail spread out: its pitch, and its top so item i (fractional) stays at y – kept inside a column room px tall */
export function spreadRail(n: number, i: number, y: number, room: number): SpreadRail {
	const pitch = n ? Math.min(SPREAD.pitch, Math.max(0, room - 2 * PAD) / n) : 0;
	const h = n * pitch + 2 * PAD;
	return { pitch, top: Math.max(0, Math.min(room - h, y - PAD - (i + 0.5) * pitch)) };
}

/** The focus at y (px from the column's top) on the spread rail: a fractional index */
export const focusAt = (y: number, rail: SpreadRail, n: number) => Math.max(0, Math.min(n - 1, (y - rail.top - PAD) / (rail.pitch || 1) - 0.5));

/**
 * Every item around the focus p: where it sits (px from the column's top), how near it is (1 at p), and the room around it – the smaller gap to a neighbour.
 * The focus stays where it was on the rail, so what's under the pointer is what's big; pushed past the column's ends, that side squeezes toward the focus
 */
export function spreadAt(n: number, p: number, rail: SpreadRail, room: number): { y: number[]; near: number[]; gap: number[] } {
	const at = (j: number) => rail.top + PAD + (j + 0.5) * rail.pitch;
	const mid = at(p);
	const extra = Math.max(0, SPREAD.row - rail.pitch);
	const y = Array.from({ length: n }, (_, j) => at(j) + extra * push(j - p));
	const lo = PAD;
	const hi = room - PAD;
	const first = y[0] ?? mid;
	const last = y[n - 1] ?? mid;
	if (first < lo && mid > lo) for (let j = 0; j < n; j++) if ((y[j] ?? 0) < mid) y[j] = mid - (mid - (y[j] ?? 0)) * ((mid - lo) / (mid - first));
	if (last > hi && mid < hi) for (let j = 0; j < n; j++) if ((y[j] ?? 0) > mid) y[j] = mid + ((y[j] ?? 0) - mid) * ((hi - mid) / (last - mid));
	const near = y.map((_, j) => nearness(j - p));
	const gap = y.map((v, j) => Math.min(j > 0 ? v - (y[j - 1] ?? 0) : Number.POSITIVE_INFINITY, j < n - 1 ? (y[j + 1] ?? 0) - v : Number.POSITIVE_INFINITY));
	return { y, near, gap };
}
