// MatchReview: an agent proposes which item on the left goes with which on the right, and a person settles it – row by row, with keys.
// A row is a pair: matched parts of the two labels tinted alike, the rest gray. Pairs that point at the same right item sit together as one group,
// the item shown once with ×N; the one not chosen dims. A focused pair spreads its candidates in place, the others dimmed.
// Actions float in one dark bar over the focused row. Props in, callbacks out – the host computes links and scores, and keeps the answer.
import { Check, ChevronDown, ChevronLeft, ChevronRight, Undo2, X } from "lucide-react";
import { type CSSProperties, type KeyboardEvent, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "./button.tsx";
import { Skeleton } from "./skeleton.tsx";
import { Spinner } from "./spinner.tsx";
import {
	acceptAll,
	type Block,
	blocks,
	candidateOf,
	candidatesOf,
	decide,
	EMPTY,
	final,
	isOpen,
	keep,
	keepAll,
	type MatchDecision,
	type MatchItem,
	type MatchLink,
	type MatchPair,
	type MatchSignal,
	type ReviewState,
	rightOf,
	segments,
	settled,
	step,
} from "../lib/match-review.ts";
import { cn } from "../lib/utils.ts";

export type { MatchCandidate, MatchDecision, MatchItem, MatchLink, MatchPair, MatchSignal } from "../lib/match-review.ts";

type MatchReviewProps = {
	/** null – loading */
	pairs: MatchPair[] | null;
	/** The scores each candidate carries, as thin bars on a focused pair, in this order */
	signals?: MatchSignal[];
	/** Names of the two columns */
	columns?: [string, string];
	/** On the tray above the card – what is being matched */
	label?: ReactNode;
	/** Settled: shows these, read only */
	decisions?: MatchDecision[];
	onDecide?: (d: MatchDecision) => void;
	/** 「完成」 with every pair's decision. A promise locks the card until it settles */
	onDone?: (all: MatchDecision[]) => unknown;
	className?: string;
};

/** From 480px of card: left, right, and a tail for notes and score bars. Narrower, the right item goes under the left */
const GRID =
	"grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 [grid-template-areas:'l_t'_'r_r'] @[480px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_var(--tail)] @[480px]:gap-x-6 @[480px]:[grid-template-areas:'l_r_t']";
const L = "[grid-area:l]";
const R = "[grid-area:r]";
const T = "[grid-area:t]";
/** The tail: two bars and their gap, or room for 「已否掉」 */
const tailOf = (signals: number) => `${Math.max(48, signals * 48 - 8)}px`;
const FADE = "transition-opacity duration-150 motion-reduce:transition-none";

function Thumb({ item, small }: { item: MatchItem | null | undefined; small?: boolean }) {
	const size = small ? "size-5" : "size-6";
	if (!item?.image) return <span className={cn(size, "shrink-0 rounded-md bg-muted ring-1 ring-foreground/10")} aria-hidden />;
	return <img src={item.image} alt="" className={cn(size, "shrink-0 rounded-md object-cover ring-1 ring-foreground/10")} />;
}

/** A label cut by its links: matched parts tinted, a mismatch red, the rest gray; hovering a part lights its partner on the other side */
function Label({ text, links, side, owner, hot, onHot, plain }: { text: string; links?: MatchLink[]; side: "left" | "right"; owner: string; hot: string | null; onHot: (k: string | null) => void; plain?: boolean }) {
	if (plain || !links?.length) return <span>{text}</span>;
	return (
		<>
			{segments(text, links, side).map((s, i) => {
				if (s.link === undefined)
					return (
						<span key={i} className="text-muted-foreground">
							{s.text}
						</span>
					);
				const key = `${owner}:${s.link}`;
				const lit = hot === key;
				return (
					<span
						key={i}
						onPointerEnter={(e) => e.pointerType === "mouse" && onHot(key)}
						onPointerLeave={() => onHot(null)}
						className={cn(
							"rounded-[4px] px-[2px] transition-colors duration-150 motion-reduce:transition-none",
							s.ok ? (lit ? "bg-success/25" : "bg-success-subtle") : lit ? "bg-destructive/20 text-destructive-strong" : "bg-destructive-subtle text-destructive-strong",
						)}
					>
						{s.text}
					</span>
				);
			})}
		</>
	);
}

function Meter({ value, label }: { value: number; label: string }) {
	return (
		<span className="h-[3px] w-10 overflow-hidden rounded-full bg-foreground/10" title={`${label} ${value.toFixed(2)}`}>
			<span className="block h-full rounded-full bg-foreground/60" style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }} />
		</span>
	);
}

