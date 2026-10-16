// Inbox: an agent's runs that want a look, in one place – three sections down the page (待处理, 运行中, 已完成), empty ones left out.
// A row opens in place to its last few steps and whatever the host hangs there (approval cards), with 「打开会话」 at the end;
// a run that starts waiting opens itself. When a row's status moves it to another section, it glides there.
// Takes rows, not services: the host feeds the steps, lazily when a row opens (onToggle).
import { ChevronDown, ChevronRight, Inbox as InboxIcon } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "./button.tsx";
import { Placeholder } from "./placeholder.tsx";
import { Skeleton } from "./skeleton.tsx";
import { StatusIcon } from "./status-icon.tsx";
import { changed, type InboxStatus, sectionOf, sections } from "../lib/inbox.ts";
import { cn } from "../lib/utils.ts";

export type { InboxStatus } from "../lib/inbox.ts";

/** One step of a run: what it did, when; error – it failed */
export type InboxStep = { label: ReactNode; time?: ReactNode; error?: boolean };

export type InboxItem = {
	id: string;
	status: InboxStatus;
	title: string;
	/** Where it runs – a folder; the second line starts with it */
	place?: ReactNode;
	/** The rest of the second line: what it's doing, its background task, how long ago */
	detail?: ReactNode;
	/** The status in words – on the right, or only for screen readers when aside takes its place */
	label: string;
	/** On the right instead of label: a ticking clock (aria-hidden itself) */
	aside?: ReactNode;
	/** For sorting, ms: oldest first in 待处理, newest first elsewhere */
	at: number;
	/** The last few steps, oldest first, shown when the row is open; null – still loading */
	steps?: InboxStep[] | null;
	/** More in the open row after the steps – the run's approval cards */
	children?: ReactNode;
};

