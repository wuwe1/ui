// What MemoryPanel shows: counts per group, the rows a filter and a search leave, the tray line. Pure – test/memory-panel.test.ts.

export type MemoryItem = { id: string; text: string; detail?: string; group: string; source?: string; date?: string; paused?: boolean };
export type MemoryGroup = { id: string; label: string; hint?: string };

/** How many per group, and in all */
export function counts(items: MemoryItem[]): Record<string, number> {
	const c: Record<string, number> = { all: items.length };
	for (const m of items) c[m.group] = (c[m.group] ?? 0) + 1;
	return c;
}

/** The rows a group filter ("all" for none) and a search leave; the search reads the text and the detail, case-insensitive */
export function visible(items: MemoryItem[], group: string, query: string): MemoryItem[] {
	const q = query.trim().toLowerCase();
	return items.filter((m) => (group === "all" || m.group === group) && (!q || m.text.toLowerCase().includes(q) || (m.detail ?? "").toLowerCase().includes(q)));
}

/** The tray's resting line: 「12 条 memory，2 条已暂停」 */
export function trayLine(items: MemoryItem[]): string {
	const paused = items.filter((m) => m.paused).length;
	return `${items.length} 条 memory${paused ? `，${paused} 条已暂停` : ""}`;
}

/** A memory's text cut for the tray: 「已忘掉「Prefers TypeScript…」」 */
export const short = (text: string, n = 18) => {
	const one = text.replace(/\s+/g, " ").trim();
	return one.length > n ? `${one.slice(0, n)}…` : one;
};
