// MemoryPanel: what an agent remembers – a master switch, group chips and a search, and on every memory edit in place, pause or forget with Undo on the tray.
// Groups are fixed and come from the host – an agent files its own memories, so the groups follow its fields, not a taxonomy someone keeps by hand.
// A row opens to its detail; the host draws it (markdown, say). Props in, callbacks out; the list shown is always the one passed in.
import { ChevronRight, Pause, Pencil, Play, Plus, Search, Trash2, Undo2, X } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Badge } from "./badge.tsx";
import { Button } from "./button.tsx";
import { Input } from "./input.tsx";
import { Skeleton } from "./skeleton.tsx";
import { Textarea } from "./textarea.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.tsx";
import { step } from "../lib/roving.ts";
import { counts, type MemoryGroup, type MemoryItem, short, trayLine, visible } from "../lib/memory-panel.ts";
import { cn } from "../lib/utils.ts";

export type { MemoryGroup, MemoryItem } from "../lib/memory-panel.ts";

type Draft = { text: string; detail: string; group: string };
type Props = {
	memories: MemoryItem[];
	groups: MemoryGroup[];
	enabled?: boolean;
	onEnabledChange?: (on: boolean) => void;
	/** Under the head while off */
	offNote?: string;
	onAdd?: (m: Draft) => void | Promise<unknown>;
	onEdit?: (id: string, change: Partial<Draft>) => void | Promise<unknown>;
	onPause?: (id: string, paused: boolean) => void | Promise<unknown>;
	onForget?: (id: string) => void | Promise<unknown>;
	onRestore?: (id: string) => void | Promise<unknown>;
	/** Draws a row's detail when it opens; plain text by default */
	renderDetail?: (m: MemoryItem) => ReactNode;
	/** Makes the source a link */
	onSource?: (m: MemoryItem) => void;
	title?: string;
	loading?: boolean;
	undoFor?: number;
	className?: string;
};

const LEAVE_MS = 200;

/** A small switch: a button with role="switch" – no extra primitive, so it works in a block */
function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (on: boolean) => void; label: string; disabled?: boolean }) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={on}
			disabled={disabled}
			onClick={() => onChange(!on)}
			className="group/switch flex items-center gap-2 rounded-md text-xs text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
		>
			<span className="max-[320px]:sr-only">{label}</span>
			<span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150", on ? "bg-primary" : "bg-input")}>
				<span className={cn("absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow-sm transition-transform duration-150 ease-out-strong motion-reduce:transition-none", on && "translate-x-4")} />
			</span>
		</button>
	);
}

/** An icon button named after its memory; the tooltip repeats the name for the eye */
function Act({ icon: I, label, onClick, danger }: { icon: typeof Pencil; label: string; onClick: () => void; danger?: boolean }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant="ghost" size="icon-xs" aria-label={label} aria-describedby={undefined} onClick={onClick} className={cn("text-muted-foreground pointer-coarse:size-8", danger && "hover:text-destructive-strong")}>
					<I />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label.split("「")[0]}</TooltipContent>
		</Tooltip>
	);
}

/** Group chips: a radiogroup, arrows move, one tab stop */
function Chips({ groups, value, onChange, count, label }: { groups: { id: string; label: string }[]; value: string; onChange: (id: string) => void; count?: Record<string, number>; label: string }) {
	const ref = useRef<HTMLDivElement>(null);
	const key = (e: KeyboardEvent<HTMLDivElement>) => {
		const i = groups.findIndex((g) => g.id === value);
		const n = step(e.key === "ArrowDown" ? "ArrowRight" : e.key === "ArrowUp" ? "ArrowLeft" : e.key, i, groups.length);
		if (n === null) return;
		e.preventDefault();
		const g = groups[n];
		if (!g) return;
		onChange(g.id);
		ref.current?.querySelectorAll<HTMLElement>("[role=radio]")[n]?.focus();
	};
	return (
		<div ref={ref} role="radiogroup" aria-label={label} onKeyDown={key} className="no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-16px),transparent)] pr-4">
			{groups.map((g) => (
				<button
					key={g.id}
					type="button"
					role="radio"
					aria-checked={g.id === value}
					tabIndex={g.id === value ? 0 : -1}
					onClick={() => onChange(g.id)}
					className={cn(
						"flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-9",
						g.id === value ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
						count && !count[g.id] && g.id !== value && "opacity-60",
					)}
				>
					{g.label}
					{count && <span className="text-muted-foreground tabular-nums max-[340px]:hidden">{count[g.id] ?? 0}</span>}
				</button>
			))}
		</div>
	);
}

