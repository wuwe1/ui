// DecisionInbox: an agent's open questions for a person, settled one at a time. One decision is open – its detail, the agent's proposal
// and why, its answers; the rest wait as one line each. An answer shows ✓ for half a second, then the decision folds into 「已定」 and the
// next opens in its place, so a thumb stays put. With onDone the answers go back together and can change until 「完成」; without it each
// answer is final when made. Props in, callbacks out.
import { Check, ChevronDown, Undo2 } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "./button.tsx";
import { Input } from "./input.tsx";
import { Kbd } from "./kbd.tsx";
import { Chevron } from "./placeholder.tsx";
import { Skeleton } from "./skeleton.tsx";
import { Spinner } from "./spinner.tsx";
import {
	acceptRest,
	type Answers,
	answerOf,
	byDecision,
	canAcceptRest,
	type DecisionAnswer,
	type DecisionOption,
	final,
	labelOf,
	moveOf,
	nextOf,
	noteRequired,
	optionOf,
	proposalOf,
} from "../lib/decision-inbox.ts";
import { Tray, TrayCard, TrayLabel } from "./tray.tsx";
import { cn } from "../lib/utils.ts";

export type { DecisionAnswer, DecisionOption } from "../lib/decision-inbox.ts";

export type Decision = {
	id: string;
	/** The item or the question – 「UX Writing 统一」 */
	title: string;
	/** One or two lines under the title */
	detail?: ReactNode;
	/** Behind 「查看全文」 – the full text, a preview */
	more?: ReactNode;
	/** Two or three, the same set in the same order down the list */
	options: DecisionOption[];
	/** The option the agent suggests: filled, and named before `reason` */
	proposed?: string;
	/** Why the proposal, one sentence */
	reason?: ReactNode;
};

type DecisionInboxProps = {
	/** null – loading */
	decisions: Decision[] | null;
	/** On the tray above the card – what is being decided */
	label?: ReactNode;
	/** Settled: shows these, read only */
	answers?: DecisionAnswer[];
	/** Each answer as it's made */
	onDecide?: (a: DecisionAnswer) => void;
	/** 「完成」 with every answer. Given, answers can change until then; left out, each is final when made. A promise locks the card until it settles; a rejection unlocks it */
	onDone?: (all: DecisionAnswer[]) => unknown;
	/** Empty: what will show up here */
	emptyNote?: string;
	className?: string;
};

/** How long ✓ stays before the decision folds, and the fold */
const HOLD = 500;
const FOLD = 200;
/** An answered decision on its way out: showing ✓, folding as it was drawn – open or a line */
type Exit = "held" | "folding" | "folding-line";

