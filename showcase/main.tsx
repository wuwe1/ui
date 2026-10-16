// Showcase: the theme, and every state of every component. A sidebar lists the pages; on phones it's a drawer. The spec of the page sits on the right (docs.tsx).
// An Outline of the states runs down the stories' right edge; each state's name has 「只看这个」, which shows it alone.
// Open one state for a screenshot: ?p=<component>&s=<state>&mode=dark&w=390&bare=1
import "./styles.css";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Outline, useInView } from "../src/components/outline.tsx";
import { createRoot } from "react-dom/client";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "../src/components/sidebar.tsx";
import { Toaster } from "../src/components/toast.tsx";
import { ToggleGroup, ToggleGroupItem } from "../src/components/toggle-group.tsx";
import { TooltipProvider } from "../src/components/tooltip.tsx";
import { cn } from "../src/lib/utils.ts";
import { applyMode } from "../src/theme/index.ts";
import { Docs, DocsToggle, useDocs } from "./docs.tsx";
import { NAV, STORIES } from "./stories.tsx";
import { ThemePage } from "./theme.tsx";

const THEME_PAGE = "Theme";
const WIDTHS = [["390", "Phone"], ["768", "Tablet"], ["0", "Full"]] as const;
// Every page appears once: the ones NAV forgot go under Other
const listed = new Set(NAV.flatMap((g) => g.pages));
const GROUPS = [...NAV, { label: "Other", pages: Object.keys(STORIES).filter((p) => !listed.has(p)) }].filter((g) => g.pages.length);

function useParam(key: string, fallback: string) {
	const [v, setV] = useState(() => new URLSearchParams(location.search).get(key) ?? fallback);
	const set = (next: string) => {
		const q = new URLSearchParams(location.search);
		q.set(key, next);
		history.replaceState(null, "", `?${q}`);
		setV(next);
	};
	return [v, set] as const;
}

function Showcase() {
	const [p, setP] = useParam("p", THEME_PAGE);
	const [s, setS] = useParam("s", "");
	const [mode, setMode] = useParam("mode", matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
	const [w, setW] = useParam("w", "390");
	const bare = new URLSearchParams(location.search).has("bare");
	useEffect(() => applyMode(mode === "dark" ? "dark" : "light"), [mode]);
	const stories = STORIES[p] ?? [];
	const shown = s ? stories.filter((x) => x.name === s) : stories;
	const docs = useDocs();
	const scroller = useRef<HTMLDivElement>(null);
	const targets = () => [...(scroller.current?.querySelectorAll<HTMLElement>("[data-story]") ?? [])];
	const { view, long } = useInView(scroller, targets, [p, s, w]);
	// Scroll only the stories: scrollIntoView would move the whole page
	const jump = (i: number) => {
		const el = targets()[i];
		const box = scroller.current;
		if (el && box) box.scrollTo({ top: box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 16, behavior: "smooth" });
	};
	const page = (
		<div className="relative flex min-h-0 min-w-0 flex-1">
			<div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
				{p === THEME_PAGE ? (
					<ThemePage />
				) : (
					<main className="flex flex-col items-center gap-8 px-4 py-6 pr-8">
						{shown.map((x) => (
							<Frame key={x.name} name={x.name} width={Number(w)} alone={!!s} many={stories.length > 1} onAlone={(a) => setS(a ? x.name : "")}>
								{x.render()}
							</Frame>
						))}
					</main>
				)}
			</div>
			{!bare && p !== THEME_PAGE && shown.length > 1 && long && (
				<Outline items={shown.map((x) => ({ id: x.name, label: x.name }))} view={view} onJump={jump} title="States" description={`${shown.length} states`} scroller={scroller} numbered={false} className="absolute top-2 right-0 bottom-2" />
			)}
		</div>
	);
	if (bare) return <div className="flex min-h-svh flex-col bg-background">{page}</div>;
	return (
		<SidebarProvider className="h-svh">
			<Nav page={p} onPick={(v) => { setP(v); setS(""); }} />
			<SidebarInset className="min-w-0 overflow-hidden">
				<header className="flex shrink-0 flex-col border-b px-3 py-2">
					<div className="flex min-h-8 items-center gap-2">
						<SidebarTrigger className="-ml-1" />
						<span className="truncate text-sm font-medium">{p}</span>
						<span className="ml-auto" />
						<Pick value={mode} onChange={setMode} options={[["light", "Light"], ["dark", "Dark"]]} />
						{p !== THEME_PAGE && <Pick value={w} onChange={setW} options={WIDTHS} className="hidden sm:flex" />}
						{p !== THEME_PAGE && <DocsToggle open={docs.open} onOpenChange={docs.setOpen} />}
					</div>
				</header>
				<div className="flex min-h-0 flex-1">
					{page}
					{p !== THEME_PAGE && <Docs page={p} states={stories.map((x) => x.name)} onState={setS} open={docs.open} wide={docs.wide} onOpenChange={docs.setOpen} />}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

/** The pages, by group, with how many states each has. Picking one on a phone closes the drawer */
function Nav({ page, onPick }: { page: string; onPick: (p: string) => void }) {
	const { setOpenMobile } = useSidebar();
	return (
		<Sidebar variant="inset">
			<SidebarHeader>
				<span className="px-2 pt-1 text-lg font-semibold tracking-tight">@wuwe1/ui</span>
			</SidebarHeader>
			<SidebarContent>
				{GROUPS.map((g) => (
					<SidebarGroup key={g.label}>
						<SidebarGroupLabel>{g.label}</SidebarGroupLabel>
						<SidebarMenu>
							{g.pages.map((name) => (
								<SidebarMenuItem key={name}>
									<SidebarMenuButton
										isActive={name === page}
										onClick={() => {
											onPick(name);
											setOpenMobile(false);
										}}
									>
										<span className="min-w-0 flex-1 truncate">{name}</span>
										{STORIES[name] && <span className="shrink-0 text-2xs text-muted-foreground tabular-nums">{STORIES[name].length}</span>}
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroup>
				))}
			</SidebarContent>
		</Sidebar>
	);
}

function Pick({ value, onChange, options, className }: { value: string; onChange: (v: string) => void; options: readonly (readonly [string, string])[]; className?: string }) {
	return (
		<ToggleGroup type="single" variant="outline" size="sm" value={value} onValueChange={(v) => v && onChange(v)} className={cn("flex-wrap", className)}>
			{options.map(([v, label]) => <ToggleGroupItem key={v} value={v}>{label}</ToggleGroupItem>)}
		</ToggleGroup>
	);
}

/** One state: its name and 「只看这个」 (or 「看全部」 when it's alone), then a frame on the content surface (background) at the picked width */
function Frame({ name, width, alone, many, onAlone, children }: { name: string; width: number; alone: boolean; many: boolean; onAlone: (alone: boolean) => void; children: ReactNode }) {
	return (
		<section data-story={name} className="flex w-full flex-col gap-2" style={width ? { maxWidth: width } : undefined}>
			<h2 className="flex items-baseline gap-2 px-1 text-2xs text-muted-foreground">
				{name}
				{(many || alone) && (
					<button type="button" onClick={() => onAlone(!alone)} className="ml-auto rounded-sm text-muted-foreground/70 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
						{alone ? "看全部" : "只看这个"}
					</button>
				)}
			</h2>
			<div data-frame className="flex min-h-24 flex-col overflow-hidden rounded-xl border bg-background p-4">{children}</div>
		</section>
	);
}

createRoot(document.getElementById("root") as HTMLElement).render(
	<TooltipProvider>
		<Showcase />
		<Toaster />
	</TooltipProvider>,
);
