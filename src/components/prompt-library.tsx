// PromptLibrary: saved prompts with blanks. Pick one from the list, type into the sentence where it asks, and use it once every blank is filled.
// From 540px the list sits beside the template; narrower, one shows at a time, so a long list never pushes the template off a phone screen.
// Editing comes only with onSave and onDelete. Props in, callbacks out: the host keeps the templates and decides what 「使用」 does.
import { ArrowRight, Check, ChevronLeft, ChevronRight, Copy, Pencil, Plus, Search, Undo2 } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "./button.tsx";
import { Input } from "./input.tsx";
import { Placeholder } from "./placeholder.tsx";
import { Skeleton } from "./skeleton.tsx";
import { Spinner } from "./spinner.tsx";
import { Textarea } from "./textarea.tsx";
import { blanks, fill, groupsOf, matches, missing, nextEmpty, parts, type PromptTemplate, sections, tidy, valuesOf } from "../lib/prompt-library.ts";
import { Tray, TrayCard } from "./tray.tsx";
import { cn } from "../lib/utils.ts";

export type { PromptTemplate, PromptVariable } from "../lib/prompt-library.ts";

type PromptLibraryProps = {
	/** null – loading */
	templates: PromptTemplate[] | null;
	/** The chosen template, controlled */
	value?: string | null;
	/** The chosen template at first; the first one by default */
	defaultValue?: string;
	onSelect?: (id: string) => void;
	/** 「使用」 with every blank filled – the finished text */
	onUse?: (prompt: string, template: PromptTemplate, values: Record<string, string>) => void;
	onCopy?: (prompt: string) => void;
	/** Shows 新建 and 编辑; new and edited alike, tidied. A promise keeps the editor until it settles */
	onSave?: (template: PromptTemplate) => unknown;
	/** Shows 删除 in the editor; 撤销 calls onSave with the template */
	onDelete?: (id: string) => unknown;
	title?: string;
	useLabel?: string;
	emptyNote?: string;
	className?: string;
};

type Draft = PromptTemplate & { fresh?: boolean };

/** Below this the list and the template take turns */
const WIDE = 540;
/** Below this 「复制」 keeps only its icon */
const ROOMY = 400;
const UNDO_FOR = 5000;
const newId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** A blank inside the sentence. An invisible copy of the text sets the width and the field fills it – it grows as you type, up to the line */
function Blank({ name, description, value, onValue, onFocus, onBlur, onKeyDown, inputRef }: {
	name: string;
	description?: string;
	value: string;
	onValue: (v: string) => void;
	onFocus: () => void;
	onBlur: () => void;
	onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
	inputRef?: (el: HTMLInputElement | null) => void;
}) {
	const empty = !value.trim();
	const box = cn("border px-1.5 leading-6 pointer-coarse:leading-8", !empty && "font-medium");
	return (
		<span className="relative mx-0.5 inline-block max-w-full align-baseline">
			<span aria-hidden className={cn("invisible block min-w-8 whitespace-pre", box)}>
				{value || name}
			</span>
			<input
				ref={inputRef}
				value={value}
				placeholder={name}
				aria-label={description ? `${name}：${description}` : name}
				autoComplete="off"
				spellCheck={false}
				onChange={(e) => onValue(e.target.value)}
				onFocus={onFocus}
				onBlur={onBlur}
				onKeyDown={onKeyDown}
				className={cn(
					"absolute inset-0 w-full min-w-0 rounded-md text-sm outline-none transition-[background-color,border-color,box-shadow] duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none",
					box,
					empty ? "border-dashed border-foreground/25 bg-transparent placeholder:text-muted-foreground" : "border-transparent bg-muted text-foreground",
				)}
			/>
		</span>
	);
}