/** The editor: text, an optional detail, the group; Enter saves, Shift+Enter breaks the line, Esc cancels */
function Editor({ draft, groups, onSave, onCancel, withDetail, placeholder }: { draft: Draft; groups: MemoryGroup[]; onSave: (d: Draft) => void; onCancel: () => void; withDetail: boolean; placeholder: string }) {
	const [d, setD] = useState(draft);
	const key = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			e.preventDefault();
			e.stopPropagation();
			onCancel();
		} else if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.target instanceof HTMLTextAreaElement && e.target.dataset.main) {
			e.preventDefault();
			if (d.text.trim()) onSave(d);
		}
	};
	return (
		<div className="flex flex-col gap-2 rounded-lg bg-muted/60 p-2" onKeyDown={key}>
			<Textarea data-main autoFocus value={d.text} placeholder={placeholder} onChange={(e) => setD({ ...d, text: e.target.value })} className="min-h-9 resize-none bg-background text-sm" rows={1} />
			{withDetail && <Textarea value={d.detail} placeholder="正文（可选）" onChange={(e) => setD({ ...d, detail: e.target.value })} className="min-h-16 resize-y bg-background font-mono text-xs" />}
			<Chips groups={groups} value={d.group} onChange={(group) => setD({ ...d, group })} label="分组" />
			<div className="flex justify-end gap-1">
				<Button size="xs" variant="ghost" onClick={onCancel}>取消</Button>
				<Button size="xs" disabled={!d.text.trim()} onClick={() => onSave(d)}>保存</Button>
			</div>
		</div>
	);
}

