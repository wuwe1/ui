// ToolCall and ToolCallGroup: an agent's tool calls, one line each – icon, name, summary, then a clock, a duration or 「失败」.
// A line opens to its arguments and result, each with copy; a failure shows its message, with 「重试」 when the caller can retry.
// A group folds a run of calls under one header – the tools it used, how many, how long – and keeps running calls in sight while folded.
// Lines, not cards: an agent turn can make dozens of calls.
import { Check, CircleAlert, Copy, type LucideIcon, RotateCw, TriangleAlert, Wrench } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "./button.tsx";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible.tsx";
import { Elapsed } from "./elapsed.tsx";
import { Chevron } from "./placeholder.tsx";
import { Shimmer } from "./shimmer.tsx";
import { Skeleton } from "./skeleton.tsx";
import { elapsed } from "../lib/time.ts";
import { groupState, stack, type ToolCallData } from "../lib/tool-call.ts";
import { cn } from "../lib/utils.ts";

export type { ToolCallData, ToolCallStatus } from "../lib/tool-call.ts";

/** A call as the components draw it: the data, plus the tool's icon */
export type ToolCallItem = ToolCallData & { icon?: LucideIcon };

/** Open and close: the body slides in 200ms; with reduced motion there is no animation to switch off – it only exists under motion-safe */
const SLIDE = "overflow-hidden ease-out-strong motion-safe:data-open:animate-collapsible-down motion-safe:data-closed:animate-collapsible-up";
const FOCUS = "rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** The line itself: icon, name, summary, and on the right a clock, the duration or 「失败」. Running – the summary shimmers. Under 1s – no duration, it's noise */
function ToolCallLine({ call, className }: { call: ToolCallItem; className?: string }) {
	const { name, summary, status, since, ms } = call;
	const I = call.icon ?? Wrench;
	return (
		<span data-slot="tool-call-line" className={cn("flex min-w-0 items-center gap-2 text-md", className)}>
			<I className={cn("size-3.5 shrink-0", status === "failed" ? "text-destructive-strong" : "text-muted-foreground")} aria-hidden />
			<span className="shrink-0 font-medium">{name}</span>
			<Shimmer active={status === "running"} className="min-w-0 truncate font-mono text-xs text-muted-foreground">
				{summary}
			</Shimmer>
			<span className="ml-auto shrink-0 pl-2 text-2xs text-muted-foreground tabular-nums">
				{status === "running" ? since !== undefined && <Elapsed since={since} aria-hidden /> : status === "failed" ? <span className="text-destructive-strong">失败</span> : ms !== undefined && ms >= 1000 && elapsed(ms)}
			</span>
		</span>
	);
}

/** Copy: the icon turns into a check for 1.5s */
function CopyButton({ text, label }: { text: string; label: string }) {
	const [copied, setCopied] = useState<boolean | null>(null);
	const copy = () =>
		navigator.clipboard.writeText(text).then(
			() => {
				setCopied(true);
				setTimeout(() => setCopied(null), 1500);
			},
			() => setCopied(false),
		);
	return (
		<Button variant="ghost" size="icon-xs" className="size-5 text-muted-foreground" onClick={copy} aria-label={label} title={copied === false ? "复制失败" : label}>
			{copied ? <Check className="size-3" /> : <Copy className="size-3" />}
		</Button>
	);
}

/** 「参数」「结果」: a label with copy, then the text – null while it loads */
function Section({ label, text, render }: { label: string; text: string | null; render: (text: string) => ReactNode }) {
	return (
		<div className="flex flex-col gap-1">
			<div className="flex h-5 items-center gap-1 text-2xs text-muted-foreground">
				{label}
				{text && <CopyButton text={text} label={`复制${label}`} />}
			</div>
			{text === null ? (
				<div className="flex flex-col gap-1.5 rounded-md border p-2.5" aria-busy="true">
					<Skeleton className="h-3 w-3/5" />
					<Skeleton className="h-3 w-2/5" />
				</div>
			) : (
				render(text)
			)}
		</div>
	);
}

const plain = (text: string) => <pre className="max-h-72 overflow-auto rounded-md border bg-muted/40 p-2.5 font-mono text-xs leading-code whitespace-pre-wrap break-all">{text}</pre>;

type ToolCallProps = {
	call: ToolCallItem;
	/** Arguments as text, shown open; null while they load */
	args?: string | null;
	/** Result as text, shown open; null while it loads */
	result?: string | null;
	/** failed – the message in the red box */
	error?: string;
	/** Draws args and results – a highlighter, say. Default: plain monospace */
	renderCode?: (text: string, part: "args" | "result") => ReactNode;
	/** Shows 「重试」 in the red box */
	onRetry?: () => void;
	/** The result was cut: shows 「显示完整结果」 */
	onMore?: () => void;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** Buttons at the end of the line – open the file, the sub-agent */
	actions?: ReactNode;
	/** Under the line, open or not – what a sub-agent is doing now */
	children?: ReactNode;
	className?: string;
};

