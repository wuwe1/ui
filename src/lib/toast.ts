// The toast list without React: add or update by id, how long each stays, which ones show. Pure – test/toast.test.ts.

export type ToastKind = "info" | "success" | "error" | "loading";
export type ToastAction = { label: string; onClick: (e: { preventDefault: () => void }) => void };
export type ToastItem = { id: string; kind: ToastKind; title: string; description?: string; action?: ToastAction; duration: number };

/** Toasts on screen at once; older ones wait, their timers still */
export const VISIBLE = 3;

/** How long a toast stays, in ms: loading until it settles; errors and ones with a button longer – there's more to read or do */
export function durationOf(kind: ToastKind, action?: ToastAction, given?: number): number {
	if (given !== undefined) return given;
	if (kind === "loading") return Number.POSITIVE_INFINITY;
	return kind === "error" || action ? 6000 : 4000;
}

/** Newest first. A known id updates in place and keeps its spot; a new one goes on top */
export function upsert(list: ToastItem[], item: ToastItem): ToastItem[] {
	const i = list.findIndex((t) => t.id === item.id);
	if (i < 0) return [item, ...list];
	const next = list.slice();
	next[i] = item;
	return next;
}

/** The ones on screen, newest first, and how many wait behind them */
export function shown(list: ToastItem[]): { visible: ToastItem[]; waiting: number } {
	return { visible: list.slice(0, VISIBLE), waiting: Math.max(0, list.length - VISIBLE) };
}
