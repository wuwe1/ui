// ContextWindow: what fills an agent's context – a field of cells colored by part, a row per part, how much is left.
// Grays for the parts that stay put, one blue for the part that grows and can be compacted. Hovering a part lights its cells
// and rolls the big number to it. Compacting waves through that part's cells until the host says it's done, then the cells clear.
// The card counts nothing: the host passes the numbers its model reports.
import { Check, ChevronRight, FoldVertical } from "lucide-react";
import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { useRoll } from "../hooks/use-roll.ts";
import { Button } from "./button.tsx";
import { Shimmer } from "./shimmer.tsx";
import { Skeleton } from "./skeleton.tsx";
import { cells, percent, tokens } from "../lib/context-window.ts";
import { Tray, TrayCard } from "./tray.tsx";
import { cn } from "../lib/utils.ts";

export type ContextItem = { id: string; label: ReactNode; tokens: number; mono?: boolean; title?: string };
/** tone – 0 to 3, dark to light gray, for parts that stay put; compact – the part that grows: blue, with 「压缩」 */
export type ContextPart = { id: string; label: string; tokens: number; items?: ContextItem[]; tone?: 0 | 1 | 2 | 3; compact?: boolean };

type ContextWindowProps = {
	/** null – loading: the card's shape in skeletons */
	parts: ContextPart[] | null;
	/** The window, in tokens */
	limit: number;
	title?: string;
	/** The host already shows a heading (a sheet's): the title only names the group */
	hideTitle?: boolean;
	/** A tag in the head – the model */
	model?: string;
	/** Share of the window where it compacts on its own: the tray says 「到 N% 时自动压缩」 */
	threshold?: number;
	/** From this share the percentage turns amber */
	warnAt?: number;
	/** 「压缩」 on the compact part. A promise keeps it busy until it settles */
	onCompact?: (partId: string) => unknown;
	/** Why compacting can't happen now – the button is off and says it */
	compactDisabled?: string;
	/** Compacting started elsewhere, or the host knows it's still going */
	compacting?: boolean;
	className?: string;
};

const GRAY = [88, 62, 40, 22];
const color = (p: ContextPart, i: number) => (p.compact ? "var(--series-1)" : `color-mix(in oklab, var(--foreground) ${GRAY[p.tone ?? Math.min(3, i)]}%, transparent)`);
const CELLS = 216;

