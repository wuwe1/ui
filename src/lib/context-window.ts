// What ContextWindow shows: token counts in 万, which part each cell belongs to, the share used. Pure – test/context-window.test.ts.

/** Tokens the way people read them in Chinese: 4200, 13.3 万 */
export const tokens = (n: number) => (n >= 10_000 ? `${+(n / 10_000).toFixed(1)} 万` : String(Math.round(n)));

/** Which part each of count cells belongs to, in order; one cell is limit / count tokens, any part with tokens gets at least one; the rest are empty (null) */
export function cells(parts: { id: string; tokens: number }[], limit: number, count: number): (string | null)[] {
	const out: (string | null)[] = [];
	for (const p of parts) {
		if (p.tokens <= 0) continue;
		for (let i = 0, n = Math.max(1, Math.round((p.tokens / limit) * count)); i < n && out.length < count; i++) out.push(p.id);
	}
	while (out.length < count) out.push(null);
	return out;
}

/** Percent used, whole, never past 100 */
export const percent = (used: number, limit: number) => (limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0);
