// Time the way agent UIs show it. Pure – test/time.test.ts.

/** A stopwatch without units: 1.1 under 10 seconds, then 0:12, 2:13, 1:02:13 */
export function elapsed(ms: number): string {
	if (ms < 10_000) return (Math.max(0, Math.floor(ms / 100)) / 10).toFixed(1);
	const s = Math.floor(ms / 1000);
	const mm = `${Math.floor(s / 60) % 60}`;
	const ss = String(s % 60).padStart(2, "0");
	return s < 3600 ? `${mm}:${ss}` : `${Math.floor(s / 3600)}:${mm.padStart(2, "0")}:${ss}`;
}
