// ComposerSettings: everything about how the next message runs, behind one chip in a Composer's control row – 「Opus 高」, and 「询问」 when that's not the default.
// The chip opens a panel of sections: a list (the model, each with a line on what it's for; rarer choices folded under 「更多」) or a segmented row
// (thinking effort, permission – with a line under it on what the pick does). One place instead of three icons nobody can read.
// ↑ ↓ on the chip open it. A popover beside the chip on desktop, a sheet on phones.
import { Check, ChevronDown, ChevronRight, type LucideIcon, SlidersHorizontal } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useRef, useState } from "react";
import { Badge } from "./badge.tsx";
import { Button } from "./button.tsx";
import { Popsheet } from "./popsheet.tsx";
import { SegmentedControl } from "./segmented-control.tsx";
import { cn } from "../lib/utils.ts";

export type SettingsOption = { value: string; label: string; description?: string; icon?: LucideIcon; badge?: string };
export type SettingsSection =
	| { id: string; label: string; kind: "list"; value: string; onChange: (v: string) => void; options: SettingsOption[]; more?: { label: string; options: SettingsOption[] } }
	| { id: string; label: string; kind: "segmented"; value: string; onChange: (v: string) => void; options: SettingsOption[] };

type ComposerSettingsProps = {
	sections: SettingsSection[];
	/** On the chip: the picks that matter, the less important ones muted – 「Opus <muted>高</muted>」 */
	summary: ReactNode;
	/** Names the chip and the panel */
	label?: string;
	onOpenChange?: (open: boolean) => void;
	className?: string;
};

function ComposerSettings({ sections, summary, label = "运行设置", onOpenChange, className }: ComposerSettingsProps) {
	const [open, setOpen] = useState(false);
	const change = (o: boolean) => {
		setOpen(o);
		onOpenChange?.(o);
	};
	const key = (e: KeyboardEvent) => {
		if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
		e.preventDefault();
		change(true);
	};
	return (
		<Popsheet
			bare
			title={label}
			side="top"
			align="start"
			open={open}
			onOpenChange={change}
			className="w-80"
			trigger={
				<Button variant="ghost" size="xs" onKeyDown={key} aria-label={label} aria-haspopup="dialog" aria-keyshortcuts="ArrowUp ArrowDown" className={cn("min-w-0 gap-1 px-1.5 text-muted-foreground", className)}>
					<SlidersHorizontal className="shrink-0" />
					<span className="min-w-0 truncate">{summary}</span>
					<ChevronDown className="shrink-0 opacity-60" />
				</Button>
			}
		>
			<div className="flex flex-col gap-4 p-3 pointer-coarse:pb-1">
				{sections.map((s) => (
					<section key={s.id} aria-label={s.label} className="flex flex-col gap-1.5">
						<span className="px-1 text-2xs text-muted-foreground">{s.label}</span>
						{s.kind === "list" ? <List s={s} /> : <Segmented s={s} />}
					</section>
				))}
			</div>
		</Popsheet>
	);
}

/** Options one per line, a radiogroup: ↑ ↓ move and pick. The rarer ones fold under 「更多」, open by itself when one of them is picked */
function List({ s }: { s: Extract<SettingsSection, { kind: "list" }> }) {
	const inMore = !!s.more?.options.some((o) => o.value === s.value);
	const [more, setMore] = useState(inMore);
	const box = useRef<HTMLDivElement>(null);
	const all = [...s.options, ...(more ? (s.more?.options ?? []) : [])];
	const key = (e: KeyboardEvent) => {
		const i = all.findIndex((o) => o.value === s.value);
		const n = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : null;
		if (n === null) return;
		e.preventDefault();
		const o = all[Math.max(0, Math.min(all.length - 1, n))];
		if (!o) return;
		s.onChange(o.value);
		requestAnimationFrame(() => box.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(o.value)}"]`)?.focus());
	};
	// The one tab stop: the pick, or the first line when the pick is folded away
	const stop = all.some((o) => o.value === s.value) ? s.value : all[0]?.value;
	const row = (o: SettingsOption, small: boolean) => {
		const on = o.value === s.value;
		const I = o.icon;
		return (
			<button
				key={o.value}
				type="button"
				role="radio"
				aria-checked={on}
				tabIndex={o.value === stop ? 0 : -1}
				data-value={o.value}
				onClick={() => s.onChange(o.value)}
				className={cn("flex items-center gap-2.5 rounded-md px-2 text-left outline-none transition-colors hover:bg-accent focus-visible:bg-accent", small ? "py-1.5 pointer-coarse:py-2.5" : "py-2", on && "bg-accent")}
			>
				{I && <I className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
				<span className="flex min-w-0 flex-1 flex-col gap-0.5">
					<span className={cn("flex items-center gap-1.5", small ? "text-md" : "text-md font-medium")}>
						{o.label}
						{o.badge && <Badge variant="secondary">{o.badge}</Badge>}
					</span>
					{o.description && !small && <span className="text-xs leading-snug text-muted-foreground">{o.description}</span>}
				</span>
				{on && <Check className="size-4 shrink-0" aria-hidden />}
			</button>
		);
	};
	return (
		<div ref={box} role="radiogroup" aria-label={s.label} onKeyDown={key} className="-mx-1 flex flex-col gap-0.5">
			{s.options.map((o) => row(o, false))}
			{s.more && s.more.options.length > 0 && (
				<>
					<button type="button" aria-expanded={more} onClick={() => setMore((m) => !m)} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:bg-accent">
						<ChevronRight className={cn("size-3 transition-transform motion-reduce:transition-none", more && "rotate-90")} aria-hidden />
						{s.more.label}
					</button>
					{more && <div className="flex flex-col gap-0.5 pl-3 animate-in fade-in-0 duration-150">{s.more.options.map((o) => row(o, true))}</div>}
				</>
			)}
		</div>
	);
}

/** A row of choices; the pick's description sits under it */
function Segmented({ s }: { s: Extract<SettingsSection, { kind: "segmented" }> }) {
	const cur = s.options.find((o) => o.value === s.value);
	return (
		<>
			<SegmentedControl fullWidth aria-label={s.label} value={s.value} onChange={s.onChange} options={s.options.map((o) => ({ value: o.value, label: o.label, icon: o.icon, title: o.description }))} />
			{cur?.description && <span className="px-1 text-xs text-muted-foreground">{cur.description}</span>}
		</>
	);
}

export { ComposerSettings };
