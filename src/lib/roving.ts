// Arrow keys in a row of buttons: which one gets focus next. Pure – test/roving.test.ts.

/** Next index for a key in a row of n, or null when the key isn't ours. Arrows wrap; Home and End jump to the ends */
export function step(key: string, i: number, n: number): number | null {
	if (n <= 0) return null;
	if (key === "ArrowRight") return (i + 1) % n;
	if (key === "ArrowLeft") return (i - 1 + n) % n;
	if (key === "Home") return 0;
	if (key === "End") return n - 1;
	return null;
}
