// MessageActions: the row under a message – a few quiet icon buttons, and facts that stay in sight. TurnStats: what an agent's turn did –
// how long, how many tool calls, which files it changed, which subagents it started, which model – so you can tell what happened without reading every step.
// Actions hide until the message is hovered or focused: dozens of messages each with a lit row is noise. Facts never hide – they are why you look.
// The caller lays out the row and wraps what hides in MessageActionsQuiet: facts flush left, buttons after. One Tab stop per row, arrows inside.
import { Bot, Check, Clock, Copy, Ellipsis, FileDiff, type LucideIcon, Wrench } from "lucide-react";
import { type ComponentProps, type FocusEvent, type KeyboardEvent, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Button } from "./button.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu.tsx";
import { Popsheet } from "./popsheet.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.tsx";
import { step } from "../lib/roving.ts";
import { elapsed } from "../lib/time.ts";
import { lineTotals, splitPath, type TurnAgent, type TurnFile } from "../lib/turn-stats.ts";
import { cn } from "../lib/utils.ts";

export type { TurnAgent, TurnFile } from "../lib/turn-stats.ts";

/** Buttons the toolbar moves between: shown ones only – a hidden quiet part on touch is skipped */
const buttons = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>("button:not(:disabled)")].filter((b) => getComputedStyle(b).visibility !== "hidden");

/**
 * The row: a toolbar, one Tab stop, arrows inside. Lay out its parts in the order they should read; wrap the ones that hide in MessageActionsQuiet.
 * align – "end" under your own message, right-aligned like its bubble
 */
function MessageActions({ align = "start", label = "消息操作", className, children }: { align?: "start" | "end"; label?: string; className?: string; children?: ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);
	// Roving tab stop: the last focused button keeps it, the first one starts with it
	useLayoutEffect(() => {
		const root = ref.current;
		if (!root) return;
		const all = [...root.querySelectorAll<HTMLElement>("button")];
		const current = all.find((b) => b.tabIndex === 0 && b.dataset.rove) ?? all[0];
		for (const b of all) {
			b.tabIndex = b === current ? 0 : -1;
			b.dataset.rove = "";
		}
	});
	const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		const root = ref.current;
		if (!root || !(e.target instanceof HTMLElement) || e.target.tagName !== "BUTTON") return;
		const all = buttons(root);
		const i = step(e.key, all.indexOf(e.target), all.length);
		const next = i === null ? undefined : all[i];
		if (!next) return;
		e.preventDefault();
		for (const b of all) b.tabIndex = -1;
		next.tabIndex = 0;
		next.focus();
	};
	const onFocus = (e: FocusEvent<HTMLDivElement>) => {
		const root = ref.current;
		if (!root || !(e.target instanceof HTMLElement) || e.target.tagName !== "BUTTON") return;
		for (const b of root.querySelectorAll<HTMLElement>("button")) b.tabIndex = b === e.target ? 0 : -1;
	};
	return (
		<div
			ref={ref}
			role="toolbar"
			aria-label={label}
			onKeyDown={onKeyDown}
			onFocus={onFocus}
			data-slot="message-actions"
			className={cn("flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-muted-foreground", align === "end" && "justify-end", className)}
		>
			{children}
		</div>
	);
}

/** The part that shows while the message (the nearest [data-message]) is hovered or focused. quiet={false} keeps it lit – the last reply */
function MessageActionsQuiet({ quiet = true, className, children }: { quiet?: boolean; className?: string; children: ReactNode }) {
	return (
		<span data-quiet={quiet || undefined} className={cn("flex items-center", className)}>
			{children}
		</span>
	);
}

/** Phones: an icon button grows to 32px and its hit area to 44px */
const HIT = "relative pointer-coarse:size-8 pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 pointer-coarse:after:content-['']";
/** Phones: a text button keeps its size; its hit area grows to 44px tall */
const HIT_TEXT = "relative pointer-coarse:after:absolute pointer-coarse:after:-inset-x-1 pointer-coarse:after:-inset-y-3.5 pointer-coarse:after:content-['']";

