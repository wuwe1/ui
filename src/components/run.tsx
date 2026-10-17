// Run: one turn of an agent's work as a line that opens level by level – the steps it took, each step's calls, each call's thought, arguments and result.
// A step is what the agent did after it last said something; its title is the last sentence it said before acting – the first ones usually report the step before.
// Text on screen stays put: new lines fade in where they will stay, and a step or run that finished in front of you folds only once it has scrolled out of sight (useTuck).
import { Bot, Brain, Check, CircleStop, type LucideIcon, TriangleAlert } from "lucide-react";
import { type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible.tsx";
import { Elapsed } from "./elapsed.tsx";
import { StatList, TurnAgentRows, TurnFileRows } from "./message-actions.tsx";
import { CHEVRON, Chevron } from "./placeholder.tsx";
import { Shimmer } from "./shimmer.tsx";
import { ToolCall, type ToolCallItem } from "./tool-call.tsx";
import { useTuck } from "../hooks/use-tuck.ts";
import { runLabel, type RunState, stepTitle } from "../lib/run.ts";
import { elapsed } from "../lib/time.ts";
import type { TurnAgent, TurnFile } from "../lib/turn-stats.ts";
import { cn } from "../lib/utils.ts";

export type { RunState } from "../lib/run.ts";

/** Opening and closing by hand: the body slides 200ms; with reduced motion there is no animation to switch off – it only exists under motion-safe */
const SLIDE = "overflow-hidden ease-out-strong motion-safe:data-open:animate-collapsible-down motion-safe:data-closed:animate-collapsible-up";
const FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";
/** --ease-out-strong, for the Web Animations API */
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

/** What was said, as written – `code` in monospace */
const plain = (say: string) =>
	say.split(/(`[^`\n]+`)/).map((x, i) => (x.length > 2 && x.startsWith("`") && x.endsWith("`") ? <code key={i} className="rounded bg-muted px-1 font-mono text-[0.92em]">{x.slice(1, -1)}</code> : x));

/**
 * Open or not. A given `open` wins, then a click; otherwise running and stopped are open, and a finished one is open only if it finished
 * in front of you – until it scrolls out of sight above. One that was finished when it appeared starts folded.
 * still – it folded out of sight: no animation, so its height leaves at once and the scroll position takes it back
 */
function useFold(ref: RefObject<HTMLElement | null>, state: RunState, open?: boolean, defaultOpen?: boolean, onOpenChange?: (open: boolean) => void) {
	const [watched] = useState(state !== "done");
	const [mine, setMine] = useState<boolean | null>(defaultOpen ?? null);
	const free = open === undefined && mine === null;
	const away = useTuck(ref, free && watched && state === "done");
	return {
		isOpen: open ?? mine ?? (state !== "done" || (watched && !away)),
		still: free && away,
		set: (o: boolean) => {
			setMine(o);
			onOpenChange?.(o);
		},
	};
}

type RunProps = {
	state: RunState;
	/** Steps so far */
	steps: number;
	/** running – when the run started, in ms since the epoch: the header's clock */
	since?: number;
	/** done or stopped – how long it ran */
	ms?: number;
	/** Tool calls made, and how many failed */
	tools?: number;
	failed?: number;
	/** Changed files with their lines; onFile opens one */
	files?: TurnFile[];
	onFile?: (path: string) => void;
	/** Subagents it started; onAgent opens one */
	agents?: TurnAgent[];
	onAgent?: (id: string) => void;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** The steps – RunStep, oldest first */
	children?: ReactNode;
	id?: string;
	className?: string;
};

/**
 * The run: one line – its status, its time, and once it ends the calls, files and subagents – over its steps.
 * Running and stopped, the steps show; finished, they fold into the line
 */
function Run({ state, steps, since, ms, tools = 0, failed = 0, files = [], onFile, agents = [], onAgent, open, defaultOpen, onOpenChange, children, id, className }: RunProps) {
	const ref = useRef<HTMLDivElement>(null);
	const { isOpen, still, set } = useFold(ref, state, open, defaultOpen, onOpenChange);
	const live = state === "running";
	const label = runLabel(state, steps);
	return (
		<Collapsible ref={ref} id={id} data-slot="run" data-run={state} open={isOpen} onOpenChange={set} className={cn("flex min-w-0 flex-col", className)}>
			<span className="sr-only" role="status">
				{label}
			</span>
			{/* Facts show once it ends: added while it runs, they could wrap to a new line and push everything under them */}
			<div className="flex min-w-0 flex-wrap items-center gap-x-3 text-md text-muted-foreground">
				<CollapsibleTrigger className={cn(CHEVRON, "flex min-w-0 items-center gap-2 rounded-md py-1 text-left transition-colors hover:text-foreground pointer-coarse:min-h-11", FOCUS)}>
					<Chevron className="size-3.5 text-current" />
					{state === "stopped" && <CircleStop className="size-3.5 shrink-0" aria-hidden />}
					<Shimmer active={live} className="shrink-0">
						{label}
					</Shimmer>
					{live ? since !== undefined && <Elapsed since={since} aria-hidden /> : ms !== undefined && <span className="tabular-nums" aria-hidden>{elapsed(ms)}</span>}
				</CollapsibleTrigger>
				{!live && tools > 0 && (
					<span className="flex items-center gap-1.5 tabular-nums">
						{tools} 次调用
						{failed > 0 && <span className="text-destructive-strong">{failed} 次失败</span>}
					</span>
				)}
				{!live && files.length > 0 && (
					<StatList name="改动" title="这一轮改动的文件" rows={(close) => <TurnFileRows files={files} onFile={onFile} close={close} />}>
						改动 {files.length} 个文件
					</StatList>
				)}
				{!live && agents.length > 0 && (
					<StatList name="子代理" title="这一轮的子代理" rows={(close) => <TurnAgentRows agents={agents} onAgent={onAgent} close={close} />}>
						{agents.length} 个子代理
					</StatList>
				)}
			</div>
			<CollapsibleContent className={still ? "overflow-hidden" : SLIDE}>
				<ol className="mt-0.5 ml-1.5 flex flex-col border-l pl-2">{children}</ol>
			</CollapsibleContent>
		</Collapsible>
	);
}

type RunStepProps = {
	/** Its number, from 1 */
	n: number;
	/** What the agent said before acting. The title is its last sentence; the open step shows it all */
	say: string;
	/** Instead of the last sentence – nothing was said, say */
	title?: string;
	/** Draws what was said – Markdown, say. Default: the text as written, `code` in monospace */
	renderSay?: (say: string) => ReactNode;
	state: RunState;
	/** Its calls, oldest first. The line counts them; the open step lists them unless children are given */
	calls?: ToolCallItem[];
	/** running – when the step started: a clock */
	since?: number;
	/** done – how long it took */
	ms?: number;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** The open step under what was said: calls, notes, a tail. Default: every call as a ToolCall */
	children?: ReactNode;
	className?: string;
};

/** One step: a line – number, title, then failures, calls and time or 「已中断」 – that opens to what was said and done */
function RunStep({ n, say, title, renderSay, state, calls = [], since, ms, open, defaultOpen, onOpenChange, children, className }: RunStepProps) {
	const ref = useRef<HTMLLIElement>(null);
	const { isOpen, still, set } = useFold(ref, state, open, defaultOpen, onOpenChange);
	const live = state === "running";
	const failed = calls.filter((c) => c.status === "failed").length;
	const first = calls[0];
	const heading = title ?? (stepTitle(say) || (first ? `${first.name} ${first.summary}` : ""));
	return (
		<Collapsible asChild open={isOpen} onOpenChange={set}>
			<li ref={ref} data-slot="run-step" data-run={state} aria-current={live ? "step" : undefined} className={cn("flex min-w-0 animate-in flex-col fade-in duration-200", className)}>
				<CollapsibleTrigger
					title={heading}
					className={cn(CHEVRON, "flex min-w-0 items-center gap-2 rounded-md py-1 text-left text-md transition-colors hover:text-foreground pointer-coarse:min-h-11", state === "done" ? "text-muted-foreground" : "text-foreground", FOCUS)}
				>
					<Chevron className="size-3.5" />
					<span className="w-4 shrink-0 text-right text-2xs text-muted-foreground tabular-nums">{n}</span>
					{/* An empty title keeps the line's height: the line under it doesn't move when the first word comes */}
					<Shimmer active={live} className="min-w-0 truncate">
						{heading || " "}
					</Shimmer>
					<span className="ml-auto flex shrink-0 items-center gap-3 pl-2 text-2xs text-muted-foreground tabular-nums">
						{failed > 0 && (
							<span className="flex items-center gap-1 text-destructive-strong">
								<TriangleAlert className="size-3" aria-hidden />
								{failed}
							</span>
						)}
						{state === "stopped" ? (
							<span className="flex items-center gap-1">
								<CircleStop className="size-3" aria-hidden />
								已中断
							</span>
						) : (
							calls.length > 0 && <span>{calls.length} 次</span>
						)}
						{live ? since !== undefined && <Elapsed since={since} aria-hidden /> : state === "done" && ms !== undefined && ms >= 1000 && <span aria-hidden>{elapsed(ms)}</span>}
					</span>
				</CollapsibleTrigger>
				<CollapsibleContent className={still ? "overflow-hidden" : SLIDE}>
					{/* New rows fade in where they stay – nothing slides */}
					<div className="mt-0.5 mb-1.5 ml-7.5 flex min-w-0 flex-col gap-0.5 border-l pl-3.5 [&>*]:animate-in [&>*]:fade-in [&>*]:duration-200">
						{say && <div className="py-1 text-md leading-relaxed break-words text-muted-foreground">{renderSay ? renderSay(say) : <span className="whitespace-pre-wrap">{plain(say)}</span>}</div>}
						{children ?? calls.map((c) => <ToolCall key={c.id} call={c} />)}
					</div>
				</CollapsibleContent>
			</li>
		</Collapsible>
	);
}

/** A box's position, as getBoundingClientRect gives it – where a waiting message sat */
type Box = { left: number; top: number };
const isBox = (x: unknown): x is Box => typeof x === "object" && x !== null && "left" in x && "top" in x;

type RunNoteProps = {
	/** you – your words, sent while it ran; event – something that came in: a subagent's report, a background task */
	kind?: "you" | "event";
	/** Your words; for an event, its first line */
	text: string;
	/** event: its icon and name */
	icon?: LucideIcon;
	label?: string;
	/** It just came in. A box – where your message waited, its card above the input: it moves from there into the step. true – it fades in */
	from?: Box | true | null;
	/** event: what opens under the line – the full report */
	children?: ReactNode;
	className?: string;
};

/**
 * What came in while a step ran, at the point it was read. Your words: your bubble, as in the conversation, on the right of the step –
 * where it sits says when it was read, and a ✓ after the words says that it was; no tag under it. Just read, it slides in from
 * where it waited, tinted; the tint fades and the ✓ shows. An event: one line that opens to its content
 */
function RunNote({ kind = "you", text, icon: I = Bot, label = "子代理回报", from, children, className }: RunNoteProps) {
	const el = useRef<HTMLDivElement>(null);
	const [fresh] = useState(!!from);
	const [lit, setLit] = useState(!!from && kind === "you");
	useLayoutEffect(() => {
		const node = el.current;
		if (!fresh || !node) return;
		const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
		// Measure where it lands after every layout effect of this commit: a container that follows new output has scrolled by then
		queueMicrotask(() => {
			if (isBox(from) && !still) {
				const to = node.getBoundingClientRect();
				node.animate([{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)` }, { transform: "none" }], { duration: 620, easing: EASE_OUT });
			} else node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: EASE_OUT });
		});
		const t = setTimeout(() => setLit(false), 620);
		return () => clearTimeout(t);
	}, []);
	if (kind === "event")
		return (
			<Collapsible className={cn("min-w-0 py-1", className)} data-slot="run-note">
				<div ref={el}>
					<CollapsibleTrigger disabled={!children} className={cn(CHEVRON, "flex w-full min-w-0 items-center gap-2 rounded-md text-left text-md text-muted-foreground enabled:hover:text-foreground", FOCUS)}>
						<I className="size-3.5 shrink-0" aria-hidden />
						<span className="shrink-0">{label}</span>
						<span className="min-w-0 truncate">{text}</span>
						{children && <Chevron className="ml-auto size-3.5 text-current" />}
					</CollapsibleTrigger>
				</div>
				{children && (
					<CollapsibleContent className={SLIDE}>
						<div className="mt-1 ml-5.5 max-h-96 overflow-auto rounded-lg border bg-muted/30 p-3 text-md">{children}</div>
					</CollapsibleContent>
				)}
			</Collapsible>
		);
	return (
		<div data-slot="run-note" className={cn("flex min-w-0 justify-end py-1 pl-8", className)}>
			<div
				ref={el}
				className={cn(
					"max-w-full rounded-2xl rounded-br-md px-3 py-1.5 text-md leading-relaxed break-words whitespace-pre-wrap text-secondary-foreground ring-1 transition-[background-color,box-shadow] duration-[1400ms] ease-out",
					lit ? "bg-unread-subtle ring-unread/50" : "bg-secondary ring-transparent",
				)}
			>
				{text}
				{/* The receipt rides at the end of the words, inside the bubble; it is there from the start, so nothing moves when it shows */}
				<Check className={cn("ml-1 inline-block size-3 align-[-0.1em] text-muted-foreground transition-opacity duration-300", lit && "opacity-0")} aria-hidden />
				<span className="sr-only">，已读取</span>
			</div>
			{fresh && (
				<span className="sr-only" role="status">
					已读取运行中发送的消息
				</span>
			)}
		</div>
	);
}

/** The open step's last line while no call runs: 「正在思考…」 and a clock. stopped – 「中断时正在思考」. children – other words */
function RunTail({ state = "thinking", since, children, className }: { state?: "thinking" | "stopped"; since?: number; children?: ReactNode; className?: string }) {
	const stopped = state === "stopped";
	return (
		<div data-slot="run-tail" className={cn("flex min-w-0 items-center gap-2 py-1 text-md text-muted-foreground", className)}>
			{stopped ? <CircleStop className="size-3.5 shrink-0" aria-hidden /> : <Brain className="size-3.5 shrink-0" aria-hidden />}
			{stopped ? (
				<span className="min-w-0 truncate">{children ?? "中断时正在思考"}</span>
			) : (
				<Shimmer className="min-w-0 truncate">{children ?? "正在思考…"}</Shimmer>
			)}
			{!stopped && since !== undefined && <Elapsed since={since} className="ml-auto shrink-0 pl-2 text-2xs" aria-hidden />}
		</div>
	);
}

export { Run, RunNote, RunStep, RunTail };
