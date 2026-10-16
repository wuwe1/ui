// UsageMeter: how much of an agent's plan is used – a bar per limit window, a tick where its time has got to, when it resets – and what
// pay-as-you-go providers cost. UsageSummary is the one line that opens it, showing the window that needs a look.
// Bars stay gray – usage is a neutral number; amber only near the limit, always with words. Runs out early is a straight line from the
// window's start: a guess, so it speaks only past half used. The meter counts nothing – the host passes what the provider reports.
import { Gauge, RefreshCw } from "lucide-react";
import { type ComponentProps, Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import { useRoll } from "../hooks/use-roll.ts";
import { Button } from "./button.tsx";
import { Placeholder } from "./placeholder.tsx";
import { Skeleton } from "./skeleton.tsx";
import { Spinner } from "./spinner.tsx";
import { elapsed, level, live, percent, runOut, type UsageWindow, updated, urgent, when } from "../lib/usage-meter.ts";
import { cn } from "../lib/utils.ts";

export type { UsageWindow } from "../lib/usage-meter.ts";
/** Spend as a small table: a column per period, a row per provider. Values come formatted; share – 0–1 of a budget, draws a bar */
export type UsageTable = { columns: string[]; rows: { label: string; values: string[]; share?: number }[] };
/** at – when the numbers were read, in ms: the card gets a tray. note – a line in the tray, where the numbers come from */
export type UsageAccount = { id: string; label: string; plan?: string; windows?: UsageWindow[]; table?: UsageTable; at?: number; note?: ReactNode };

/** Re-renders every 30s, so 「4 分钟前更新」, the tick and resets stay true */
function useTick() {
	const [, setT] = useState(0);
	useEffect(() => {
		const t = setInterval(() => setT((n) => n + 1), 30_000);
		return () => clearInterval(t);
	}, []);
}

/** A window's value in words: 「已用 43%，17:00 重置，时间已过 68%」 */
function sentence(w: UsageWindow, now: number): string {
	if (!live(w, now)) return "已重置，待更新";
	if (w.used >= 1) return `已用完${w.resetsAt === null ? "" : `，${when(w.resetsAt, now)} 恢复`}`;
	const gone = elapsed(w, now);
	const out = runOut(w, now);
	return [`已用 ${percent(w.used)}%`, w.resetsAt !== null && `${when(w.resetsAt, now)} 重置`, gone !== null && `时间已过 ${percent(gone)}%`, out !== null && `照现在的速度 ${when(out, now)} 用完`].filter(Boolean).join("，");
}

/** A gray bar; the tick marks how far the window's time has got. halo – the surface behind, so the tick reads over the fill */
function Bar({ used, tick, thin, halo = "var(--card)" }: { used: number; tick?: number | null; thin?: boolean; halo?: string }) {
	return (
		<div aria-hidden className={cn("relative rounded-full bg-muted", thin ? "h-1" : "h-1.5")}>
			<div className="h-full rounded-full bg-foreground/70 transition-[width] duration-300 ease-out-strong motion-reduce:transition-none" style={{ width: `${percent(used)}%` }} />
			{tick != null && (
				<div
					className="absolute -inset-y-[3px] w-0.5 rounded-full bg-foreground transition-[left] duration-300 ease-out-strong motion-reduce:transition-none"
					style={{ left: `calc(${tick * 100}% - 1px)`, boxShadow: `0 0 0 1.5px ${halo}` }}
				/>
			)}
		</div>
	);
}

function WindowRow({ w, now, warnAt }: { w: UsageWindow; now: number; warnAt: number }) {
	const on = live(w, now);
	const full = on && w.used >= 1;
	const out = runOut(w, now);
	const shown = useRoll(on ? percent(w.used) : 0);
	const reset = !on ? "待更新" : w.resetsAt === null ? null : `${when(w.resetsAt, now)} ${full ? "恢复" : "重置"}`;
	return (
		<div role="meter" aria-label={w.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={on ? percent(w.used) : 0} aria-valuetext={sentence(w, now)} className="flex flex-col gap-1.5">
			<div className="flex min-w-0 items-baseline gap-2">
				<span className="truncate text-md">{w.label}</span>
				<span className={cn("ml-auto shrink-0 tabular-nums", on ? "text-lg font-semibold" : "text-xs text-muted-foreground", on && w.used >= warnAt && "text-waiting-strong")}>
					{!on ? "已重置" : full ? "已用完" : `${Math.round(shown)}%`}
				</span>
			</div>
			<Bar used={on ? w.used : 0} tick={on && !full ? elapsed(w, now) : null} />
			{(reset || out !== null) && (
				<div className="flex min-w-0 items-baseline gap-2 text-xs text-muted-foreground tabular-nums">
					{reset && <span className="shrink-0">{reset}</span>}
					{out !== null && <span className="ml-auto min-w-0 truncate text-waiting-strong">照现在的速度 {when(out, now)} 用完</span>}
				</div>
			)}
		</div>
	);
}

function Table({ t }: { t: UsageTable }) {
	return (
		<table className="-mt-1 w-full text-md tabular-nums">
			<thead>
				<tr className="h-6 text-2xs text-muted-foreground">
					<th className="w-full font-normal">
						<span className="sr-only">名称</span>
					</th>
					{t.columns.map((c) => (
						<th key={c} scope="col" className="pl-3 text-right font-normal whitespace-nowrap">{c}</th>
					))}
				</tr>
			</thead>
			<tbody>
				{t.rows.map((r) => (
					<Fragment key={r.label}>
						<tr className="h-7">
							<th scope="row" className="w-full max-w-0 truncate text-left font-normal">{r.label}</th>
							{r.values.map((v, i) => (
								<td key={t.columns[i] ?? i} className="pl-3 text-right whitespace-nowrap">{v}</td>
							))}
						</tr>
						{/* A budget: a bar under the row, across it */}
						{r.share !== undefined && (
							<tr aria-hidden>
								<td colSpan={t.columns.length + 1} className="pb-2">
									<Bar used={r.share} thin />
								</td>
							</tr>
						)}
					</Fragment>
				))}
			</tbody>
		</table>
	);
}

function AccountCard({ a, now, warnAt, onRefresh }: { a: UsageAccount; now: number; warnAt: number; onRefresh?: (id: string) => unknown }) {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// What the last refresh came to, for screen readers – once
	const [said, setSaid] = useState("");
	// New numbers clear an old failure
	useEffect(() => setError(null), [a.at]);
	const refresh = async () => {
		if (!onRefresh || busy) return;
		setBusy(true);
		setError(null);
		setSaid("");
		try {
			await onRefresh(a.id);
			setSaid("已刷新");
		} catch (e) {
			const m = e instanceof Error ? e.message : String(e);
			setError(m || "未知错误");
			setSaid(`刷新失败：${m || "未知错误"}`);
		}
		setBusy(false);
	};
	return (
		<section aria-label={a.label} className="flex flex-col gap-1.5">
			<div className="flex flex-col gap-4 rounded-xl border bg-card p-3 text-card-foreground shadow-xs">
				<div className="flex min-w-0 items-center gap-2">
					<span className="truncate text-sm font-medium">{a.label}</span>
					{a.plan && <span className="shrink-0 rounded-md border bg-background px-1.5 py-0.5 font-mono text-2xs text-muted-foreground">{a.plan}</span>}
				</div>
				{a.windows?.map((w) => <WindowRow key={w.label} w={w} now={now} warnAt={warnAt} />)}
				{a.table && <Table t={a.table} />}
			</div>
			{(a.at !== undefined || a.note) && (
				<div className="flex flex-col gap-0.5 px-1.5 pb-1">
					{a.at !== undefined && (
						<div className="flex min-h-7 items-center gap-2 text-xs text-muted-foreground">
							<span className={cn("min-w-0 truncate tabular-nums", error && "text-destructive-strong")}>{error ? `刷新失败：${error}` : updated(a.at, now)}</span>
							{onRefresh && (
								<Button size="xs" variant="ghost" className="ml-auto gap-1 px-1.5 font-normal text-muted-foreground pointer-coarse:h-9" disabled={busy} onClick={refresh}>
									{busy ? <Spinner className="size-3" /> : <RefreshCw className="size-3" aria-hidden />}
									刷新
								</Button>
							)}
							<span role="status" className="sr-only">{said}</span>
						</div>
					)}
					{a.note && <p className="text-2xs text-muted-foreground">{a.note}</p>}
				</div>
			)}
		</section>
	);
}

type UsageMeterProps = {
	/** null – loading: the card's shape in skeletons */
	accounts: UsageAccount[] | null;
	/** From this share a window's percentage turns amber */
	warnAt?: number;
	/** 「刷新」 in the tray of each account with at. A promise keeps it busy; a rejection shows its message */
	onRefresh?: (accountId: string) => unknown;
	/** Under 「暂无用量」: what will show up here */
	emptyNote?: string;
	/** Names the group for screen readers */
	title?: string;
	className?: string;
};

function UsageMeter({ accounts, warnAt = 0.8, onRefresh, emptyNote = "各个账号的限额和花费会显示在这里", title = "用量", className }: UsageMeterProps) {
	useTick();
	const now = Date.now();
	if (!accounts) return <Loading title={title} className={className} />;
	if (!accounts.length) return <Placeholder icon={Gauge} title="暂无用量" text={emptyNote} className={cn("rounded-2xl bg-muted px-4 py-8", className)} />;
	return (
		<div role="group" aria-label={title} data-slot="usage-meter" className={cn("flex flex-col gap-3 rounded-2xl bg-muted p-1.5", className)}>
			{accounts.map((a) => <AccountCard key={a.id} a={a} now={now} warnAt={warnAt} onRefresh={onRefresh} />)}
		</div>
	);
}

/** Loading: the card's shape – head, two windows, the tray – so nothing jumps when the numbers land */
function Loading({ title, className }: { title: string; className?: string }) {
	return (
		<div role="group" aria-label={title} aria-busy="true" data-slot="usage-meter" className={cn("flex flex-col gap-1.5 rounded-2xl bg-muted p-1.5", className)}>
			<div className="flex flex-col gap-4 rounded-xl border bg-card p-3 shadow-xs">
				<div className="flex h-5 items-center">
					<Skeleton className="h-3.5 w-20" />
				</div>
				{[0, 1].map((i) => (
					<div key={i} className="flex flex-col gap-1.5">
						<div className="flex h-[25px] items-center justify-between">
							<Skeleton className="h-3 w-12" />
							<Skeleton className="h-4 w-10" />
						</div>
						<Skeleton className="h-1.5 w-full rounded-full" />
						<div className="flex h-4 items-center">
							<Skeleton className="h-3 w-24" />
						</div>
					</div>
				))}
			</div>
			<div className="flex h-7 items-center px-1.5 pb-1">
				<Skeleton className="h-3 w-28" />
			</div>
		</div>
	);
}

type Shown = NonNullable<ReturnType<typeof urgent<UsageAccount>>>;

/** What the summary says aloud when its window gets louder */
function phrase({ account, window: w, out }: Shown, lv: number, now: number): string {
	const who = `${account.label} ${w.label}`;
	if (lv === 3) return `${who}已用完${w.resetsAt === null ? "" : `，${when(w.resetsAt, now)} 恢复`}`;
	if (lv === 2 && out !== null) return `${who}照现在的速度 ${when(out, now)} 用完`;
	return `${who}已用 ${percent(w.used)}%`;
}

type UsageSummaryProps = Omit<ComponentProps<"button">, "children"> & {
	/** null – loading */
	accounts: UsageAccount[] | null;
	/** From this share the percentage turns amber */
	warnAt?: number;
	/** After this many ms without an update, the right side says how old the numbers are */
	staleAfter?: number;
	/** Shown when no window is live */
	label?: string;
};

/** The one line for a sidebar footer: the window that needs a look. A button – the host makes it a Popsheet trigger */
function UsageSummary({ accounts, warnAt = 0.8, staleAfter = 30 * 60_000, label = "用量", className, ...props }: UsageSummaryProps) {
	useTick();
	const now = Date.now();
	const t = accounts ? urgent(accounts, now) : null;
	const lv = t ? level(t.window, now, warnAt) : 0;
	// Speaks once when the shown window gets louder – not on the first look, and quiet again lets it speak next time
	const [said, setSaid] = useState("");
	const last = useRef<{ key: string; lv: number } | null>(null);
	const key = t ? `${t.account.id}\t${t.window.label}` : "";
	useEffect(() => {
		const before = last.current;
		last.current = { key, lv };
		if (t && before && (before.key !== key ? lv > 0 : lv > before.lv)) setSaid(phrase(t, lv, Date.now()));
	}, [key, lv]); // t follows key and lv
	const base = cn("flex w-full flex-col justify-center gap-1.5 rounded-md px-2 py-2 text-left text-2xs text-muted-foreground outline-hidden hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring md:py-1.5 pointer-coarse:min-h-11", className);
	if (!accounts)
		return (
			<button type="button" aria-label={label} aria-busy="true" {...props} data-slot="usage-summary" className={base}>
				<Skeleton className="h-3 w-32" />
				<Skeleton className="h-1 w-full rounded-full" />
			</button>
		);
	const at = t?.account.at;
	const stale = at !== undefined && now - at > staleAfter;
	const full = lv === 3;
	const right = !t
		? accounts.some((a) => a.windows?.length) ? "已重置，待更新" : null
		: stale ? updated(at ?? now, now)
		: full ? (t.window.resetsAt === null ? null : `${when(t.window.resetsAt, now)} 恢复`)
		: t.out !== null ? `${when(t.out, now)} 用完`
		: t.window.resetsAt === null ? null : `${when(t.window.resetsAt, now)} 重置`;
	const name = t ? `${label}：${t.account.label} ${t.window.label}${sentence(t.window, now)}${stale ? `，${updated(at ?? now, now)}` : ""}` : right ? `${label}：${right}` : label;
	return (
		<button type="button" aria-label={name} {...props} data-slot="usage-summary" className={base}>
			<span aria-hidden className="flex min-w-0 items-baseline gap-1.5 tabular-nums">
				{/* A long account name gives way first; the window, its percentage and the right side keep their place */}
				<span className="min-w-0 truncate font-medium text-sidebar-foreground">{t ? t.account.label : label}</span>
				{t && <span className="shrink-0">{t.window.label}</span>}
				{t && <span className={cn("shrink-0 text-sidebar-foreground", t.window.used >= warnAt && "text-waiting-strong")}>{full ? "已用完" : `${percent(t.window.used)}%`}</span>}
				{right && <span className={cn("ml-auto shrink-0 pl-1", lv === 2 && !stale && "text-waiting-strong")}>{right}</span>}
			</span>
			{t && <Bar used={t.window.used} tick={full ? null : elapsed(t.window, now)} thin halo="var(--sidebar)" />}
			<span role="status" className="sr-only">{said}</span>
		</button>
	);
}

export { UsageMeter, UsageSummary };
