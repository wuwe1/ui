// The spec beside the stories: docs/components/<file>.md for the page you're on – When to use, States, API reference and the rest.
// Section chips jump; a section title copies 「MessageActions › API reference」 so a request can point at it; in States, a story's name shows that state alone.
// Wide screens get a column on the right; narrower ones a sheet. Base components copied from shadcn/ui as shipped have no spec.
import { BookOpen } from "lucide-react";
import { Fragment, type ReactNode, useEffect, useState } from "react";
import { Button } from "../src/components/button.tsx";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../src/components/sheet.tsx";
import { toast } from "../src/components/toast.tsx";
import { cn } from "../src/lib/utils.ts";

const SPECS = import.meta.glob("../docs/components/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
/** Pages whose spec file isn't their kebab-case name */
const FILE: Record<string, string> = { ToolCallGroup: "tool-call" };
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
export const specOf = (page: string): string | null => SPECS[`../docs/components/${FILE[page] ?? kebab(page)}.md`] ?? null;

type Section = { title: string; lines: string[] };
/** The spec split at its ## headings; what comes before the first is the lead */
function sections(md: string): { title: string; lead: string[]; sections: Section[] } {
	const lines = md.split("\n");
	let title = "";
	const lead: string[] = [];
	const out: Section[] = [];
	for (const l of lines) {
		if (l.startsWith("# ")) title = l.slice(2).trim();
		else if (l.startsWith("## ")) out.push({ title: l.slice(3).trim(), lines: [] });
		else (out.at(-1)?.lines ?? lead).push(l);
	}
	return { title, lead, sections: out };
}

const anchor = (page: string, title: string) => `doc-${page}-${title.replace(/\W+/g, "-")}`;

/** Inline markdown the specs use: `code`; in States, story names become buttons */
function Inline({ text, states, onState }: { text: string; states?: string[]; onState?: (s: string) => void }) {
	const parts = text.split(/(`[^`]+`)/);
	return (
		<>
			{parts.map((p, i) =>
				p.startsWith("`") && p.endsWith("`") && p.length > 1 ? (
					<code key={i} className="rounded bg-muted px-1 py-px font-mono text-[0.92em]">{p.slice(1, -1)}</code>
				) : (
					<Fragment key={i}>{states?.length && onState ? <Names text={p} states={states} onState={onState} /> : p}</Fragment>
				),
			)}
		</>
	);
}

/** Story names inside a line, as buttons that show that state alone */
function Names({ text, states, onState }: { text: string; states: string[]; onState: (s: string) => void }) {
	const names = [...states].sort((a, b) => b.length - a.length).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
	const re = new RegExp(`(^|[\\s:,])(${names.join("|")})(?=$|[\\s,–:.])`, "g");
	const out: ReactNode[] = [];
	let at = 0;
	for (const m of text.matchAll(re)) {
		const start = (m.index ?? 0) + (m[1]?.length ?? 0);
		out.push(text.slice(at, start));
		const name = m[2] ?? "";
		out.push(
			<button key={start} type="button" onClick={() => onState(name)} className="rounded px-0.5 font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground" title={`只看「${name}」`}>
				{name}
			</button>,
		);
		at = start + name.length;
	}
	out.push(text.slice(at));
	return <>{out}</>;
}

const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, "|").trim());

/** A section's lines: bullets, tables, paragraphs */
function Body({ lines, states, onState }: { lines: string[]; states?: string[]; onState?: (s: string) => void }) {
	const blocks: ReactNode[] = [];
	let i = 0;
	while (i < lines.length) {
		const l = lines[i] ?? "";
		if (l.trim().startsWith("|")) {
			const rows: string[] = [];
			while (i < lines.length && (lines[i] ?? "").trim().startsWith("|")) rows.push(lines[i++] ?? "");
			const [head, , ...rest] = rows;
			blocks.push(
				<div key={i} className="-mx-1 overflow-x-auto">
					<table className="w-full border-collapse text-xs">
						<thead>
							<tr>{cells(head ?? "").map((c, j) => <th key={j} className="border-b px-1 py-1.5 text-left font-medium whitespace-nowrap text-muted-foreground">{c}</th>)}</tr>
						</thead>
						<tbody>
							{rest.map((r, k) => (
								<tr key={k} className="border-b align-top last:border-0">
									{cells(r).map((c, j) => <td key={j} className={cn("px-1 py-1.5", j === 0 && "whitespace-nowrap")}><Inline text={c} /></td>)}
								</tr>
							))}
						</tbody>
					</table>
				</div>,
			);
			continue;
		}
		if (l.startsWith("- ")) {
			const items: string[] = [];
			while (i < lines.length && (lines[i] ?? "").startsWith("- ")) items.push((lines[i++] ?? "").slice(2));
			blocks.push(
				<ul key={i} className="flex list-disc flex-col gap-1 pl-4 marker:text-muted-foreground">
					{items.map((t, k) => <li key={k}><Inline text={t} states={states} onState={onState} /></li>)}
				</ul>,
			);
			continue;
		}
		if (l.trim()) blocks.push(<p key={i}><Inline text={l} states={states} onState={onState} /></p>);
		i++;
	}
	return <div className="flex flex-col gap-2">{blocks}</div>;
}

/** The spec of one page: title, lead, section chips, then every section */
function Spec({ page, states, onState, inSheet }: { page: string; states: string[]; onState: (s: string) => void; inSheet?: boolean }) {
	const md = specOf(page);
	if (!md) return <p className="p-4 text-xs text-muted-foreground">No spec – {page} is shadcn/ui as shipped, or a page of examples.</p>;
	const doc = sections(md);
	// Scroll only the panel – scrollIntoView would move the whole page and hide its header
	const jump = (title: string) => {
		const el = document.getElementById(anchor(page, title));
		const box = el?.closest<HTMLElement>("[data-docs-scroll]");
		const head = box?.querySelector<HTMLElement>("[data-docs-head]");
		if (!el || !box) return;
		box.scrollTo({ top: box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - (head?.offsetHeight ?? 0) - 8, behavior: "smooth" });
	};
	const copy = (title: string) => {
		const ref = `${page} › ${title}`;
		navigator.clipboard.writeText(ref).then(() => toast.success("已复制", { description: ref }), () => toast.error("复制失败"));
	};
	return (
		<div className="flex flex-col">
			<div data-docs-head className={cn("sticky top-0 z-10 flex flex-col gap-2 border-b bg-background px-4 pt-3 pb-2", inSheet && "pr-12")}>
				<div className="flex items-baseline gap-2">
					<span className="text-sm font-medium">{doc.title}</span>
					<span className="truncate font-mono text-2xs text-muted-foreground">docs/components/{FILE[page] ?? kebab(page)}.md</span>
				</div>
				<div className="-mx-1 flex flex-wrap gap-1">
					{doc.sections.map((s) => (
						<Button key={s.title} size="xs" variant="ghost" className="h-6 px-1.5 text-2xs text-muted-foreground" onClick={() => jump(s.title)}>
							{s.title}
						</Button>
					))}
				</div>
			</div>
			<div className="flex flex-col gap-5 px-4 py-4 text-xs leading-relaxed">
				<Body lines={doc.lead} />
				{doc.sections.map((s) => (
					<section key={s.title} id={anchor(page, s.title)} className="flex flex-col gap-2">
						<h3>
							<button type="button" onClick={() => copy(s.title)} className="text-sm font-medium hover:underline" title={`复制「${page} › ${s.title}」`}>
								{s.title}
							</button>
						</h3>
						<Body lines={s.lines} states={s.title === "States" ? states : undefined} onState={onState} />
					</section>
				))}
			</div>
		</div>
	);
}

const WIDE = "(min-width: 1024px)";
const KEY = "showcase:docs";

/** Wide: the column, open by default and remembered on this device. Narrow: a sheet, closed until asked for */
export function useDocs() {
	const [open, setOpen] = useState(() => localStorage.getItem(KEY) !== "closed");
	const [sheet, setSheet] = useState(false);
	const [wide, setWide] = useState(() => matchMedia(WIDE).matches);
	useEffect(() => {
		const m = matchMedia(WIDE);
		const f = () => setWide(m.matches);
		m.addEventListener("change", f);
		return () => m.removeEventListener("change", f);
	}, []);
	const keep = (o: boolean) => {
		localStorage.setItem(KEY, o ? "open" : "closed");
		setOpen(o);
	};
	return wide ? { open, wide, setOpen: keep } : { open: sheet, wide, setOpen: setSheet };
}

/** The header button */
export function DocsToggle({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
	return (
		<Button size="sm" variant={open ? "secondary" : "outline"} onClick={() => onOpenChange(!open)} aria-pressed={open}>
			<BookOpen />
			Docs
		</Button>
	);
}

/** The column on wide screens, a sheet on narrow ones */
export function Docs({ page, states, onState, open, wide, onOpenChange }: { page: string; states: string[]; onState: (s: string) => void; open: boolean; wide: boolean; onOpenChange: (o: boolean) => void }) {
	if (wide) return open ? <aside data-docs-scroll className="w-96 shrink-0 overflow-y-auto border-l" aria-label="Spec">{<Spec page={page} states={states} onState={onState} />}</aside> : null;
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent data-docs-scroll side="right" className="w-[min(26rem,92vw)] gap-0 overflow-y-auto p-0 sm:max-w-none">
				<SheetHeader className="sr-only">
					<SheetTitle>Spec</SheetTitle>
				</SheetHeader>
				<Spec inSheet page={page} states={states} onState={(s) => { onState(s); onOpenChange(false); }} />
			</SheetContent>
		</Sheet>
	);
}
