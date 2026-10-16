// InlineDiff: an agent's edit to a text, shown in place – removed words struck in red, added ones in green – and settled change by change.
// Built like MatchReview: the head counts what waits, one dark bar floats over the change in focus, Y and N decide, U undoes, 「完成」 hands
// the text back. Chinese is compared by words (lib/inline-diff.ts). Props in, callbacks out – the host keeps the text and writes it back.
import { Check, ChevronLeft, ChevronRight, Undo2, X } from "lucide-react";
import { Fragment, type KeyboardEvent, type ReactNode, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "./button.tsx";
import { Shimmer } from "./shimmer.tsx";
import { Skeleton } from "./skeleton.tsx";
import { Spinner } from "./spinner.tsx";
import { describe, type DiffDecision, type DiffSegment, diffWords, resolve, step } from "../lib/inline-diff.ts";
import { cn } from "../lib/utils.ts";

export type { DiffDecision, DiffSegment } from "../lib/inline-diff.ts";

type InlineDiffProps = {
	/** The text as it is */
	original?: string;
	/** The agent's version, compared word by word; null – still writing */
	suggested?: string | null;
	/** Changes worked out elsewhere, instead of original and suggested */
	segments?: DiffSegment[];
	/** On the tray above the card: who suggested it, what was asked */
	label?: ReactNode;
	/** Settled: one per change, read only */
	decisions?: DiffDecision[];
	/** After each decision and undo; changes still open keep the old words */
	onChange?: (text: string, decisions: (DiffDecision | null)[]) => void;
	/** 「完成」. A promise locks the card until it settles; a rejection reopens it */
	onDone?: (text: string, decisions: DiffDecision[]) => unknown;
	/** Only the marks: no head, no decisions */
	readOnly?: boolean;
	className?: string;
};

type Review = { key: string; decisions: (DiffDecision | null)[]; history: (DiffDecision | null)[][] };

/** A decided change fades this long before it turns into plain text */
const FADE = 150;
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const DEL =
	"rounded-[4px] bg-removed/10 px-0.5 text-removed-strong line-through decoration-removed-strong/60 [box-decoration-break:clone] transition-[opacity,background-color,color,text-decoration-color] duration-150 motion-reduce:transition-none";
const INS = "rounded-[4px] bg-added/10 px-0.5 text-added-strong no-underline [box-decoration-break:clone] transition-[opacity,background-color,color] duration-150 motion-reduce:transition-none";

/** A button on the bar: its key as text; it never takes focus, which stays on the change */
function Tool({ icon, label, k, onClick }: { icon: ReactNode; label: string; k: string; onClick: () => void }) {
	return (
		<button
			type="button"
			tabIndex={-1}
			onMouseDown={(e) => e.preventDefault()}
			onClick={onClick}
			className="flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap outline-none hover:bg-background/10 pointer-coarse:h-10 pointer-coarse:px-3 pointer-coarse:text-sm"
		>
			{icon}
			{label}
			<kbd className="grid h-4 min-w-4 place-items-center rounded-[4px] bg-background/15 px-1 font-sans text-[10px] leading-none text-background/70 pointer-coarse:hidden">{k}</kbd>
		</button>
	);
}

function InlineDiff({ original = "", suggested, segments, label, decisions: given, onChange, onDone, readOnly, className }: InlineDiffProps) {
	const labelId = useId();
	const writing = !segments && suggested === null;
	const segs = useMemo(() => segments ?? (typeof suggested === "string" ? diffWords(original, suggested) : []), [segments, original, suggested]);
	/** Each segment's change number, -1 for unchanged runs; and each change's segment */
	const { order, at } = useMemo(() => {
		const at: number[] = [];
		const order = segs.map((s, i) => (s.type === "change" ? at.push(i) - 1 : -1));
		return { order, at };
	}, [segs]);
	const count = at.length;
	const key = useMemo(() => JSON.stringify(segs), [segs]);
	const [review, setReview] = useState<Review>({ key, decisions: Array(count).fill(null), history: [] });
	const [active, setActive] = useState<number | null>(null);
	const [leaving, setLeaving] = useState<Record<number, DiffDecision>>({});
	const [busy, setBusy] = useState(false);
	const [sent, setSent] = useState<DiffDecision[] | null>(null);
	const [said, setSaid] = useState("");
	const [bar, setBar] = useState<{ left: number; top: number } | null>(null);
	const [barKey, setBarKey] = useState(0);
	// A new suggestion starts the review over
	if (review.key !== key) {
		setReview({ key, decisions: Array(count).fill(null), history: [] });
		setActive(null);
		setLeaving({});
		setSent(null);
	}
	const dec = review.key === key ? review.decisions : Array<DiffDecision | null>(count).fill(null);

	const els = useRef<(HTMLSpanElement | null)[]>([]);
	const box = useRef<HTMLDivElement>(null);
	const barRef = useRef<HTMLDivElement>(null);
	const doneRef = useRef<HTMLButtonElement>(null);
	/** Where focus goes once the next render is on screen: a change, or 「完成」 */
	const want = useRef<number | "done" | null>(null);
	/** A change to scroll into view without taking focus – ‹ ›, the bar's buttons */
	const reveal = useRef<number | null>(null);
	const shownBar = useRef(false);

	const answer = given ?? sent;
	const settled = !!answer && !readOnly;
	const shown = answer ?? dec;
	const interactive = !readOnly && !settled && !writing && count > 0;
	const open = dec.flatMap((d, k) => (d ? [] : [k]));
	const accepted = shown.filter((d) => d === "accept").length;
	const live = interactive && active !== null && !dec[active];

	/** The bar over the change in focus: above its first line, or below its last when above would cover the head */
	const place = () => {
		const el = live && active !== null ? els.current[active] : null;
		const b = box.current;
		const w = barRef.current;
		if (!el || !b || !w) return setBar((p) => (p === null ? p : null));
		const rects = el.getClientRects();
		const first = rects[0] ?? el.getBoundingClientRect();
		const last = rects[rects.length - 1] ?? first;
		const o = b.getBoundingClientRect();
		const above = first.top - o.top - w.offsetHeight - 6;
		const below = last.bottom - o.top + 6;
		const up = above >= 0 || below + w.offsetHeight > o.height;
		const r = up ? first : last;
		const left = Math.round(Math.max(8, Math.min(r.left - o.left, o.width - w.offsetWidth - 8)));
		const top = Math.round(up ? above : below);
		setBar((p) => (p?.left === left && p?.top === top ? p : { left, top }));
	};
	const placeRef = useRef(place);
	placeRef.current = place;
	useLayoutEffect(place);
	useEffect(() => {
		const b = box.current;
		if (!b) return;
		const ro = new ResizeObserver(() => placeRef.current());
		ro.observe(b);
		return () => ro.disconnect();
	}, []);
	// The bar fades in where it first shows; after that it glides
	useLayoutEffect(() => {
		if (bar && !shownBar.current) setBarKey((k) => k + 1);
		shownBar.current = !!bar;
	}, [bar]);
	useLayoutEffect(() => {
		const w = want.current;
		const r = reveal.current;
		want.current = null;
		reveal.current = null;
		const behavior = reduced() ? "auto" : "smooth";
		if (w === "done") doneRef.current?.focus();
		else if (w !== null) {
			els.current[w]?.focus({ preventScroll: true });
			els.current[w]?.scrollIntoView({ block: "nearest", behavior });
		} else if (r !== null) els.current[r]?.scrollIntoView({ block: "nearest", behavior });
	});

	const commit = (next: (DiffDecision | null)[], words: string) => {
		setReview((v) => ({ ...v, decisions: next, history: [...v.history, v.decisions] }));
		setSaid(words);
		onChange?.(resolve(segs, next), next);
	};
	/** The words a decision drops fade out before the change turns into plain text; with reduced motion the fade is cut to nothing in CSS */
	const fadeOut = (ks: number[], how: DiffDecision) => {
		setLeaving((l) => ({ ...l, ...Object.fromEntries(ks.map((k) => [k, how])) }));
		setTimeout(
			() =>
				setLeaving((l) => {
					const n = { ...l };
					for (const k of ks) delete n[k];
					return n;
				}),
			FADE,
		);
	};
	const changeOf = (k: number) => segs[at[k]!] as Extract<DiffSegment, { type: "change" }>;
	const decide = (k: number, how: DiffDecision, keyboard: boolean) => {
		if (!interactive || dec[k]) return;
		const next = dec.slice();
		next[k] = how;
		const rest = open.filter((j) => j !== k);
		const to = rest.find((j) => j > k) ?? rest[0] ?? null;
		fadeOut([k], how);
		commit(next, `已${how === "accept" ? "接受" : "拒绝"}：${describe(changeOf(k))}。${rest.length ? `还有 ${rest.length} 处` : "已看完"}`);
		setActive(to);
		if (keyboard) want.current = to ?? "done";
		else if (to !== null) reveal.current = to;
		else want.current = "done";
	};
	const all = (how: DiffDecision) => {
		if (!interactive || !open.length) return;
		fadeOut(open, how);
		commit(
			dec.map((d) => d ?? how),
			`已全部${how === "accept" ? "接受" : "拒绝"}，${open.length} 处`,
		);
		setActive(null);
		want.current = "done";
	};
	const undo = () => {
		const last = review.history[review.history.length - 1];
		if (!interactive || !last) return;
		setReview((v) => ({ ...v, decisions: last, history: v.history.slice(0, -1) }));
		setLeaving({});
		// Focus goes back to the change that opened again – the button that undid it may be gone
		const back = last.findIndex((d, k) => !d && !!dec[k]);
		setActive(back >= 0 ? back : null);
		if (back >= 0) want.current = back;
		setSaid("已撤销");
		onChange?.(resolve(segs, last), last);
	};
	const finish = async () => {
		if (!interactive || busy || open.length || !onDone) return;
		const final = dec as DiffDecision[];
		setBusy(true);
		try {
			await onDone(resolve(segs, final), final);
			setSent(final);
			setSaid("已确认");
		} catch {
			// The host says what went wrong; the card stays open
		}
		setBusy(false);
	};
	const move = (dir: 1 | -1, keyboard: boolean) => {
		const to = step(open, active, dir);
		setActive(to);
		if (to === null) return;
		if (keyboard) want.current = to;
		else reveal.current = to;
	};

	const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
		if (!interactive) return;
		const mod = e.metaKey || e.ctrlKey;
		if (mod && e.key.toLowerCase() === "z") {
			e.preventDefault();
			return undo();
		}
		if (mod && e.key === "Enter") {
			if (!open.length) {
				e.preventDefault();
				finish();
			}
			return;
		}
		if (mod || e.altKey) return;
		if (e.key === "u" || e.key === "U") {
			e.preventDefault();
			return undo();
		}
		const onChange = (e.target as HTMLElement).dataset.change !== undefined;
		if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
			if (!open.length) return;
			e.preventDefault();
			return move(e.key === "ArrowRight" ? 1 : -1, onChange);
		}
		if (!onChange || active === null) return;
		if (e.key === "Escape") {
			e.preventDefault();
			setActive(null);
			(e.target as HTMLElement).blur();
		} else if (e.key === "y" || e.key === "Y" || e.key === "Enter") {
			e.preventDefault();
			decide(active, "accept", true);
		} else if (e.key === "n" || e.key === "N" || e.key === "Backspace") {
			e.preventDefault();
			decide(active, "reject", true);
		}
	};

	const text = segs.map((s, i) => {
		if (s.type === "equal") return <Fragment key={i}>{s.text}</Fragment>;
		const k = order[i]!;
		const d = shown[k];
		const going = leaving[k];
		if (d && !going) return <Fragment key={i}>{d === "accept" ? s.insert : s.remove}</Fragment>;
		const waiting = interactive && !d;
		const on = live && active === k;
		return (
			<span
				key={i}
				ref={(el) => {
					els.current[k] = el;
				}}
				{...(waiting
					? {
							role: "button",
							tabIndex: 0,
							"data-change": "",
							"data-escape": on ? "local" : undefined,
							"aria-label": `第 ${k + 1} 处，共 ${count} 处：${describe(s)}。按 Y 接受，N 拒绝`,
							onFocus: () => setActive(k),
							onPointerEnter: (e: { pointerType: string }) => e.pointerType === "mouse" && setActive(k),
							onClick: () => setActive(k),
						}
					: {})}
				className={cn("rounded-[5px] outline-none [box-decoration-break:clone]", waiting && "cursor-pointer", on && "ring-2 ring-foreground/25")}
			>
				{s.remove && <del className={cn(DEL, going === "accept" && "opacity-0", going === "reject" && "bg-transparent text-foreground decoration-transparent")}>{s.remove}</del>}
				{s.insert && <ins className={cn(INS, going === "reject" && "opacity-0", going === "accept" && "bg-transparent text-foreground")}>{s.insert}</ins>}
			</span>
		);
	});

	const head = !readOnly && (
		<div className="sticky top-0 z-20 flex h-11 items-center gap-1.5 rounded-t-xl border-b bg-card px-3">
			{writing ? (
				<Shimmer className="text-sm">正在改写…</Shimmer>
			) : !count ? (
				<span className="text-sm text-muted-foreground">暂无修改</span>
			) : settled ? (
				<Fragment key="settled">
					<Check className="size-4 shrink-0 text-success-strong" aria-hidden />
					<span className="shrink-0 text-sm font-medium">已确认</span>
					<span className="ml-1 min-w-0 truncate text-xs text-muted-foreground">
						接受 {accepted} 处，拒绝 {count - accepted} 处
					</span>
				</Fragment>
			) : open.length ? (
				<Fragment key="open">
					<span className="grid size-5 shrink-0 place-items-center rounded-full bg-success-subtle text-xs font-medium text-success-strong tabular-nums">{open.length}</span>
					<span className="min-w-0 flex-1 truncate text-sm font-medium">待确认</span>
					<Button size="icon-sm" variant="ghost" className="text-muted-foreground @max-[360px]:hidden" aria-label="上一处" disabled={open.length < 2} onClick={() => move(-1, false)}>
						<ChevronLeft />
					</Button>
					<Button size="icon-sm" variant="ghost" className="text-muted-foreground @max-[360px]:hidden" aria-label="下一处" disabled={open.length < 2} onClick={() => move(1, false)}>
						<ChevronRight />
					</Button>
					<Button size="sm" variant="outline" onClick={() => all("reject")}>
						全部拒绝
					</Button>
					<Button size="sm" onClick={() => all("accept")}>
						全部接受
					</Button>
				</Fragment>
			) : (
				<Fragment key="reviewed">
					<Check className="size-4 shrink-0 text-success-strong" aria-hidden />
					<span className="min-w-0 flex-1 truncate text-sm font-medium">已看完</span>
					<Button size="sm" variant="ghost" className="text-muted-foreground" disabled={!review.history.length || busy} onClick={undo}>
						<Undo2 />
						撤销
					</Button>
					<Button ref={doneRef} size="sm" disabled={busy || !onDone} onClick={finish}>
						{busy ? <Spinner /> : <Check />}
						完成
					</Button>
				</Fragment>
			)}
		</div>
	);

	return (
		<div
			role="group"
			aria-labelledby={label ? labelId : undefined}
			aria-label={label ? undefined : "修改"}
			aria-busy={writing || undefined}
			data-slot="inline-diff"
			onKeyDown={onKey}
			className={cn("flex min-w-0 flex-col gap-1.5 rounded-2xl bg-muted p-1.5", className)}
		>
			{label && (
				<div id={labelId} className="truncate px-2 pt-0.5 text-2xs text-muted-foreground">
					{label}
				</div>
			)}
			<div className="@container relative rounded-xl border bg-card text-card-foreground shadow-xs">
				{head}
				<div ref={box} className="relative">
					{writing && !original ? (
						<div className="flex flex-col gap-2.5 px-4 py-4">
							{[92, 100, 64].map((w) => (
								<Skeleton key={w} className="h-3.5" style={{ width: `${w}%` }} />
							))}
						</div>
					) : (
						<p className={cn("px-4 py-3 text-sm leading-7 break-words whitespace-pre-wrap", writing && "text-muted-foreground")}>{writing ? original : text}</p>
					)}
					{interactive && (
						<div
							key={barKey}
							ref={barRef}
							role="toolbar"
							aria-label="这一处"
							aria-hidden={!bar}
							className={cn(
								"absolute z-30 flex h-8 items-center gap-0.5 rounded-[10px] bg-foreground p-1 text-background shadow-lg pointer-coarse:h-12",
								"transition-[left,top] duration-200 ease-out-strong animate-in fade-in motion-reduce:animate-none motion-reduce:transition-none",
								bar ? "visible" : "invisible",
							)}
							style={bar ?? undefined}
						>
							<Tool icon={<Check className="size-3.5" />} label="接受" k="Y" onClick={() => active !== null && decide(active, "accept", false)} />
							<span className="mx-0.5 h-3.5 w-px bg-background/20" />
							<Tool icon={<X className="size-3.5" />} label="拒绝" k="N" onClick={() => active !== null && decide(active, "reject", false)} />
						</div>
					)}
				</div>
			</div>
			<div role="status" aria-live="polite" className="sr-only">
				{said}
			</div>
		</div>
	);
}

export { InlineDiff };