function Labeled({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
	return (
		<div className="grid min-w-0 gap-1">
			<label htmlFor={htmlFor} className="text-xs text-muted-foreground">
				{label}
			</label>
			{children}
			{hint && <span className="text-xs text-muted-foreground">{hint}</span>}
		</div>
	);
}

/** In place of the template: name, group, body, and a row per blank for its default and description */
function Editor({ draft, groups, saving, narrow, onSave, onCancel, onDelete }: {
	draft: Draft;
	groups: string[];
	saving: boolean;
	narrow: boolean;
	onSave: (d: Draft) => void;
	onCancel: () => void;
	onDelete?: (d: Draft) => void;
}) {
	const [d, setD] = useState(draft);
	const id = useId();
	const names = blanks(d.body);
	const ok = !!d.title.trim() && !!d.body.trim() && !saving;
	const setVar = (n: string, key: "default" | "description", v: string) => setD((x) => ({ ...x, variables: { ...x.variables, [n]: { ...x.variables?.[n], [key]: v } } }));
	const onKey = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			e.preventDefault();
			e.stopPropagation();
			onCancel();
		} else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			if (ok) onSave(d);
		}
	};
	return (
		<div data-escape="local" onKeyDown={onKey} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
			<div className={cn("grid gap-2", !narrow && "grid-cols-2")}>
				<Labeled label="名称" htmlFor={`${id}-title`}>
					<Input id={`${id}-title`} autoFocus value={d.title} placeholder="例 接手项目" onChange={(e) => setD({ ...d, title: e.target.value })} />
				</Labeled>
				<Labeled label="分组" htmlFor={`${id}-group`}>
					<Input id={`${id}-group`} list={`${id}-groups`} value={d.group ?? ""} placeholder="可不填" onChange={(e) => setD({ ...d, group: e.target.value })} />
					<datalist id={`${id}-groups`}>
						{groups.map((g) => (
							<option key={g} value={g} />
						))}
					</datalist>
				</Labeled>
			</div>
			<Labeled label="内容" htmlFor={`${id}-body`} hint="用 {名字} 留出每次要填的地方">
				<Textarea id={`${id}-body`} rows={4} className="max-h-60" value={d.body} placeholder="你接手 {项目}：{路径}。先读…" onChange={(e) => setD({ ...d, body: e.target.value })} />
			</Labeled>
			{names.length > 0 && (
				<div className="grid gap-1.5">
					{names.map((n) => (
						<div key={n} className={cn("grid items-center gap-x-2 gap-y-1", narrow ? "grid-cols-2" : "grid-cols-[5rem_1fr_1fr]")}>
							<span className={cn("truncate text-sm font-medium", narrow && "col-span-2")}>{n}</span>
							<Input aria-label={`${n} 的默认值`} placeholder="默认值" value={d.variables?.[n]?.default ?? ""} onChange={(e) => setVar(n, "default", e.target.value)} />
							<Input aria-label={`${n} 的说明`} placeholder="说明" value={d.variables?.[n]?.description ?? ""} onChange={(e) => setVar(n, "description", e.target.value)} />
						</div>
					))}
				</div>
			)}
			<div className="mt-auto flex items-center gap-2 pt-1">
				{onDelete && (
					<Button size="sm" variant="ghost" className="text-destructive-strong pointer-coarse:h-10" disabled={saving} onClick={() => onDelete(d)}>
						删除
					</Button>
				)}
				<span className="flex-1" />
				<Button size="sm" variant="outline" className="pointer-coarse:h-10" disabled={saving} onClick={onCancel}>
					取消
				</Button>
				<Button size="sm" className="pointer-coarse:h-10" disabled={!ok} onClick={() => onSave(d)}>
					{saving && <Spinner />}
					保存
				</Button>
			</div>
		</div>
	);
}