/** An icon button with its name in a tooltip. The tooltip repeats the name – screen readers hear it once, from aria-label */
function MessageAction({ icon: I, label, className, ...props }: Omit<ComponentProps<typeof Button>, "children"> & { icon: LucideIcon; label: string }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant="ghost" size="icon-xs" className={cn(HIT, "text-muted-foreground", className)} aria-label={label} {...props} aria-describedby={undefined}>
					<I className="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}

/** Copy: the icon blurs into a check for 1.5s and the tooltip says 「已复制」 – on touch too. A failure says 「复制失败」 the same way */
function CopyAction({ text, label = "复制" }: { text: string; label?: string }) {
	const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
	const settle = (s: "copied" | "failed") => {
		setState(s);
		setTimeout(() => setState("idle"), 1500);
	};
	const copy = () => {
		try {
			navigator.clipboard.writeText(text).then(() => settle("copied"), () => settle("failed"));
		} catch {
			settle("failed");
		}
	};
	const said = state === "copied" ? "已复制" : state === "failed" ? "复制失败" : "";
	const swap = "absolute inset-0 size-3.5 motion-safe:transition-[opacity,scale,filter] motion-safe:duration-150 motion-safe:ease-out-strong";
	return (
		<>
			<Tooltip open={said ? true : undefined}>
				<TooltipTrigger asChild>
					<Button variant="ghost" size="icon-xs" className={cn(HIT, "text-muted-foreground")} aria-label={label} onClick={copy} aria-describedby={undefined}>
						<span className="relative size-3.5" aria-hidden>
							<Copy className={cn(swap, state === "copied" && "scale-50 opacity-0 blur-[2px]")} />
							<Check className={cn(swap, state === "copied" ? "scale-100 opacity-100 blur-0" : "scale-50 opacity-0 blur-[2px]")} />
						</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent>{said || label}</TooltipContent>
			</Tooltip>
			<span role="status" className="sr-only">{said}</span>
		</>
	);
}

/** 「更多」: actions used too rarely for their own button. No items – no button */
function MessageMenu({ items, label = "更多" }: { items: { icon: LucideIcon; label: string; onSelect: () => void }[]; label?: string }) {
	if (!items.length) return null;
	return (
		<DropdownMenu>
			<Tooltip>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon-xs" className={cn(HIT, "text-muted-foreground")} aria-label={label} aria-describedby={undefined}>
							<Ellipsis className="size-3.5" />
						</Button>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent>{label}</TooltipContent>
			</Tooltip>
			<DropdownMenuContent align="start">
				{items.map(({ icon: I, label, onSelect }) => (
					<DropdownMenuItem key={label} onSelect={onSelect}>
						<I />
						{label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** One fact: icon, words; sr-only names it for screen readers, a tooltip for the eye */
function Stat({ icon: I, name, children }: { icon: LucideIcon; name: string; children: ReactNode }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="flex items-center gap-1">
					<I className="size-3 shrink-0" aria-hidden />
					<span className="sr-only">{name}</span>
					{children}
				</span>
			</TooltipTrigger>
			<TooltipContent aria-hidden>{name}</TooltipContent>
		</Tooltip>
	);
}

/** A fact that opens a list: files, subagents. Picking a row closes it. No icon – the words name it, as in Run's header */
function StatList({ icon: I, name, title, children, rows }: { icon?: LucideIcon; name: string; title: string; children: ReactNode; rows: (close: () => void) => ReactNode }) {
	const [open, setOpen] = useState(false);
	return (
		<Popsheet
			open={open}
			onOpenChange={setOpen}
			title={title}
			align="start"
			className="w-80 max-h-80"
			trigger={
				<button type="button" className={cn("-mx-1 flex items-center gap-1 rounded-md px-1 py-0.5 outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50", HIT_TEXT)}>
					{I && <I className="size-3 shrink-0" aria-hidden />}
					<span className="sr-only">{name}</span>
					<span className="flex items-center gap-1 whitespace-nowrap">{children}</span>
				</button>
			}
		>
			<ul className="-mx-1 flex flex-col pt-1">{rows(() => setOpen(false))}</ul>
		</Popsheet>
	);
}

const ROW = "flex w-full min-w-0 items-center gap-2 rounded-md px-1 py-1.5 text-left text-xs pointer-coarse:min-h-11";

/** A turn's changed files as list rows: name, folder in gray, lines added and removed; onFile opens one and closes the list */
function TurnFileRows({ files, onFile, close }: { files: TurnFile[]; onFile?: (path: string) => void; close: () => void }) {
	return files.map((f) => {
		const { name, dir } = splitPath(f.path);
		const body = (
			<>
				<span className="shrink-0 font-medium">{name}</span>
				<span className="min-w-0 flex-1 truncate text-muted-foreground">{dir}</span>
				<Lines added={f.added} removed={f.removed} />
			</>
		);
		return (
			<li key={f.path}>
				{onFile ? (
					<button type="button" className={cn(ROW, "hover:bg-accent")} onClick={() => { close(); onFile(f.path); }}>
						{body}
					</button>
				) : (
					<span className={ROW}>{body}</span>
				)}
			</li>
		);
	});
}

/** A turn's subagents as list rows; onAgent opens one and closes the list */
function TurnAgentRows({ agents, onAgent, close }: { agents: TurnAgent[]; onAgent?: (id: string) => void; close: () => void }) {
	return agents.map((a) => {
		const body = (
			<>
				<Bot className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
				<span className="min-w-0 truncate">{a.label}</span>
			</>
		);
		return (
			<li key={a.id}>
				{onAgent ? (
					<button type="button" className={cn(ROW, "hover:bg-accent")} onClick={() => { close(); onAgent(a.id); }}>
						{body}
					</button>
				) : (
					<span className={ROW}>{body}</span>
				)}
			</li>
		);
	});
}

/**
 * ms – how long the turn took. tools, failed – calls made and how many failed. files – changed files with their lines; onFile opens one.
 * agents – subagents started; onAgent opens one. model – shown as given. Zero or missing – that fact is left out
 */
function TurnStats({ ms, tools = 0, failed = 0, files = [], onFile, agents = [], onAgent, model, className }: {
	ms?: number;
	tools?: number;
	failed?: number;
	files?: TurnFile[];
	onFile?: (path: string) => void;
	agents?: TurnAgent[];
	onAgent?: (id: string) => void;
	model?: string;
	className?: string;
}) {
	const lines = lineTotals(files);
	return (
		<span data-slot="turn-stats" className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-foreground tabular-nums", className)}>
			{ms !== undefined && (
				<Stat icon={Clock} name="这一轮用时">
					{elapsed(ms)}
				</Stat>
			)}
			{tools > 0 && (
				<Stat icon={Wrench} name="工具调用">
					{tools} 次{failed > 0 && <span className="text-destructive-strong">{failed} 次失败</span>}
				</Stat>
			)}
			{files.length > 0 && (
				<StatList
					icon={FileDiff}
					name="改动"
					title="这一轮改动的文件"
					rows={(close) => <TurnFileRows files={files} onFile={onFile} close={close} />}
				>
					{files.length} 个文件
					<Lines added={lines.added} removed={lines.removed} />
				</StatList>
			)}
			{agents.length > 0 && (
				<StatList
					icon={Bot}
					name="子代理"
					title="这一轮的子代理"
					rows={(close) => <TurnAgentRows agents={agents} onAgent={onAgent} close={close} />}
				>
					{agents.length} 个子代理
				</StatList>
			)}
			{model && <span>{model}</span>}
		</span>
	);
}

/** +48 −12; a zero side is left out */
function Lines({ added, removed }: { added: number; removed: number }) {
	return (
		<span className="flex shrink-0 gap-1 tabular-nums">
			{added > 0 && <span className="text-added-strong">+{added}</span>}
			{removed > 0 && <span className="text-removed-strong">−{removed}</span>}
		</span>
	);
}

export { CopyAction, MessageAction, MessageActions, MessageActionsQuiet, MessageMenu, StatList, TurnAgentRows, TurnFileRows, TurnStats };