type InboxProps = {
	/** null – loading */
	items: InboxItem[] | null;
	/** Shows 「打开会话」 in an open row */
	onOpen?: (item: InboxItem) => void;
	openLabel?: string;
	/** A row opened or closed – load its steps */
	onToggle?: (item: InboxItem, open: boolean) => void;
	/** Rows open at first, besides the waiting ones */
	defaultOpen?: string[];
	/** What shows with no rows */
	empty?: ReactNode;
	className?: string;
};

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function Inbox({ items, onOpen, openLabel = "打开会话", onToggle, defaultOpen = [], empty, className }: InboxProps) {
	const uid = useId();
	// Open rows: waiting ones start open
	const [open, setOpen] = useState(() => new Set([...defaultOpen, ...(items ?? []).filter((x) => x.status === "waiting").map((x) => x.id)]));
	const [said, setSaid] = useState("");
	const statuses = useRef<Map<string, InboxStatus> | null>(null);
	const rows = useRef(new Map<string, HTMLLIElement>());
	const tops = useRef(new Map<string, { top: number; section: string }>());
	const box = useRef<HTMLDivElement>(null);

	// A status changed: say it once; a run that starts waiting opens. The first rows that arrive are taken as they are
	useEffect(() => {
		if (!items) return;
		if (statuses.current) {
			const moved = changed(statuses.current, items);
			if (moved.length) {
				const by = new Map(items.map((x) => [x.id, x]));
				setSaid(moved.map((m) => `${by.get(m.id)?.title}：${by.get(m.id)?.label}`).join("；"));
				const waiting = moved.filter((m) => m.status === "waiting");
				if (waiting.length) setOpen((o) => new Set([...o, ...waiting.map((m) => m.id)]));
			}
		} else setOpen((o) => new Set([...o, ...items.filter((x) => x.status === "waiting").map((x) => x.id)]));
		statuses.current = new Map(items.map((x) => [x.id, x.status]));
	}, [items]);

	// A row that changed section glides from where it was (FLIP); one that's new fades in
	useLayoutEffect(() => {
		const base = box.current?.getBoundingClientRect().top ?? 0;
		const next = new Map<string, { top: number; section: string }>();
		for (const it of items ?? []) {
			const el = rows.current.get(it.id);
			if (!el) continue;
			const now = { top: el.getBoundingClientRect().top - base, section: sectionOf(it.status) };
			const was = tops.current.get(it.id);
			if (was && was.section !== now.section && !reduced()) el.animate([{ transform: `translateY(${was.top - now.top}px)` }, { transform: "none" }], { duration: 300, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
			next.set(it.id, now);
		}
		tops.current = next;
	});

	if (!items) return <Loading className={className} />;
	const list = sections(items);
	const toggle = (it: InboxItem) => {
		const on = !open.has(it.id);
		setOpen((o) => {
			const n = new Set(o);
			if (on) n.add(it.id);
			else n.delete(it.id);
			return n;
		});
		onToggle?.(it, on);
	};
	return (
		<div ref={box} className={cn("flex flex-col gap-6", className)} data-slot="inbox">
			<span role="status" className="sr-only">{said}</span>
			{!list.length && empty}
			{list.map((s) => (
				<section key={s.id} aria-labelledby={`${uid}-${s.id}`} className="flex flex-col gap-1">
					<h2 id={`${uid}-${s.id}`} className="px-2 text-2xs text-muted-foreground">
						{s.title} <span className="tabular-nums">{s.items.length}</span>
					</h2>
					<ul className="flex flex-col">
						{s.items.map((it) => (
							<Row
								key={it.id}
								it={it}
								id={`${uid}-r-${it.id}`}
								open={open.has(it.id)}
								fresh={!!statuses.current && !statuses.current.has(it.id)}
								onToggle={() => toggle(it)}
								onOpen={onOpen && (() => onOpen(it))}
								openLabel={openLabel}
								ref={(el) => {
									if (el) rows.current.set(it.id, el);
									else rows.current.delete(it.id);
								}}
							/>
						))}
					</ul>
				</section>
			))}
		</div>
	);
}

type RowProps = { it: InboxItem; id: string; open: boolean; fresh: boolean; onToggle: () => void; onOpen?: () => void; openLabel: string; ref: (el: HTMLLIElement | null) => void };

function Row({ it, id, open, fresh, onToggle, onOpen, openLabel, ref }: RowProps) {
	const head = useRef<HTMLButtonElement>(null);
	// Esc in the open row closes it and puts focus back on the row
	const esc = (e: KeyboardEvent) => {
		if (e.key !== "Escape" || e.defaultPrevented) return;
		e.preventDefault();
		onToggle();
		head.current?.focus();
	};
	return (
		<li ref={ref} data-status={it.status} className={cn("flex flex-col", fresh && "animate-in fade-in-0 duration-150 motion-reduce:animate-none")}>
			<button
				ref={head}
				type="button"
				aria-expanded={open}
				aria-controls={open ? id : undefined}
				onClick={onToggle}
				className="group flex min-h-11 w-full items-start gap-2 rounded-lg px-2 py-2 text-left outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 md:min-h-0 md:py-1.5"
			>
				<StatusIcon s={it.status} label={null} className="mt-0.5" />
				<span className="flex min-w-0 flex-1 flex-col">
					<span className="truncate text-md font-medium">
						{it.title}
						<span className="sr-only">，{it.label}</span>
					</span>
					{(it.place || it.detail) && (
						<span className="truncate text-xs text-muted-foreground">
							{it.place}
							{it.place && it.detail ? " › " : null}
							{it.detail}
						</span>
					)}
				</span>
				<span className="shrink-0 pt-0.5 text-2xs text-muted-foreground tabular-nums" aria-hidden>
					{it.aside ?? it.label}
				</span>
				<ChevronDown aria-hidden className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")} />
			</button>
			{open && (
				<div id={id} role="group" aria-label={it.title} onKeyDown={esc} className="flex flex-col gap-2 pr-2 pb-2 pl-8 animate-in fade-in-0 slide-in-from-top-1 duration-200 ease-out-strong motion-reduce:slide-in-from-top-0">
					<Steps steps={it.steps} />
					{it.children}
					{onOpen && (
						<Button variant="ghost" size="sm" className="-ml-2.5 h-11 w-fit gap-1 text-muted-foreground hover:text-foreground md:h-7" onClick={onOpen}>
							{openLabel}
							<ChevronRight />
						</Button>
					)}
				</div>
			)}
		</li>
	);
}

/** The last few steps as a small timeline: the latest in full color */
function Steps({ steps }: { steps?: InboxStep[] | null }) {
	if (steps === undefined || (steps && !steps.length)) return null;
	if (steps === null)
		return (
			<div className="flex flex-col gap-1.5 border-l py-0.5 pl-3" aria-busy="true">
				<Skeleton className="h-3 w-3/5" />
				<Skeleton className="h-3 w-2/5" />
			</div>
		);
	return (
		<ol className="flex flex-col gap-1 border-l pl-3">
			{steps.map((s, i) => (
				<li key={i} className={cn("flex min-w-0 gap-3 text-xs", s.error ? "text-destructive-strong" : i === steps.length - 1 ? "text-foreground" : "text-muted-foreground")}>
					<span className="min-w-0 flex-1 truncate">{s.label}</span>
					{s.time && <span className="shrink-0 text-muted-foreground tabular-nums">{s.time}</span>}
				</li>
			))}
		</ol>
	);
}

/** Loading: three rows of outline, as tall as real ones */
function Loading({ className }: { className?: string }) {
	return (
		<div className={cn("flex flex-col gap-1", className)} aria-busy="true">
			<Skeleton className="mx-2 h-3 w-12" />
			{[0, 1, 2].map((i) => (
				<div key={i} className="flex items-start gap-2 px-2 py-2">
					<span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
						<Skeleton className="size-2 rounded-full" />
					</span>
					<div className="flex flex-1 flex-col gap-1.5">
						<Skeleton className="h-3.5 w-2/5" />
						<Skeleton className="h-3 w-3/5" />
					</div>
				</div>
			))}
		</div>
	);
}

/** The usual empty state: says what shows up here; children – a button such as 「新会话」 */
function InboxEmpty({ text = "待确认、出错、运行中、跑完没看的会出现在这里", children }: { text?: string; children?: ReactNode }) {
	return (
		<Placeholder icon={InboxIcon} title="Inbox 为空" text={text}>
			{children}
		</Placeholder>
	);
}

export { Inbox, InboxEmpty };