function PromptLibrary({ templates, value, defaultValue, onSelect, onUse, onCopy, onSave, onDelete, title = "提示词", useLabel = "使用", emptyNote = "把常发的话存成提示词，用 {名字} 留出每次要填的地方", className }: PromptLibraryProps) {
	const root = useRef<HTMLDivElement>(null);
	const search = useRef<HTMLInputElement>(null);
	const options = useRef<Record<string, HTMLButtonElement | null>>({});
	const fields = useRef<Record<string, HTMLInputElement | null>>({});
	/** Focus to move once the next render is on screen: an option, a blank, the search field */
	const want = useRef<string | null>(null);
	const was = useRef<{ id: string | null; ready: boolean }>({ id: null, ready: false });
	const [width, setWidth] = useState<number | null>(null);
	const [own, setOwn] = useState<string | null>(defaultValue ?? null);
	const [typed, setTyped] = useState<Record<string, Record<string, string>>>({});
	const [query, setQuery] = useState("");
	const [view, setView] = useState<"list" | "template">("list");
	const [draft, setDraft] = useState<Draft | null>(null);
	const [saving, setSaving] = useState(false);
	const [focused, setFocused] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [deleted, setDeleted] = useState<PromptTemplate | null>(null);
	const [said, setSaid] = useState("");
	const [pill, setPill] = useState<{ top: number; height: number } | null>(null);

	const list = templates ?? [];
	const narrow = width !== null && width < WIDE;
	const roomy = width === null || width >= ROOMY;
	const chosenId = value !== undefined ? value : own;
	const chosen = list.find((t) => t.id === chosenId) ?? list[0] ?? null;
	const shown = list.filter((t) => matches(t, query));
	const secs = sections(shown);
	const flat = secs.flatMap((s) => s.templates);
	const names = chosen ? blanks(chosen.body) : [];
	const values = chosen ? valuesOf(chosen, typed[chosen.id]) : {};
	const left = chosen ? missing(chosen, values) : [];
	const ready = !!chosen && !left.length;
	const prompt = chosen ? fill(chosen.body, values) : "";
	const showList = !narrow || view === "list";
	const showTemplate = !narrow || view === "template";
	/** The option in the tab order: the chosen one if it's in the list, else the first */
	const stop = flat.find((t) => t.id === chosen?.id)?.id ?? flat[0]?.id ?? null;

	// Width decides the layout, measured before the first paint so a phone never sees two columns
	useLayoutEffect(() => {
		const el = root.current;
		if (!el) return;
		setWidth(el.clientWidth);
		const ro = new ResizeObserver(() => setWidth(el.clientWidth));
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	// The pill sits under the chosen option; it glides when that changes
	useLayoutEffect(() => {
		const el = !narrow && chosen ? options.current[chosen.id] : null;
		const next = el ? { top: el.offsetTop, height: el.offsetHeight } : null;
		setPill((p) => (p?.top === next?.top && p?.height === next?.height ? p : next));
	});
	useLayoutEffect(() => {
		const w = want.current;
		if (!w) return;
		want.current = null;
		if (w === "search") search.current?.focus();
		else if (w.startsWith("option:")) {
			const el = options.current[w.slice(7)];
			el?.focus();
			el?.scrollIntoView({ block: "nearest" });
		} else if (w.startsWith("blank:")) fields.current[w.slice(6)]?.focus();
	});
	useEffect(() => {
		const id = chosen?.id ?? null;
		if (id === was.current.id && ready && !was.current.ready && names.length) setSaid("已填完");
		was.current = { id, ready };
	}, [chosen?.id, ready, names.length]);
	useEffect(() => {
		if (!copied) return;
		const t = setTimeout(() => setCopied(false), 1500);
		return () => clearTimeout(t);
	}, [copied]);
	useEffect(() => {
		if (!deleted) return;
		const t = setTimeout(() => setDeleted(null), UNDO_FOR);
		return () => clearTimeout(t);
	}, [deleted]);

	const pick = (t: PromptTemplate) => {
		if (value === undefined) setOwn(t.id);
		if (t.id !== chosen?.id) onSelect?.(t.id);
		setFocused(null);
	};
	const choose = (t: PromptTemplate, open: boolean) => {
		pick(t);
		setDraft(null);
		if (open) setView("template");
	};
	/** Into a template's first empty blank – its first blank when all are filled */
	const enter = (t: PromptTemplate) => {
		const ns = blanks(t.body);
		const first = nextEmpty(ns, valuesOf(t, typed[t.id]), null) ?? ns[0];
		if (!first) return;
		const el = t.id === chosen?.id && showTemplate && !draft ? fields.current[first] : null;
		if (el) el.focus();
		else want.current = `blank:${first}`;
	};
	const set = (name: string, v: string) => chosen && setTyped((all) => ({ ...all, [chosen.id]: { ...all[chosen.id], [name]: v } }));
	const use = () => {
		if (!chosen) return;
		if (left.length) {
			fields.current[left[0]!]?.focus();
			setSaid(`待填 ${left.length} 项`);
			return;
		}
		onUse?.(prompt, chosen, Object.fromEntries(names.map((n) => [n, values[n]?.trim() ?? ""])));
	};
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(prompt);
		} catch {
			setSaid("复制失败");
			return;
		}
		setCopied(true);
		setSaid("已复制");
		onCopy?.(prompt);
	};
	const back = () => {
		setView("list");
		if (chosen) want.current = `option:${chosen.id}`;
	};
	const create = () => {
		setDraft({ id: newId(), title: "", body: "", fresh: true });
		setDeleted(null);
		setView("template");
	};
	const save = async (d: Draft) => {
		const t = tidy(d);
		setSaving(true);
		try {
			await onSave?.(t);
			setDraft(null);
			pick(t);
			setView("template");
		} catch {
			// The host says what went wrong; the editor stays open
		}
		setSaving(false);
	};
	const remove = async (d: Draft) => {
		try {
			await onDelete?.(d.id);
		} catch {
			return;
		}
		const t = list.find((x) => x.id === d.id) ?? tidy(d);
		setDraft(null);
		setDeleted(t);
		setSaid(`已删除「${t.title}」`);
		setView("list");
	};
	const restore = async () => {
		if (!deleted) return;
		const t = deleted;
		setDeleted(null);
		try {
			await onSave?.(t);
			pick(t);
			setSaid(`已恢复「${t.title}」`);
		} catch {
			// The host says what went wrong
		}
	};
	const cancel = () => {
		const fresh = draft?.fresh;
		setDraft(null);
		if (fresh && narrow) back();
	};

	const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Escape" && query) {
			e.preventDefault();
			setQuery("");
			return;
		}
		if (e.key !== "ArrowDown" && (e.key !== "Enter" || e.nativeEvent.isComposing)) return;
		const t = flat.find((x) => x.id === chosen?.id) ?? flat[0];
		if (!t) return;
		e.preventDefault();
		if (e.key === "Enter") {
			choose(t, true);
			enter(t);
		} else {
			pick(t);
			options.current[t.id]?.focus();
		}
	};
	const onListKey = (e: KeyboardEvent<HTMLDivElement>) => {
		const at = flat.findIndex((t) => options.current[t.id] === e.target);
		if (at < 0) return;
		const t = flat[at]!;
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			choose(t, true);
			enter(t);
			return;
		}
		let to: number | null = null;
		if (e.key === "ArrowDown") to = Math.min(at + 1, flat.length - 1);
		else if (e.key === "ArrowUp") to = at - 1;
		else if (e.key === "Home") to = 0;
		else if (e.key === "End") to = flat.length - 1;
		if (to === null) return;
		e.preventDefault();
		if (to < 0) return search.current?.focus();
		const next = flat[to]!;
		pick(next);
		options.current[next.id]?.focus();
		options.current[next.id]?.scrollIntoView({ block: "nearest" });
	};
	const onBlankKey = (name: string) => (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
		e.preventDefault();
		const next = nextEmpty(names, values, name);
		if (next) fields.current[next]?.focus();
		else if (ready) use();
	};

	/** Only a blank's first appearance takes focus jumps */
	const firsts = new Set<number>();
	if (chosen) {
		const seen = new Set<string>();
		parts(chosen.body).forEach((p, i) => {
			if (p.name !== undefined && !seen.has(p.name)) {
				seen.add(p.name);
				firsts.add(i);
			}
		});
	}

	const listPane = (
		<div className={cn("flex min-h-0 flex-col gap-1 p-2", narrow ? "w-full" : "w-52 shrink-0 border-r")}>
			<div className="flex h-8 shrink-0 items-center gap-1.5 pl-1.5">
				<span className="text-sm font-medium">{title}</span>
				<span className="text-sm text-muted-foreground tabular-nums">{list.length}</span>
				{onSave && (
					<Button size="icon-sm" variant="ghost" className="ml-auto text-muted-foreground pointer-coarse:size-10" aria-label={`新建${title}`} title="新建" onClick={create}>
						<Plus />
					</Button>
				)}
			</div>
			<label className="flex h-8 shrink-0 items-center gap-2 rounded-md bg-muted px-2 text-muted-foreground focus-within:ring-[3px] focus-within:ring-ring/50 pointer-coarse:h-10">
				<Search className="size-3.5 shrink-0" aria-hidden />
				<input
					ref={search}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={onSearchKey}
					placeholder="搜索"
					aria-label={`搜索${title}`}
					data-escape={query ? "local" : undefined}
					autoComplete="off"
					spellCheck={false}
					className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
				/>
			</label>
			<div role="listbox" aria-label={title} onKeyDown={onListKey} className={cn("relative min-h-0 flex-1 pb-1", !narrow && "overflow-y-auto")}>
				{pill && (
					<span
						aria-hidden
						className="absolute inset-x-0 top-0 rounded-md bg-accent transition-[transform,height] duration-200 ease-out-strong motion-reduce:transition-none"
						style={{ transform: `translateY(${pill.top}px)`, height: pill.height }}
					/>
				)}
				{secs.map((s) => (
					<div key={s.group ?? ""} role="group" aria-label={s.group ?? undefined}>
						{s.group && (
							<div aria-hidden className="truncate px-2 pt-2 pb-0.5 text-2xs text-muted-foreground">
								{s.group}
							</div>
						)}
						{s.templates.map((t) => {
							const on = t.id === chosen?.id;
							return (
								<button
									key={t.id}
									ref={(el) => {
										options.current[t.id] = el;
									}}
									type="button"
									role="option"
									aria-selected={on}
									tabIndex={t.id === stop ? 0 : -1}
									onClick={() => choose(t, true)}
									className={cn(
										"relative flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-10",
										on && !narrow ? "font-medium" : "hover:bg-accent/60",
									)}
								>
									<span className="min-w-0 flex-1 truncate">{t.title}</span>
									{narrow && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
								</button>
							);
						})}
					</div>
				))}
				{!shown.length && <p className="px-2 py-3 text-xs text-muted-foreground">无匹配的{title}</p>}
			</div>
		</div>
	);

	const templatePane = (
		<div
			data-escape={narrow ? "local" : undefined}
			onKeyDown={(e) => {
				if (e.key === "Escape" && narrow && !draft) {
					e.preventDefault();
					back();
				}
			}}
			className="flex min-h-0 min-w-0 flex-1 flex-col"
		>
			{draft ? (
				<Editor key={draft.id} draft={draft} groups={groupsOf(list)} saving={saving} narrow={narrow} onSave={save} onCancel={cancel} onDelete={onDelete && !draft.fresh ? remove : undefined} />
			) : chosen ? (
				<>
					<div className="flex h-12 shrink-0 items-center gap-2 px-3">
						{narrow && (
							<Button size="icon-sm" variant="ghost" className="-ml-1.5 shrink-0 text-muted-foreground pointer-coarse:size-10" aria-label="返回列表" onClick={back}>
								<ChevronLeft />
							</Button>
						)}
						<span className="min-w-0 truncate text-sm font-medium">{chosen.title}</span>
						{chosen.group && <span className="shrink-0 text-xs text-muted-foreground">{chosen.group}</span>}
						{onSave && (
							<Button size="icon-sm" variant="ghost" className="ml-auto shrink-0 text-muted-foreground pointer-coarse:size-10" aria-label={`编辑「${chosen.title}」`} title="编辑" onClick={() => setDraft({ ...chosen })}>
								<Pencil />
							</Button>
						)}
					</div>
					<div key={chosen.id} className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 animate-in duration-150 fade-in motion-reduce:animate-none">
						<p className="text-sm leading-8 break-words whitespace-pre-wrap pointer-coarse:leading-10">
							{parts(chosen.body).map((p, i) =>
								p.name === undefined ? (
									<span key={i}>{p.text}</span>
								) : (
									<Blank
										key={i}
										name={p.name}
										description={chosen.variables?.[p.name]?.description}
										value={values[p.name] ?? ""}
										onValue={(v) => set(p.name, v)}
										onFocus={() => setFocused(p.name)}
										onBlur={() => setFocused(null)}
										onKeyDown={onBlankKey(p.name)}
										inputRef={
											firsts.has(i)
												? (el) => {
														fields.current[p.name] = el;
													}
												: undefined
										}
									/>
								),
							)}
						</p>
					</div>
				</>
			) : null}
		</div>
	);

	const tray = (deleted || (showTemplate && chosen && !draft)) && (
		<div className="flex h-11 shrink-0 items-center gap-1 pr-1 pl-3 pointer-coarse:h-13">
			<p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
				{deleted ? (
					`已删除「${deleted.title}」`
				) : focused ? (
					<>
						<span className="mr-2 font-medium text-foreground">{focused}</span>
						{chosen?.variables?.[focused]?.description}
					</>
				) : !names.length ? null : ready ? (
					"已填完"
				) : (
					`待填 ${left.length} 项`
				)}
			</p>
			{deleted ? (
				<Button size="sm" variant="ghost" className="pointer-coarse:h-10" onClick={restore}>
					<Undo2 />
					撤销
				</Button>
			) : (
				<>
					<Button size="sm" variant="ghost" className="text-muted-foreground pointer-coarse:h-10" aria-label={roomy ? undefined : copied ? "已复制" : "复制"} onClick={copy}>
						{copied ? <Check /> : <Copy />}
						{roomy && (copied ? "已复制" : "复制")}
					</Button>
					<Button size="sm" aria-disabled={!ready} className={cn("transition-opacity duration-150 motion-reduce:transition-none pointer-coarse:h-10", !ready && "opacity-50")} onClick={use}>
						{useLabel}
						<ArrowRight />
					</Button>
				</>
			)}
		</div>
	);

	let body: ReactNode;
	if (!templates)
		body = (
			<TrayCard aria-busy="true" className={cn("flex overflow-hidden", !narrow && "h-80")}>
				<div className={cn("flex flex-col gap-2.5 p-3", narrow ? "w-full" : "w-52 shrink-0 border-r")}>
					<Skeleton className="h-4 w-16" />
					<Skeleton className="mb-1 h-8 w-full" />
					{[70, 55, 80, 60].map((w) => (
						<Skeleton key={w} className="h-4" style={{ width: `${w}%` }} />
					))}
				</div>
				{!narrow && (
					<div className="flex flex-1 flex-col gap-3 p-4">
						<Skeleton className="mb-2 h-4 w-28" />
						{[95, 88, 60].map((w) => (
							<Skeleton key={w} className="h-4" style={{ width: `${w}%` }} />
						))}
					</div>
				)}
			</TrayCard>
		);
	else if (!list.length && !draft)
		body = (
			<>
				<TrayCard>
					<Placeholder title={`暂无${title}`} text={emptyNote} className="py-10">
						{onSave && (
							<Button size="sm" variant="outline" className="pointer-coarse:h-10" onClick={create}>
								<Plus />
								新建
							</Button>
						)}
					</Placeholder>
				</TrayCard>
				{tray}
			</>
		);
	else
		body = (
			<>
				<TrayCard className={cn("flex overflow-hidden", !narrow && (draft ? "min-h-80" : "h-80"))}>
					{showList && listPane}
					{showTemplate && templatePane}
				</TrayCard>
				{tray}
			</>
		);

	return (
		<Tray ref={root} role="group" aria-label={title} data-slot="prompt-library" className={className}>
			{body}
			<div role="status" aria-live="polite" className="sr-only">
				{said}
			</div>
		</Tray>
	);
}

export { PromptLibrary };
