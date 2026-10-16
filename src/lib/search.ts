// Search shared by lists you type into – Command and Combobox: a substring, ignoring case. Tested in test/search.test.ts.

/** Lower case, the way search compares */
export const fold = (s: string) => s.toLocaleLowerCase();

/**
 * How well a value matches what's typed, for cmdk's filter: 1 when it starts with it, 0.5 when it holds it, 0 when not.
 * No fuzzy matching: typing repos shouldn't find something else
 */
export function score(value: string, search: string): number {
	const v = fold(value);
	const q = fold(search.trim());
	return v.startsWith(q) ? 1 : v.includes(q) ? 0.5 : 0;
}

/** Where the typed text shows up: [start, end) pairs, left to right, not overlapping */
export function ranges(s: string, text: string): [number, number][] {
	const q = fold(text.trim());
	if (!q) return [];
	const hay = fold(s);
	const out: [number, number][] = [];
	for (let i = hay.indexOf(q); i !== -1; i = hay.indexOf(q, i + q.length)) out.push([i, i + q.length]);
	return out;
}