/** One memory: the text, its source and date, a 「已暂停」 tag; actions on hover and focus, always on touch; opens to its detail */
function Row({ m, editing, leaving, groups, onEditStart, onEditEnd, props }: { m: MemoryItem; editing: boolean; leaving: boolean; groups: MemoryGroup[]; onEditStart: () => void; onEditEnd: () => void; props: Props }) {
	const [open, setOpen] = useState(false);
	const { onEdit, onPause, onForget, onSource, renderDetail } = props;
	if (editing)
		return (
			<Editor
				draft={{ text: m.text, detail: m.detail ?? "", group: m.group }}
				groups={groups}
				withDetail={m.detail !== undefined}
				placeholder="Claude 应该记住的事…"
				onCancel={onEditEnd}
				onSave={(d) => {
					const change: Partial<Draft> = {};
					if (d.text.trim() !== m.text) change.text = d.text.trim();
					if (d.group !== m.group) change.group = d.group;
					if (m.detail !== undefined && d.detail !== m.detail) change.detail = d.detail;
					if (Object.keys(change).length) void onEdit?.(m.id, change);
					onEditEnd();
				}}
			/>
		);
	const name = short(m.text, 24);
	return (
		<div
			className={cn(
				"group/row grid transition-[grid-template-rows,opacity,filter] duration-200 ease-out-strong motion-reduce:transition-none",
				leaving ? "grid-rows-[0fr] opacity-0 blur-[2px]" : "grid-rows-[1fr]",
			)}
			inert={leaving}
		>
			<div className="min-h-0 overflow-hidden">
				<div className="flex flex-col gap-0.5 rounded-lg px-2 py-1.5 hover:bg-muted/60 focus-within:bg-muted/60">
					<button
						type="button"
						disabled={!m.detail}
						aria-expanded={m.detail ? open : undefined}
						onClick={() => setOpen(!open)}
						className={cn("flex items-start gap-1 text-left text-sm outline-none focus-visible:underline enabled:cursor-pointer", m.paused && "text-muted-foreground")}
					>
						<span className="min-w-0 flex-1 wrap-anywhere">{m.text}</span>
						{m.detail && <ChevronRight className={cn("mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none", open && "rotate-90")} aria-hidden />}
					</button>
					<div className="flex min-h-6 items-center gap-3 text-xs text-muted-foreground">
						{m.source && (onSource ? (
							<button type="button" onClick={() => onSource(m)} className="min-w-0 truncate rounded outline-none hover:text-foreground hover:underline focus-visible:underline">{m.source}</button>
						) : (
							<span className="min-w-0 truncate">{m.source}</span>
						))}
						{m.date && <span className="shrink-0 tabular-nums">{m.date}</span>}
						{m.paused && <Badge variant="secondary" className="h-4 px-1.5 text-2xs">已暂停</Badge>}
						<span className="ml-auto flex shrink-0 opacity-0 transition-opacity duration-150 group-hover/row:opacity-100 group-focus-within/row:opacity-100 pointer-coarse:opacity-100">
							{onEdit && <Act icon={Pencil} label={`编辑「${name}」`} onClick={onEditStart} />}
							{onPause && <Act icon={m.paused ? Play : Pause} label={m.paused ? `恢复「${name}」` : `暂停「${name}」`} onClick={() => void onPause(m.id, !m.paused)} />}
							{onForget && <Act icon={Trash2} label={`忘掉「${name}」`} danger onClick={() => void onForget(m.id)} />}
						</span>
					</div>
					{open && m.detail && <div className="mt-1 border-l pl-3 text-xs text-muted-foreground">{renderDetail ? renderDetail(m) : <p className="whitespace-pre-wrap wrap-anywhere">{m.detail}</p>}</div>}
				</div>
			</div>
		</div>
	);
}