const omit = <T,>(r: Record<string, T>, ids: string[]) => Object.fromEntries(Object.entries(r).filter(([k]) => !ids.includes(k)));
const RING = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** 「查看全文」: the full text under the detail, scrolling inside 256px */
function More({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	return (
		<div className="flex flex-col gap-1">
			<button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={cn("flex h-8 w-fit items-center gap-1 rounded-sm text-2xs text-muted-foreground hover:text-foreground md:h-6", RING)}>
				<Chevron open={open} />
				查看全文
			</button>
			{open && <div className="max-h-64 overflow-y-auto overscroll-contain rounded-md border bg-background p-2.5 text-xs leading-relaxed whitespace-pre-wrap">{children}</div>}
		</div>
	);
}

function Loading({ label, className }: { label?: ReactNode; className?: string }) {
	return (
		<Tray aria-busy="true" data-slot="decision-inbox" className={className}>
			{label && <TrayLabel>{label}</TrayLabel>}
			<TrayCard className="flex flex-col gap-3 p-3">
				<Skeleton className="h-5 w-16" />
				<div className="flex flex-col gap-2 rounded-lg bg-muted/60 p-3">
					<Skeleton className="h-4 w-2/3" />
					<Skeleton className="h-3.5 w-full" />
					<div className="mt-1 flex gap-2">
						<Skeleton className="h-8 w-16" />
						<Skeleton className="h-8 w-16" />
					</div>
				</div>
				{[56, 72, 48].map((w) => (
					<Skeleton key={w} className="mx-3 h-3.5" style={{ width: `${w}%` }} />
				))}
			</TrayCard>
		</Tray>
	);
}

function DecisionInbox({ decisions, label, answers: given, onDecide, onDone, emptyNote = "需要你定的事会显示在这里", className }: DecisionInboxProps) {
	const [answers, setAnswers] = useState<Answers>({});
	/** Each step back: the answers and the open decision before it */
	const [history, setHistory] = useState<{ answers: Answers; open: string | null }[]>([]);
	/** The decision the person opened; undefined until then – the first waiting */
	const [open, setOpen] = useState<string | null | undefined>(undefined);
	const [exits, setExits] = useState<Record<string, Exit>>({});
	/** The note field: open on one decision, for one option */
	const [writing, setWriting] = useState<{ id: string; option: string; text: string } | null>(null);
	const [doneOpen, setDoneOpen] = useState(false);
	const [said, setSaid] = useState("");
	const [busy, setBusy] = useState(false);
	const [sent, setSent] = useState<DecisionAnswer[] | null>(null);
	const root = useRef<HTMLDivElement>(null);
	const boxes = useRef<Record<string, HTMLDivElement | null>>({});
	const touched = useRef(false);
	const timers = useRef<number[]>([]);

	const list = decisions ?? [];
	const settled = given ?? sent;
	const readOnly = !!settled;
	const batch = !!onDone;
	const a = settled ? byDecision(settled) : answers;
	const waiting = list.filter((d) => !a[d.id]);
	const rows = readOnly ? [] : list.filter((d) => !a[d.id] || exits[d.id]);
	const decided = list.filter((d) => a[d.id] && !exits[d.id]);
	const current = readOnly ? null : open && list.some((d) => d.id === open) && (!a[open] || exits[open] === "held") ? open : (waiting[0]?.id ?? null);
	const resolved = list.length > 0 && !waiting.length;
	// What timers read when they fire
	const live = useRef({ list, answers, current });
	live.current = { list, answers, current };

	useEffect(() => () => timers.current.forEach(clearTimeout), []);
	// Everything answered: the answers are the card's body, and stay open if one is reopened
	useEffect(() => {
		if (resolved) setDoneOpen(true);
	}, [resolved]);

	if (!decisions) return <Loading label={label} className={className} />;

	const later = (ms: number, f: () => void) => void timers.current.push(window.setTimeout(f, ms));
	// Focus follows the open decision once the person has used the card – never on mount
	const focusBox = (id: string | null) => {
		if (!touched.current || !id) return;
		requestAnimationFrame(() => {
			const el = boxes.current[id];
			if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
		});
	};
	const left = (next: Answers) => list.filter((d) => !next[d.id]).length;
	const tail = (n: number) => (n ? `待定 ${n}` : batch ? "已看完" : "已全部处理");

	const choose = (d: Decision, o: DecisionOption, note?: string) => {
		if (readOnly || busy || answers[d.id]) return;
		if (o.note && note === undefined) {
			setWriting({ id: d.id, option: o.id, text: "" });
			return;
		}
		const ans = answerOf(d, o.id, note);
		const next = { ...answers, [d.id]: ans };
		setHistory((h) => [...h, { answers, open: d.id }]);
		setAnswers(next);
		setWriting(null);
		setOpen(d.id);
		setExits((e) => ({ ...e, [d.id]: "held" }));
		setSaid(`${o.label}：${d.title}，${tail(left(next))}`);
		onDecide?.(ans);
		// The button just pressed is gone; the card keeps focus so the keys still work
		root.current?.focus({ preventScroll: true });
		later(HOLD, () => {
			const was = live.current.current === d.id;
			setExits((e) => (e[d.id] ? { ...e, [d.id]: was ? "folding" : "folding-line" } : e));
			if (was) {
				const to = nextOf(live.current.list, live.current.answers, d.id);
				setOpen(to);
				focusBox(to);
			}
			later(FOLD, () => setExits((e) => omit(e, [d.id])));
		});
	};
	const openIt = (id: string) => {
		if (readOnly) return;
		touched.current = true;
		setOpen(id);
		setWriting((w) => (w?.id === id ? w : null));
		focusBox(id);
	};
	const acceptAll = () => {
		if (!batch || readOnly || busy) return;
		const next = acceptRest(list, answers);
		const ids = list.filter((d) => !answers[d.id] && next[d.id]).map((d) => d.id);
		if (!ids.length) return;
		setHistory((h) => [...h, { answers, open: current }]);
		setAnswers(next);
		setWriting(null);
		setExits((e) => ({ ...e, ...Object.fromEntries(ids.map((id) => [id, id === current ? "folding" : "folding-line"] as const)) }));
		later(FOLD, () => setExits((e) => omit(e, ids)));
		const to = current && !next[current] ? current : nextOf(list, next, current);
		setOpen(to);
		focusBox(to);
		for (const id of ids) onDecide?.(next[id]!);
		setSaid(`已采纳 ${ids.length} 条建议，${tail(left(next))}`);
	};
	const reopen = (d: Decision) => {
		if (!batch || readOnly || busy || !answers[d.id]) return;
		setHistory((h) => [...h, { answers, open: current }]);
		setAnswers(omit(answers, [d.id]));
		setOpen(d.id);
		setWriting(null);
		setSaid(`重新定：${d.title}`);
		focusBox(d.id);
	};
	const undo = () => {
		const last = history[history.length - 1];
		if (!batch || !last || readOnly || busy) return;
		timers.current.forEach(clearTimeout);
		timers.current = [];
		setExits({});
		setHistory((h) => h.slice(0, -1));
		setAnswers(last.answers);
		setOpen(last.open);
		setWriting(null);
		setSaid("已撤销");
		focusBox(last.open);
	};
	const finish = async () => {
		if (!batch || busy || readOnly || waiting.length) return;
		const all = final(list, answers);
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
	const closeNote = () => {
		const w = writing;
		setWriting(null);
		if (w) requestAnimationFrame(() => boxes.current[w.id]?.querySelector<HTMLElement>(`[data-option="${CSS.escape(w.option)}"]`)?.focus());
	};

	const onKey = (e: KeyboardEvent) => {
		touched.current = true;
		if (readOnly || busy) return;
		const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
		if ((e.metaKey || e.ctrlKey) && e.key === "z" && !typing) {
			e.preventDefault();
			return undo();
		}
		if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && resolved) {
			e.preventDefault();
			return void finish();
		}
		if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
		if (e.key === "u") return undo();
		const to = moveOf(
			waiting.map((d) => d.id),
			current,
			e.key,
		);
		if (to !== undefined) {
			e.preventDefault();
			if (to) openIt(to);
			return;
		}
		const d = current ? list.find((x) => x.id === current) : undefined;
		const o = d && !answers[d.id] && /^[1-9]$/.test(e.key) ? d.options[Number(e.key) - 1] : undefined;
		if (d && o) {
			e.preventDefault();
			choose(d, o);
		}
	};

	/** What the open decision ends with: its answers, the note field, or ✓ and the answer */
	const answering = (d: Decision) => {
		const done = exits[d.id] ? a[d.id] : undefined;
		if (done)
			return (
				<div className="flex h-11 min-w-0 items-center gap-1.5 text-sm text-muted-foreground animate-in fade-in duration-150 md:h-8">
					<Check className="size-4 shrink-0" aria-hidden />
					<span className="shrink-0">{optionOf(d, done.option)?.label}</span>
					{done.note && <span className="min-w-0 truncate">：{done.note}</span>}
				</div>
			);
		const w = writing?.id === d.id ? writing : null;
		const wo = w ? optionOf(d, w.option) : undefined;
		if (w && wo) {
			// The proposal's reason already says what to do: the sentence is optional there
			const ready = !noteRequired(d, wo) || !!w.text.trim();
			return (
				<div className="flex flex-col gap-2">
					<Input
						autoFocus
						value={w.text}
						disabled={busy}
						onChange={(e) => setWriting({ ...w, text: e.target.value })}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.nativeEvent.isComposing && ready) choose(d, wo, w.text);
							if (e.key === "Escape") {
								e.stopPropagation();
								closeNote();
							}
						}}
						placeholder={`${typeof wo.note === "string" ? wo.note : "补充说明"}${noteRequired(d, wo) ? "" : "，留空照建议"}`}
						aria-label={`${wo.label}：补充说明`}
						className="h-11 bg-background md:h-8"
					/>
					<div className="flex gap-2">
						<Button variant="ghost" className="h-11 flex-1 md:h-8 md:flex-none" onClick={closeNote}>
							取消
						</Button>
						<Button className="h-11 flex-1 md:h-8 md:flex-none" disabled={!ready} onClick={() => choose(d, wo, w.text)}>
							{wo.label}
						</Button>
					</div>
				</div>
			);
		}
		return (
			<div className="flex gap-2">
				{d.options.map((o, i) => {
					const pick = o.id === d.proposed;
					return (
						<Button
							key={o.id}
							data-option={o.id}
							variant={pick ? "default" : "outline"}
							className={cn("h-11 min-w-0 flex-1 md:h-8 md:flex-none", !pick && "bg-background")}
							disabled={busy}
							onClick={() => choose(d, o)}
							aria-keyshortcuts={i < 9 ? String(i + 1) : undefined}
						>
							{labelOf(o)}
							{pick && <span className="sr-only">（建议）</span>}
							{i < 9 && <Kbd className={cn("ml-1 hidden md:inline-flex", pick && "bg-primary-foreground/15 text-primary-foreground/80")}>{i + 1}</Kbd>}
						</Button>
					);
				})}
			</div>
		);
	};

	const row = (d: Decision) => {
		const exit = exits[d.id];
		const look = d.id === current || exit === "folding";
		const done = exit ? a[d.id] : undefined;
		const p = proposalOf(d);
		return (
			<div
				key={d.id}
				inert={!!exit || undefined}
				className={cn(
					"grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-opacity",
					exit === "folding" || exit === "folding-line" ? "grid-rows-[0fr] overflow-hidden opacity-0 ease-in-strong motion-reduce:grid-rows-[1fr]" : "grid-rows-[1fr] ease-out-strong",
				)}
			>
				<div className="min-h-0 min-w-0 px-1.5">
					<div
						ref={(el) => {
							boxes.current[d.id] = el;
						}}
						tabIndex={-1}
						className={cn("rounded-lg outline-none transition-colors duration-150 motion-reduce:transition-none", look && "bg-muted/60")}
					>
						{look ? (
							<p className="px-3 pt-2.5 text-sm font-medium">{d.title}</p>
						) : (
							<button type="button" aria-expanded={false} onClick={() => openIt(d.id)} className={cn("flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground md:min-h-9", RING)}>
								<span className="min-w-0 flex-1 truncate">{d.title}</span>
								{done && (
									<span className="flex shrink-0 items-center gap-1 text-xs">
										<Check className="size-3.5" aria-hidden />
										{optionOf(d, done.option)?.label}
									</span>
								)}
							</button>
						)}
						{/* The body opens and closes in place; closed, nothing in it takes focus */}
						<div className={cn("grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none", look ? "grid-rows-[1fr] ease-out-strong" : "grid-rows-[0fr] ease-in-strong")} inert={!look || undefined}>
							<div className="-mx-1 min-h-0 overflow-hidden px-1">
								<div className="flex flex-col gap-2 px-3 pt-1 pb-3">
									{(d.detail || d.reason) && (
										<div className="flex flex-col gap-1 text-md">
											{d.detail && <div className="text-muted-foreground">{d.detail}</div>}
											{d.reason && (
												<p>
													{p && <span className="font-medium">建议{p.label}：</span>}
													<span className="text-muted-foreground">{d.reason}</span>
												</p>
											)}
										</div>
									)}
									{d.more && <More>{d.more}</More>}
									<div className="pt-1">{answering(d)}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const line = (d: Decision) => {
		const ans = a[d.id]!;
		const can = batch && !readOnly && !busy;
		const inner = (
			<>
				<span className="flex min-w-0 flex-1 flex-col">
					<span className="truncate text-sm">{d.title}</span>
					{ans.note && <span className="truncate text-xs text-muted-foreground">{ans.note}</span>}
				</span>
				<span className="shrink-0 text-xs text-muted-foreground">{optionOf(d, ans.option)?.label ?? ans.option}</span>
				{can && <Chevron className="-mr-1" />}
			</>
		);
		const cls = "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left md:min-h-9";
		return can ? (
			<button key={d.id} type="button" onClick={() => reopen(d)} className={cn(cls, "hover:bg-muted/40", RING)}>
				{inner}
				<span className="sr-only">，重新定</span>
			</button>
		) : (
			<div key={d.id} className={cls}>
				{inner}
			</div>
		);
	};

	const empty = !list.length;
	const head = readOnly ? (
		<>
			<Check className="size-4 text-muted-foreground" aria-hidden />
			<span className="text-sm font-medium">已确认</span>
			<span className="text-sm text-muted-foreground tabular-nums">{decided.length}</span>
		</>
	) : resolved ? (
		<>
			<Check className="size-4 text-muted-foreground" aria-hidden />
			<span className="flex-1 text-sm font-medium">{batch ? "已看完" : "已全部处理"}</span>
			{batch && (
				<>
					<Button size="sm" variant="ghost" className="h-9 text-muted-foreground md:h-7" disabled={!history.length || busy} onClick={undo}>
						<Undo2 />
						撤销
					</Button>
					<Button size="sm" className="h-9 md:h-7" disabled={busy} onClick={finish}>
						{busy ? <Spinner /> : <Check />}
						完成
					</Button>
				</>
			)}
		</>
	) : (
		<>
			<span className="size-2 shrink-0 rounded-full bg-waiting" aria-hidden />
			<span className="text-sm font-medium">待定</span>
			<span className="flex-1 text-sm text-muted-foreground tabular-nums">{waiting.length}</span>
			{batch && history.length > 0 && (
				<Button size="icon-sm" variant="ghost" className="size-9 text-muted-foreground md:size-7" aria-label="撤销" title="撤销（U）" onClick={undo}>
					<Undo2 />
				</Button>
			)}
			{batch && waiting.length > 1 && canAcceptRest(list, answers) && (
				<Button size="sm" variant="outline" className="h-9 bg-background md:h-7" onClick={acceptAll}>
					采纳其余建议
				</Button>
			)}
		</>
	);

	return (
		<Tray
			ref={root}
			role="group"
			aria-label={typeof label === "string" ? label : "待定事项"}
			data-slot="decision-inbox"
			tabIndex={-1}
			onKeyDown={onKey}
			onPointerDown={() => (touched.current = true)}
			className={cn("outline-none", className)}
		>
			{label && <TrayLabel>{label}</TrayLabel>}
			<TrayCard className="flex flex-col">
				{!empty && <div className="flex h-12 items-center gap-2 border-b pr-1.5 pl-3 md:h-11">{head}</div>}
				<div className="flex flex-col py-1.5">
					{empty && (
						<div className="flex flex-col items-center gap-1 px-4 py-5 text-center">
							<span className="text-sm">暂无待定事项</span>
							<span className="text-xs text-muted-foreground">{emptyNote}</span>
						</div>
					)}
					{rows.map(row)}
					{decided.length > 0 &&
						(rows.length && !resolved ? (
							<div className="mx-1.5 mt-1 border-t pt-1">
								<button type="button" aria-expanded={doneOpen} onClick={() => setDoneOpen((o) => !o)} className={cn("flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground md:min-h-9", RING)}>
									<Check className="size-3.5" aria-hidden />
									已定 <span className="tabular-nums">{decided.length}</span>
									<ChevronDown className={cn("ml-auto size-3.5 transition-transform duration-200 motion-reduce:transition-none", doneOpen && "rotate-180")} aria-hidden />
								</button>
								{doneOpen && decided.map(line)}
							</div>
						) : (
							<div className="px-1.5">{decided.map(line)}</div>
						))}
				</div>
			</TrayCard>
			<div role="status" aria-live="polite" className="sr-only">
				{said}
			</div>
		</Tray>
	);
}

export { DecisionInbox };
