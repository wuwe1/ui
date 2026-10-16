// Outline's geometry: how far apart the ticks sit, which ones get drawn, which item a point on the rail means, what's in view. Pure – test/outline.test.ts.

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