function MemoryPanel(props: Props) {
	const { memories, groups, enabled = true, onEnabledChange, offNote = "关闭后不会使用或保存 memory，已有的不会删除", onAdd, onForget, onRestore, title = "Memory", loading, undoFor = 5000, className } = props;
	const [group, setGroup] = useState("all");
	const [query, setQuery] = useState("");
	const [searching, setSearching] = useState(false);
	const [editing, setEditing] = useState<string | null>(null);
	const [adding, setAdding] = useState(false);
	const [leaving, setLeaving] = useState<string[]>([]);
	const [forgot, setForgot] = useState<MemoryItem | null>(null);
	const c = counts(memories);
	const shown = visible(memories, group, query);
	const chips = [{ id: "all", label: "全部" }, ...groups];
	// Undo stays on the tray for undoFor
	useEffect(() => {
		if (!forgot) return;
		const t = setTimeout(() => setForgot(null), undoFor);
		return () => clearTimeout(t);
	}, [forgot, undoFor]);
	const forget = (id: string) => {
		const m = memories.find((x) => x.id === id);
		if (!m || !onForget) return;
		const go = () => {
			setLeaving((l) => l.filter((x) => x !== id));
			setForgot(m);
			void onForget(id);
		};
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) return go();
		setLeaving((l) => [...l, id]);
		setTimeout(go, LEAVE_MS);
	};
	const sections = group === "all" ? groups.map((g) => ({ g, items: shown.filter((m) => m.group === g.id) })).filter((s) => s.items.length) : [{ g: null, items: shown }];
	const tray = editing || adding ? "Enter 保存，Shift + Enter 换行，Esc 取消" : trayLine(memories);
	const row = (m: MemoryItem) => (
		<Row key={m.id} m={m} editing={editing === m.id} leaving={leaving.includes(m.id)} groups={groups} onEditStart={() => { setAdding(false); setEditing(m.id); }} onEditEnd={() => setEditing(null)} props={{ ...props, onForget: onForget && forget }} />
	);
	return (
		<section role="group" aria-label={title} className={cn("flex flex-col overflow-hidden rounded-xl border bg-muted/40", className)}>
			<div className="flex flex-col rounded-b-xl border-b bg-background">
				<div className="flex items-center gap-2 px-3 pt-3 pb-2">
					<span className="text-sm font-medium">{title}</span>
					<Badge variant="secondary" className="tabular-nums">{c.all}</Badge>
					{onEnabledChange && <span className="ml-auto"><Switch on={enabled} onChange={onEnabledChange} label="使用 memory" /></span>}
				</div>
				{!enabled && <p className="mx-3 mb-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground" role="note">{offNote}</p>}
				<div className={cn("flex items-center gap-1 border-b px-2 pb-2", !enabled && "opacity-60")}>
					{searching ? (
						<div className="flex flex-1 items-center gap-1">
							<Search className="ml-1 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
							<Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setQuery(""); setSearching(false); } }} placeholder="搜索 memory…" aria-label="搜索 memory" className="h-7 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent" />
							<Button size="icon-xs" variant="ghost" aria-label="关闭搜索" onClick={() => { setQuery(""); setSearching(false); }}><X /></Button>
						</div>
					) : (
						<>
							<Chips groups={chips} value={group} onChange={setGroup} count={c} label="按分组看" />
							<Button size="icon-xs" variant="ghost" className="shrink-0 text-muted-foreground" aria-label="搜索 memory" onClick={() => setSearching(true)}><Search /></Button>
						</>
					)}
				</div>
				<div className={cn("flex flex-col px-1 py-1", !enabled && "opacity-60")}>
					{loading ? (
						<div className="flex flex-col gap-3 p-2" aria-busy="true">
							{[0, 1, 2].map((i) => <div key={i} className="flex flex-col gap-1.5"><Skeleton className="h-3.5 w-4/5" /><Skeleton className="h-3 w-2/5" /></div>)}
						</div>
					) : !memories.length ? (
						<div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
							<span className="text-sm">暂无 memory</span>
							<span className="text-xs text-muted-foreground">Claude 记下的偏好、反馈和项目情况会出现在这里</span>
						</div>
					) : !shown.length ? (
						<div className="px-4 py-6 text-center text-xs text-muted-foreground">暂无匹配「{query || chips.find((x) => x.id === group)?.label}」的 memory</div>
					) : (
						sections.map(({ g, items }) => (
							<section key={g?.id ?? "one"} aria-label={g?.label} className="flex flex-col">
								{g && <h3 className="px-2 pt-2 pb-0.5 text-xs text-muted-foreground" title={g.hint}>{g.label}</h3>}
								{items.map(row)}
							</section>
						))
					)}
					{onAdd && !loading && (
						<div className="px-1 pt-1 pb-1">
							{adding ? (
								<Editor
									draft={{ text: "", detail: "", group: group !== "all" ? group : (groups[0]?.id ?? "") }}
									groups={groups}
									withDetail={false}
									placeholder="Claude 应该记住的事…"
									onCancel={() => setAdding(false)}
									onSave={(d) => { void onAdd({ ...d, text: d.text.trim() }); setAdding(false); }}
								/>
							) : (
								<Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => { setEditing(null); setAdding(true); }}>
									<Plus />
									新建 memory
								</Button>
							)}
						</div>
					)}
				</div>
			</div>
			<div className="flex min-h-10 items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground" role="status" aria-live="polite">
				{forgot ? (
					<>
						<span className="min-w-0 flex-1 truncate">已忘掉「{short(forgot.text)}」</span>
						{onRestore && (
							<Button size="xs" variant="outline" className="shrink-0" onClick={() => { void onRestore(forgot.id); setForgot(null); }}>
								<Undo2 />
								撤销
							</Button>
						)}
					</>
				) : (
					<span className="tabular-nums">{tray}</span>
				)}
			</div>
		</section>
	);
}

export { MemoryPanel };