function Tool({ icon, label, k, onClick }: { icon?: ReactNode; label: string; k: string; onClick: () => void }) {
	return (
		<button type="button" onClick={onClick} className="flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap outline-none hover:bg-background/10 focus-visible:ring-2 focus-visible:ring-background/40">
			{icon}
			{label}
			<kbd className="grid h-4 min-w-4 place-items-center rounded-[4px] bg-background/15 px-1 font-sans text-[10px] leading-none text-background/70">{k}</kbd>
		</button>
	);
}

function Loading({ label, className }: { label?: ReactNode; className?: string }) {
	return (
		<div aria-busy="true" data-slot="match-review" className={cn("flex flex-col gap-1.5 rounded-2xl bg-muted p-1.5", className)}>
			{label && <div className="truncate px-2 pt-0.5 text-2xs text-muted-foreground">{label}</div>}
			<div className="@container flex flex-col gap-1 rounded-xl border bg-card p-3 shadow-xs" style={{ "--tail": tailOf(0) } as CSSProperties}>
				<Skeleton className="mb-2 h-5 w-24" />
				{[64, 48, 56].map((w) => (
					<div key={w} className={cn(GRID, "items-center gap-y-2 py-2")}>
						<Skeleton className={cn(L, "h-3.5")} style={{ width: `${w}%` }} />
						<Skeleton className={cn(R, "h-3.5")} style={{ width: `${w + 12}%` }} />
						<span className={T} />
					</div>
				))}
			</div>
		</div>
	);
}

