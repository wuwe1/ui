// What UsageMeter and UsageSummary work out from a plan's windows. Pure – test/usage-meter.test.ts.

/** A limit window. used 0–1; resetsAt in ms, null when unknown; span – its length in ms, for the tick and the run-out guess */
export type UsageWindow = { label: string; used: number; resetsAt: number | null; span?: number };

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const WEEKDAY = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/** Still counting: past its reset, a window's number is old until the next update */
export const live = (w: UsageWindow, now: number) => w.resetsAt === null || w.resetsAt > now;

/** Percent, rounded, 0–100 */
export const percent = (used: number) => Math.round(Math.min(1, Math.max(0, used)) * 100);

/** How far the window's time has gone, 0–1 – where the tick sits. Null without span or reset */
export function elapsed(w: UsageWindow, now: number): number | null {
	if (!w.span || w.resetsAt === null) return null;
	return Math.min(1, Math.max(0, (now - (w.resetsAt - w.span)) / w.span));
}

/** When it runs out at the pace since the window opened. Only past half used, and only when that lands a minute or more before the reset */
export function runOut(w: UsageWindow, now: number): number | null {
	if (!w.span || w.resetsAt === null || !live(w, now) || w.used < 0.5 || w.used >= 1) return null;
	const start = w.resetsAt - w.span;
	if (now <= start) return null;
	const t = start + (now - start) / w.used;
	return t < w.resetsAt - MIN ? t : null;
}

/** How loudly a window speaks: 0 quiet, 1 past warnAt, 2 runs out early, 3 used up */
export function level(w: UsageWindow, now: number, warnAt: number): 0 | 1 | 2 | 3 {
	if (!live(w, now)) return 0;
	if (w.used >= 1) return 3;
	if (runOut(w, now) !== null) return 2;
	return w.used >= warnAt ? 1 : 0;
}

const hm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const midnight = (ms: number) => {
	const d = new Date(ms);
	return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

/** A time ahead, as people read it: 17:00, 明天 08:00, 周日 08:00, then 10/23 08:00 */
export function when(ms: number, now: number): string {
	const d = new Date(ms);
	// Rounded: a day with a DST change is 23 or 25 hours
	const days = Math.round((midnight(ms) - midnight(now)) / DAY);
	if (days === 0) return hm(d);
	if (days === 1) return `明天 ${hm(d)}`;
	if (days > 1 && days < 7) return `${WEEKDAY[d.getDay()]} ${hm(d)}`;
	return `${d.getMonth() + 1}/${d.getDate()} ${hm(d)}`;
}

/** How old the numbers are: 刚刚更新, 4 分钟前更新, 2 小时前更新, 3 天前更新, then 10/3 更新 */
export function updated(at: number, now: number): string {
	const s = (now - at) / 1000;
	if (s < 60) return "刚刚更新";
	if (s < 3600) return `${Math.floor(s / 60)} 分钟前更新`;
	if (s < 86_400) return `${Math.floor(s / 3600)} 小时前更新`;
	if (s < 86_400 * 7) return `${Math.floor(s / 86_400)} 天前更新`;
	const d = new Date(at);
	return `${d.getMonth() + 1}/${d.getDate()} 更新`;
}

/**
 * The window one line should show: one used up – the last to come back – else one that runs out early – the soonest – else the most used.
 * Ties go to the first. Null when no window is live
 */
export function urgent<A extends { windows?: UsageWindow[] }>(accounts: A[], now: number): { account: A; window: UsageWindow; out: number | null } | null {
	type Pick = { account: A; window: UsageWindow; out: number | null };
	let full: Pick | null = null;
	let early: Pick | null = null;
	let most: Pick | null = null;
	const back = (w: UsageWindow) => w.resetsAt ?? Number.POSITIVE_INFINITY;
	for (const account of accounts)
		for (const window of account.windows ?? []) {
			if (!live(window, now)) continue;
			const x: Pick = { account, window, out: runOut(window, now) };
			if (window.used >= 1 && (!full || back(window) > back(full.window))) full = x;
			if (x.out !== null && (!early || x.out < (early.out ?? 0))) early = x;
			if (!most || window.used > most.window.used) most = x;
		}
	return full ?? early ?? most;
}