function ContextWindow({ parts, limit, title = "上下文", hideTitle, model, threshold, warnAt = 0.8, onCompact, compactDisabled, compacting, className }: ContextWindowProps) {
	const [hover, setHover] = useState<string | null>(null);
	const [open, setOpen] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	// Just compacted: how much it saved, shown for a moment
	const [saved, setSaved] = useState<number | null>(null);
	const [cols, setCols] = useState(36);
	const root = useRef<HTMLDivElement>(null);
	const list = parts ?? [];
	const target = list.find((p) => p.compact);
	const busy = !!compacting || pending;
	const before = useRef<number | null>(null);

	// Narrow: fewer cells to a row, so they stay readable
	useEffect(() => {
		const el = root.current;
		if (!el) return;
		const ro = new ResizeObserver(() => setCols(el.clientWidth < 310 ? 24 : 36));
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	// Busy → done: once the part's tokens drop (the host may fetch them after it stops being busy), say how much it saved, then go quiet
	const after = target?.tokens;
	useEffect(() => {
		if (busy) {
			before.current ??= after ?? null;
			return;
		}
		if (before.current === null || after === undefined || after >= before.current) return;
		setSaved(before.current - after);
		before.current = null;
	}, [busy, after]);
	useEffect(() => {
		if (saved === null) return;
		const t = setTimeout(() => setSaved(null), 3000);
		return () => clearTimeout(t);
	}, [saved]);

	const modelTag = model && (
		<span className="ml-auto min-w-0 truncate rounded-md border bg-background px-1.5 py-0.5 font-mono text-2xs text-muted-foreground" title={model}>
			{model}
		</span>
	);
	const total = list.reduce((s, p) => s + p.tokens, 0);
	const shown = hover ? list.find((p) => p.id === hover) : null;
	const big = useRoll(shown ? shown.tokens : total);
	if (!parts) return <Loading title={title} hideTitle={hideTitle} className={className} />;
	const pct = percent(total, limit);
	const field = cells(list, limit, CELLS);
	const colorOf = new Map(list.map((p, i) => [p.id, color(p, i)]));
	// Only a mouse hovers: a tap would light a part and never let go
	const enter = (id: string | null) => (e: PointerEvent) => { if (e.pointerType === "mouse" && id) setHover(id); };
	const leave = (e: PointerEvent) => { if (e.pointerType === "mouse") setHover(null); };
	const compact = async (id: string) => {
		if (busy || !onCompact) return;
		before.current = target?.tokens ?? null;
		setPending(true);
		try {
			await onCompact(id);
		} catch {
			// The host says what went wrong
		}
		setPending(false);
	};

	return (
		<Tray ref={root} role="group" aria-label={title} data-slot="context-window" className={className}>
			<TrayCard className="flex flex-col gap-3 p-3">
				{!hideTitle && (
					<div className="flex min-w-0 items-center gap-2">
						<span className="text-xs text-muted-foreground">{title}</span>
						{modelTag}
					</div>
				)}
				<div className="flex min-w-0 items-baseline gap-2" aria-hidden>
					<span className="shrink-0 text-2xl font-semibold tabular-nums">{tokens(big)}</span>
					<span className="shrink-0 text-xs text-muted-foreground">{shown ? shown.label : `/ ${tokens(limit)}`}</span>
					{hideTitle && modelTag}
					<span className={cn("shrink-0 text-xs tabular-nums", !(hideTitle && model) && "ml-auto", total >= limit * warnAt ? "text-waiting-strong" : "text-muted-foreground")}>{pct}%</span>
				</div>
				<span className="sr-only">已用 {tokens(total)} / {tokens(limit)}，{pct}%{hideTitle && model ? `，${model}` : ""}</span>
				<div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} aria-hidden>
					{field.map((id, i) => (
						<span
							key={i}
							onPointerEnter={enter(id)}
							onPointerLeave={leave}
							className={cn("aspect-square rounded-[26%] transition-[opacity,background-color] duration-200 motion-reduce:transition-none", busy && id === target?.id && "cell-wave")}
							style={{
								background: id ? colorOf.get(id) : "var(--muted)",
								opacity: hover && id !== hover ? 0.25 : undefined,
								// The wave and any change sweep left to right
								animationDelay: `${(i % cols) * 30}ms`,
								transitionDelay: hover ? undefined : `${(i % cols) * 6}ms`,
							}}
						/>
					))}
				</div>
				<div className="flex flex-col">
					{list.map((p, i) => {
						const items = p.items?.length ? p.items : null;
						const isOpen = open === p.id && !!items;
						return (
							<div key={p.id} onPointerEnter={enter(p.id)} onPointerLeave={leave} className="-mx-1.5 rounded-lg px-1.5 hover:bg-muted/60">
								<div className="flex h-7.5 items-center gap-2 pointer-coarse:h-10">
									<button type="button" disabled={!items} aria-expanded={items ? isOpen : undefined} onClick={() => setOpen(isOpen ? null : p.id)} className="flex min-w-0 flex-1 items-center gap-2 rounded-sm text-left text-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
										<span className="size-[7px] shrink-0 rounded-[26%]" style={{ background: color(p, i) }} />
										<span className="truncate">{p.label}</span>
										{items && <ChevronRight aria-hidden className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", isOpen && "rotate-90")} />}
									</button>
									{p.compact && onCompact && (saved !== null ? (
										<span className="flex items-center gap-1 text-xs text-success-strong animate-in fade-in-0 zoom-in-95 duration-200">
											<Check className="size-3" aria-hidden />
											已压缩
										</span>
									) : (
										<Button
											size="xs"
											variant="ghost"
											className="gap-1 px-1.5 font-normal text-muted-foreground"
											disabled={busy || !!compactDisabled || !p.tokens}
											title={compactDisabled}
											aria-label={compactDisabled ? `压缩：${compactDisabled}` : "压缩"}
											onClick={() => compact(p.id)}
										>
											<FoldVertical className="size-3" aria-hidden />
											<span className="max-[310px]:sr-only">{busy ? <Shimmer>压缩中</Shimmer> : "压缩"}</span>
										</Button>
									))}
									<span className="text-md tabular-nums">{tokens(p.tokens)}</span>
								</div>
								{isOpen && items && (
									<div className="flex max-h-48 flex-col overflow-y-auto pb-2 pl-4 animate-in fade-in-0 duration-150">
										{items.map((it) => (
											<div key={it.id} className="flex h-7 items-center gap-2" title={it.title}>
												<span className={cn("min-w-0 flex-1 truncate", it.mono ? "font-mono text-2xs" : "text-xs")}>{it.label}</span>
												<span className="text-xs tabular-nums text-muted-foreground">{tokens(it.tokens)}</span>
											</div>
										))}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</TrayCard>
			<div role="status" className="px-1.5 pb-0.5 text-xs text-muted-foreground">
				{busy ? (
					<Shimmer>正在压缩{target ? target.label : ""}…</Shimmer>
				) : saved !== null ? (
					`已压缩，省下 ${tokens(saved)}，剩余 ${tokens(Math.max(0, limit - total))}`
				) : (
					`剩余 ${tokens(Math.max(0, limit - total))}${threshold ? `，到 ${Math.round(threshold * 1000) / 10}% 时自动压缩` : ""}`
				)}
			</div>
		</Tray>
	);
}

/** Loading: the card's shape – head, big number, the field, five rows, the tray – so nothing jumps when the numbers land */
function Loading({ title, hideTitle, className }: { title: string; hideTitle?: boolean; className?: string }) {
	return (
		<Tray role="group" aria-label={title} aria-busy="true" data-slot="context-window" className={className}>
			<TrayCard className="flex flex-col gap-3 p-3">
				{!hideTitle && <span className="text-xs text-muted-foreground">{title}</span>}
				<div className="flex items-center gap-2">
					<Skeleton className="h-7 w-24" />
					<Skeleton className="ml-auto h-3 w-8" />
				</div>
				<Skeleton className="aspect-[6/1] w-full rounded-md" />
				<div className="flex flex-col">
					{[0, 1, 2, 3, 4].map((i) => (
						<div key={i} className="flex h-7.5 items-center gap-2 pointer-coarse:h-10">
							<Skeleton className="size-[7px] rounded-[26%]" />
							<Skeleton className="h-3" style={{ width: `${[28, 18, 34, 22, 16][i]}%` }} />
							<Skeleton className="ml-auto h-3 w-10" />
						</div>
					))}
				</div>
			</TrayCard>
			<div className="px-1.5 pb-0.5">
				<Skeleton className="h-3 w-40" />
			</div>
		</Tray>
	);
}

export { ContextWindow };