function MatchReview({ pairs, signals = [], columns, label, decisions: given, onDecide, onDone, className }: MatchReviewProps) {
	const [state, setState] = useState<ReviewState>(EMPTY);
	/** Each step back: the review and the row in focus before it */
	const [history, setHistory] = useState<{ state: ReviewState; focus: string | null | undefined }[]>([]);
	const [focus, setFocus] = useState<string | null | undefined>(undefined);
	const [active, setActive] = useState(0);
	const [member, setMember] = useState(0);
	const [hot, setHot] = useState<string | null>(null);
	const [sureOpen, setSureOpen] = useState(false);
	const [said, setSaid] = useState("");
	const [barTop, setBarTop] = useState<number | null>(null);
	const [busy, setBusy] = useState(false);
	const [sent, setSent] = useState<MatchDecision[] | null>(null);
	const boxes = useRef<Record<string, HTMLDivElement | null>>({});
	const touched = useRef(false);
	const after = useRef<number | null>(null);

	const list = pairs ?? [];
	const answer = given ?? sent;
	const readOnly = !!answer;
	const s = useMemo(() => (answer ? settled(list, answer) : state), [answer, list, state]);
	const { blocks: bs, sure } = useMemo(() => blocks(list, s), [list, s]);
	const open = bs.filter((b) => isOpen(b, s));
	const focused = readOnly ? null : (bs.find((b) => b.key === focus) ?? null);
	const fp = focused?.kind === "pair" ? focused.pair : null;
	const fg = focused?.kind === "group" ? focused : null;
	const cands = fp ? candidatesOf(fp) : [];
	const act = cands[active] ?? cands[0] ?? null;
	const images = list.some((p) => p.left.image || candidatesOf(p).some((c) => c.item.image));
	const claimedBy = (id: string, except: string) => list.find((p) => p.id !== except && rightOf(p, s) === id);
	const kept = final(list, s).filter((d) => d.right !== null).length;

	// The first open row takes focus once there is one; after an action, the next open row from where it was
	useEffect(() => {
		if (focus === undefined && open.length) setFocus(open[0]!.key);
	}, [focus, open]);
	useEffect(() => {
		if (after.current === null) return;
		const i = after.current;
		after.current = null;
		setFocus((bs.slice(i).find((b) => isOpen(b, s)) ?? open[0])?.key ?? null);
	}, [bs, s, open]);
	useEffect(() => {
		if (fp) {
			const i = cands.findIndex((c) => c.item.id === rightOf(fp, s));
			setActive(i >= 0 ? i : 0);
		}
		setMember(0);
	}, [focus]); // only when focus moves
	useLayoutEffect(() => {
		const el = focused ? boxes.current[focused.key] : null;
		setBarTop(el ? el.offsetTop : null);
		if (touched.current && el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
	});

	if (!pairs) return <Loading label={label} className={className} />;

	const apply = (next: ReviewState, from: string, words: string, d?: MatchDecision) => {
		setHistory((h) => [...h, { state, focus }]);
		after.current = bs.findIndex((b) => b.key === from);
		setState(next);
		setSaid(words);
		if (d) onDecide?.(d);
	};
	const choose = (p: MatchPair, right: string | null) => {
		const next = decide(p, right, state);
		apply(next, `p:${p.id}`, right === null ? `已否掉 ${p.left.label}` : `已确认 ${p.left.label}`, next.decisions[p.id]);
	};
	const give = (g: Extract<Block, { kind: "group" }>, keeper: MatchPair) => {
		const next = keep(g, keeper, state);
		apply(next, g.key, `已留给 ${keeper.left.label}`, next.decisions[keeper.id]);
	};
	const giveAll = (g: Extract<Block, { kind: "group" }>) => apply(keepAll(g, state), g.key, `${g.pairs.length} 个都要`);
	const undo = () => {
		const last = history[history.length - 1];
		if (!last || readOnly) return;
		setHistory((h) => h.slice(0, -1));
		setState(last.state);
		setFocus(last.focus);
		setSaid("已撤销");
	};
	const finish = async () => {
		if (busy || readOnly || open.length) return;
		const all = final(list, state);
		setBusy(true);
		try {
			await onDone?.(all);
			setSent(all);
			setSaid("已确认");
		} catch {
			// The host says what went wrong; the card stays open
		}
		setBusy(false);
	};
	const move = (dir: 1 | -1) => setFocus(step(open.map((b) => b.key), focus, dir));

	const onKey = (e: KeyboardEvent) => {
		touched.current = true;
		if (readOnly) return;
		if ((e.metaKey || e.ctrlKey) && e.key === "z") {
			e.preventDefault();
			undo();
			return;
		}
		if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !open.length) {
			e.preventDefault();
			finish();
			return;
		}
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if (e.key === "u") return undo();
		const k = e.key;
		if (k === "ArrowRight" || k === "ArrowLeft") {
			e.preventDefault();
			return move(k === "ArrowRight" ? 1 : -1);
		}
		if (k === "Escape") return setFocus(null);
		if (!focused || !isOpen(focused, s)) return;
		const n = fg ? fg.pairs.length : cands.length;
		const set = fg ? setMember : setActive;
		if ((k === "ArrowDown" || k === "ArrowUp") && n > 1) {
			e.preventDefault();
			return set((m) => (m + (k === "ArrowDown" ? 1 : -1) + n) % n);
		}
		if (fg) {
			if (k === "y" || k === "Enter") {
				e.preventDefault();
				give(fg, fg.pairs[member]!);
			} else if (k === "a") giveAll(fg);
			return;
		}
		if (!fp) return;
		if (k === "y" || k === "Enter") {
			e.preventDefault();
			choose(fp, act?.item.id ?? null);
		} else if (k === "n" || k === "Backspace") {
			e.preventDefault();
			choose(fp, null);
		}
	};

	/** Narrow, the right item sits under the left, its text in line with the left's */
	const indent = images ? "pl-8 @[480px]:pl-0" : "pl-4 @[480px]:pl-0";
	const left = (p: MatchPair, links: MatchLink[] | undefined, owner: string, plain?: boolean, cls?: string) => (
		<span className={cn("flex min-w-0 items-center gap-2", cls)}>
			{images && <Thumb item={p.left} />}
			<span className="truncate text-sm">
				<Label text={p.left.label} links={links} side="left" owner={owner} hot={hot} onHot={setHot} plain={plain} />
			</span>
		</span>
	);

	const pairRow = (b: Extract<Block, { kind: "pair" }>) => {
		const p = b.pair;
		const d = s.decisions[p.id];
		const r = rightOf(p, s);
		const shown = candidateOf(p, r);
		if (focused?.key === b.key && !d && act) {
			// The right column spreads into the candidates: the chosen one as is, the rest dimmed
			return (
				<div className={cn(GRID, "px-2.5 py-1")}>
					{left(p, act.links, `${p.id}:${act.item.id}`, false, cn(L, "h-8"))}
					<div className={cn(R, "flex min-w-0 flex-col", indent)} role="radiogroup" aria-label={`${p.left.label} 对哪一个`}>
						{cands.map((c, i) => {
							const other = claimedBy(c.item.id, p.id);
							return (
								<button
									type="button"
									role="radio"
									aria-checked={i === active}
									key={c.item.id}
									onClick={() => setActive(i)}
									className={cn("flex h-8 min-w-0 items-center gap-2 rounded-sm text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", FADE, i !== active && "opacity-40 hover:opacity-70")}
								>
									{images && <Thumb item={c.item} small />}
									<span className="truncate text-sm">
										<Label text={c.item.label} links={c.links} side="right" owner={`${p.id}:${c.item.id}`} hot={hot} onHot={setHot} />
									</span>
									{other && <span className="size-1.5 shrink-0 rounded-full bg-waiting" title={`已对到 ${other.left.label}`} />}
								</button>
							);
						})}
						<button type="button" onClick={() => choose(p, null)} className="h-7 w-fit rounded-sm text-xs text-muted-foreground opacity-70 outline-none hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50">
							都不是
						</button>
					</div>
					<div className={cn(T, "hidden flex-col @[480px]:flex")} aria-hidden={!signals.length}>
						{cands.map((c, i) => (
							<span key={c.item.id} className={cn("flex h-8 items-center justify-end gap-2", FADE, i !== active && "opacity-40")}>
								{signals.map((sg) => (
									<Meter key={sg.id} value={c.scores?.[sg.id] ?? 0} label={sg.label} />
								))}
							</span>
						))}
					</div>
				</div>
			);
		}
		const rejected = d?.right === null;
		const owner = `${p.id}:${r}`;
		return (
			<button
				type="button"
				disabled={readOnly || !!d}
				onClick={() => {
					touched.current = true;
					setFocus(b.key);
				}}
				aria-label={`${p.left.label} 对 ${shown?.item.label ?? "无"}${d ? (rejected ? "，已否掉" : "，已确认") : ""}`}
				className={cn(GRID, "min-h-10 w-full items-center px-2.5 py-1.5 text-left outline-none disabled:cursor-default @[480px]:py-0")}
			>
				{left(p, shown?.links, owner, !!d || readOnly, cn(L, "min-h-7"))}
				<span className={cn(R, "flex min-h-7 min-w-0 items-center gap-2", indent)}>
					{rejected ? (
						<span className="truncate text-sm text-muted-foreground line-through decoration-muted-foreground/40">{candidateOf(p, d.proposed)?.item.label ?? "无"}</span>
					) : shown ? (
						<>
							{images && <Thumb item={shown.item} />}
							<span className="truncate text-sm">
								<Label text={shown.item.label} links={shown.links} side="right" owner={owner} hot={hot} onHot={setHot} plain={!!d || readOnly} />
							</span>
						</>
					) : (
						<span className="text-sm text-muted-foreground">无</span>
					)}
				</span>
				<span className={cn(T, "flex min-w-10 justify-end text-xs whitespace-nowrap text-muted-foreground")}>
					{rejected ? "已否掉" : d ? <Check className="size-3.5 text-success-strong" aria-hidden /> : p.note}
				</span>
			</button>
		);
	};

	const groupRow = (g: Extract<Block, { kind: "group" }>) => {
		const on = focused?.key === g.key;
		const done = s.kept.includes(g.key);
		const lead = g.pairs[on ? member : 0]!;
		return (
			<div className={cn(GRID, "px-2.5 pb-1.5 @[480px]:pb-0")}>
				<div className={cn(L, "flex min-w-0 flex-col")} role={on ? "radiogroup" : undefined} aria-label={on ? `${g.right?.label} 留给谁` : undefined}>
					{g.pairs.map((p, i) => (
						<button
							type="button"
							key={p.id}
							role={on ? "radio" : undefined}
							aria-checked={on ? member === i : undefined}
							disabled={readOnly || done}
							onClick={() => {
								touched.current = true;
								setFocus(g.key);
								setMember(i);
							}}
							className={cn("flex h-9 min-w-0 items-center rounded-sm text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default @[480px]:h-10", FADE, on && member !== i && "opacity-40 hover:opacity-70")}
						>
							{left(p, candidateOf(p, g.shared)?.links, `${g.key}:${p.id}`, done || readOnly)}
						</button>
					))}
				</div>
				<div className={cn(R, "flex min-h-7 min-w-0 items-center gap-2 self-center", indent)}>
					{images && <Thumb item={g.right} />}
					<span className="truncate text-sm">
						<Label text={g.right?.label ?? ""} links={candidateOf(lead, g.shared)?.links} side="right" owner={`${g.key}:${lead.id}`} hot={hot} onHot={setHot} plain={!on || done} />
					</span>
					<span className={cn("shrink-0 text-xs tabular-nums", done ? "text-muted-foreground" : "text-waiting-strong")} aria-label={`${g.pairs.length} 个对到这一项`}>
						×{g.pairs.length}
					</span>
				</div>
				<span className={cn(T, "flex min-w-10 items-center justify-end self-center")}>{done && <Check className="size-3.5 text-success-strong" aria-hidden />}</span>
			</div>
		);
	};

	const resolved = !open.length;
	const empty = !list.length;
	return (
		<div role="group" aria-label={typeof label === "string" ? label : "对照"} data-slot="match-review" onKeyDown={onKey} className={cn("flex flex-col gap-1.5 rounded-2xl bg-muted p-1.5", className)}>
			{label && <div className="truncate px-2 pt-0.5 text-2xs text-muted-foreground">{label}</div>}
			<div className="@container relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-xs" style={{ "--tail": tailOf(signals.length) } as CSSProperties}>
				<div className={cn("flex h-11 items-center gap-2 border-b px-3", empty && "hidden")}>
					{readOnly ? (
						<>
							<Check className="size-4 text-success-strong" aria-hidden />
							<span className="text-sm font-medium">已确认</span>
							<span className="text-sm text-muted-foreground tabular-nums">{kept}</span>
						</>
					) : resolved ? (
						<>
							<Check className="size-4 text-success-strong" aria-hidden />
							<span className="flex-1 text-sm font-medium">已看完</span>
							<Button size="sm" variant="ghost" className="text-muted-foreground" disabled={!history.length || busy} onClick={undo}>
								<Undo2 />
								撤销
							</Button>
							<Button size="sm" disabled={busy || !onDone} onClick={finish}>
								{busy ? <Spinner /> : <Check />}
								完成
							</Button>
						</>
					) : (
						<>
							<span className="grid size-5 place-items-center rounded-full bg-success-subtle text-xs font-medium text-success-strong tabular-nums">{open.length}</span>
							<span className="flex-1 text-sm font-medium">待确认</span>
							<Button size="icon-sm" variant="ghost" className="text-muted-foreground" aria-label="上一处" disabled={open.length < 2} onClick={() => move(-1)}>
								<ChevronLeft />
							</Button>
							<Button size="icon-sm" variant="ghost" className="text-muted-foreground" aria-label="下一处" disabled={open.length < 2} onClick={() => move(1)}>
								<ChevronRight />
							</Button>
							<Button size="sm" onClick={() => apply(acceptAll(list, state), focus ?? "", "已全部接受")}>
								全部接受
							</Button>
						</>
					)}
				</div>

				<div className="relative pt-1 pb-1.5">
					{columns && !empty && (
						<div className={cn(GRID, "mx-1.5 items-end px-2.5 pt-1 pb-1 text-2xs text-muted-foreground @[480px]:h-7 @[480px]:pt-0")}>
							<span className={cn(L, "truncate")}>{columns[0]}</span>
							<span className={cn(R, "truncate", indent)}>{columns[1]}</span>
							<span className={cn(T, "hidden justify-end gap-2 @[480px]:flex")}>
								{fp &&
									signals.map((sg) => (
										<span key={sg.id} className="w-10 text-right">
											{sg.label}
										</span>
									))}
							</span>
						</div>
					)}

					{empty && <p className="px-4 py-6 text-center text-xs text-muted-foreground">没有要对照的</p>}

					{focused && barTop !== null && (
						<div className="pointer-events-none absolute top-0 right-3 z-10 transition-transform duration-200 ease-out-strong motion-reduce:transition-none" style={{ transform: `translateY(${barTop - 34}px)` }}>
							<div role="toolbar" aria-label="这一处" className="pointer-events-auto flex h-8 items-center gap-0.5 rounded-[10px] bg-foreground p-1 text-background shadow-lg">
								{fg ? (
									<>
										<Tool icon={<Check className="size-3.5" />} label="留这个" k="Y" onClick={() => give(fg, fg.pairs[member]!)} />
										<span className="mx-0.5 h-3.5 w-px bg-background/20" />
										<Tool label="都要" k="A" onClick={() => giveAll(fg)} />
									</>
								) : fp ? (
									<>
										<Tool icon={<Check className="size-3.5" />} label="对" k="Y" onClick={() => choose(fp, act?.item.id ?? null)} />
										<span className="mx-0.5 h-3.5 w-px bg-background/20" />
										<Tool icon={<X className="size-3.5" />} label="不对" k="N" onClick={() => choose(fp, null)} />
									</>
								) : null}
							</div>
						</div>
					)}

					{bs.map((b) => (
						<div
							key={b.key}
							ref={(el) => {
								boxes.current[b.key] = el;
							}}
							tabIndex={-1}
							className={cn(
								"mx-1.5 rounded-lg outline-none transition-colors duration-150 motion-reduce:transition-none",
								focused?.key === b.key ? "bg-muted/70" : b.kind === "group" && !s.kept.includes(b.key) ? "bg-muted/35" : !readOnly && isOpen(b, s) && "hover:bg-muted/40",
							)}
						>
							{b.kind === "group" ? groupRow(b) : pairRow(b)}
						</div>
					))}

					{sure.length > 0 && (
						<div className="mx-1.5 mt-1 border-t pt-1">
							<button
								type="button"
								aria-expanded={sureOpen}
								onClick={() => setSureOpen((o) => !o)}
								className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
							>
								<Check className="size-3.5 text-success-strong" aria-hidden />
								已对上 <span className="tabular-nums">{sure.length}</span>
								<ChevronDown className={cn("ml-auto size-3.5 transition-transform duration-200 motion-reduce:transition-none", sureOpen && "rotate-180")} aria-hidden />
							</button>
							{sureOpen &&
								sure.map((p) => (
									<div key={p.id} className={cn(GRID, "items-center px-2.5 py-1 text-xs @[480px]:h-8 @[480px]:py-0")}>
										<span className={cn(L, "flex min-h-6 min-w-0 items-center gap-2")}>
											{images && <Thumb item={p.left} small />}
											<span className="truncate">
												<Label text={p.left.label} links={p.links} side="left" owner={`${p.id}:s`} hot={hot} onHot={setHot} />
											</span>
										</span>
										<span className={cn(R, "flex min-h-6 min-w-0 items-center gap-2", indent)}>
											{images && <Thumb item={p.right} small />}
											<span className="truncate">
												<Label text={p.right?.label ?? "无"} links={p.links} side="right" owner={`${p.id}:s`} hot={hot} onHot={setHot} />
											</span>
										</span>
										<span className={T} />
									</div>
								))}
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

export { MatchReview };