/** One call: the line opens to its error, arguments and result */
function ToolCall({ call, args, result, error, renderCode, onRetry, onMore, open, defaultOpen, onOpenChange, actions, children, className }: ToolCallProps) {
	const draw = (part: "args" | "result") => (text: string) => (renderCode ? renderCode(text, part) : plain(text));
	return (
		<Collapsible data-slot="tool-call" open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} className={className}>
			<div className="flex items-center gap-2">
				<CollapsibleTrigger className={cn("flex min-w-0 flex-1 py-1 text-left", FOCUS)}>
					<ToolCallLine call={call} className="flex-1" />
				</CollapsibleTrigger>
				{actions}
			</div>
			{children}
			<CollapsibleContent className={SLIDE}>
				<div className="flex flex-col gap-2 pt-1 pb-2 pl-5.5">
					{error && (
						<div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-subtle px-3 py-2 text-xs text-destructive-strong">
							<CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
							<span className="min-w-0 flex-1 break-words">{error}</span>
							{onRetry && (
								<Button variant="outline" size="xs" className="-my-0.5 shrink-0" onClick={onRetry}>
									<RotateCw />
									重试
								</Button>
							)}
						</div>
					)}
					{args !== undefined && <Section label="参数" text={args} render={draw("args")} />}
					{result !== undefined && <Section label="结果" text={result} render={draw("result")} />}
					{onMore && (
						<Button variant="ghost" size="xs" className="self-start text-muted-foreground" onClick={onMore}>
							显示完整结果
						</Button>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

/** The tools a group used: the last three distinct icons, stacked, newest on top; red when the last call failed */
function ToolStack({ calls, className }: { calls: ToolCallItem[]; className?: string }) {
	const tiles = stack(calls.map((c) => ({ icon: c.icon ?? Wrench, status: c.status })));
	const names = [...new Set(calls.map((c) => c.name))].join("、");
	return (
		<span data-slot="tool-stack" role="img" aria-label={`用到的工具：${names}`} title={names} className={cn("flex shrink-0", className)}>
			{tiles.map(({ icon: I, failed }, i) => (
				<span key={i} className="flex size-5 items-center justify-center rounded-md border bg-card ring-2 ring-background not-first:-ml-1.5">
					<I className={cn("size-3", failed ? "text-destructive-strong" : "text-muted-foreground")} />
				</span>
			))}
		</span>
	);
}

type ToolCallGroupProps = {
	calls: ToolCallItem[];
	/** Total time once every call finished, in ms */
	ms?: number;
	/** Under the folded header; default – the running calls, so the current step stays in sight */
	exposed?: ReactNode;
	/** Buttons at the end of the header – fork */
	actions?: ReactNode;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** The open body; default – every call as a ToolCall */
	children?: ReactNode;
	className?: string;
};

/**
 * A run of calls under one header. Folded and finished, the last call is the title and the right side says how many and how long;
 * open, the title is the count. Running, the header counts and the running calls show below it
 */
function ToolCallGroup({ calls, ms, exposed, actions, open, defaultOpen, onOpenChange, children, className }: ToolCallGroupProps) {
	const { running, failed, last, done } = groupState(calls);
	const count = calls.length;
	const said = running.length ? `正在运行 ${running[0].name}` : count ? `已完成 ${count} 次工具调用${failed ? `，${failed} 次失败` : ""}` : "";
	return (
		<Collapsible data-slot="tool-call-group" open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} className={cn("group/tools", className)}>
			<span className="sr-only" role="status">
				{said}
			</span>
			<div className="flex items-center gap-1">
				<CollapsibleTrigger className={cn("group/chevron flex min-w-0 flex-1 items-center gap-2 py-1 text-left text-xs text-muted-foreground transition-colors hover:text-foreground", FOCUS)}>
					<Chevron className="size-3.5 text-current" />
					<ToolStack calls={calls} />
					{done && last ? (
						<>
							<span className="flex min-w-0 items-center gap-2 text-md group-data-[state=open]/tools:hidden">
								<span className="shrink-0 font-medium text-foreground">{last.name}</span>
								<span className="truncate font-mono text-xs">{last.summary}</span>
							</span>
							<span className="hidden shrink-0 group-data-[state=open]/tools:inline">{count} 次工具调用</span>
						</>
					) : (
						<span className="shrink-0">{count} 次工具调用</span>
					)}
					<span className="ml-auto flex shrink-0 items-center gap-3 pl-2 tabular-nums">
						{failed > 0 &&
							(count === 1 ? (
								<span className="text-destructive-strong">失败</span>
							) : (
								<span className="flex items-center gap-1 text-destructive-strong">
									<TriangleAlert className="size-3" aria-hidden />
									{failed}
								</span>
							))}
						{done && count > 1 && <span className="group-data-[state=open]/tools:hidden">{count} 次</span>}
						{done && ms !== undefined && ms >= 1000 && <span>{elapsed(ms)}</span>}
					</span>
				</CollapsibleTrigger>
				{actions}
			</div>
			<div className="group-data-[state=open]/tools:hidden">
				{exposed ?? running.map((c) => <ToolCallLine key={c.id} call={c} className="py-1 pl-5.5" />)}
			</div>
			<CollapsibleContent className={SLIDE}>
				<div className="mt-1 ml-1.5 flex flex-col gap-1 border-l pl-4">{children ?? calls.map((c) => <ToolCall key={c.id} call={c} />)}</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

export { ToolCall, ToolCallGroup, ToolCallLine, ToolStack };
