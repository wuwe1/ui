// 展示页：主题的每个 token（theme.tsx），每个组件的每种状态（stories.tsx 登记），能切深浅色、手机 / 平板 / 不限宽。
// 完成度靠它看得见：改一个组件时在这里把它的每种状态过一遍；截图检查也照这一页，地址带参数直接打开一种：
//   ?p=页（主题 / 组件名）&s=状态（不写是全部）&mode=dark&w=390（手机）| 768 | 0（不限宽）&bare=1（不要顶上那排选项）
import "./styles.css";
import { type ReactNode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "../src/components/toast.tsx";
import { ToggleGroup, ToggleGroupItem } from "../src/components/toggle-group.tsx";
import { TooltipProvider } from "../src/components/tooltip.tsx";
import { applyMode } from "../src/theme/index.ts";
import { STORIES } from "./stories.tsx";
import { ThemePage } from "./theme.tsx";

const THEME_PAGE = "主题";
const WIDTHS = [["390", "手机"], ["768", "平板"], ["0", "不限宽"]] as const;

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
	const pages = [THEME_PAGE, ...Object.keys(STORIES)];
	const [p, setP] = useParam("p", THEME_PAGE);
	const [s, setS] = useParam("s", "");
	const [mode, setMode] = useParam("mode", matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
	const [w, setW] = useParam("w", "390");
	const bare = new URLSearchParams(location.search).has("bare");
	useEffect(() => applyMode(mode === "dark" ? "dark" : "light"), [mode]);
	const stories = STORIES[p] ?? [];
	const shown = s ? stories.filter((x) => x.name === s) : stories;
	return (
		<div className="flex min-h-svh flex-col bg-sidebar">
			<header hidden={bare} className="sticky top-0 z-10 flex flex-col gap-2 border-b bg-sidebar px-4 py-2">
				<div className="flex flex-wrap items-center gap-2">
					<span className="mr-2 text-lg font-semibold tracking-tight">@wuwe1/ui</span>
					<Pick value={p} onChange={(v) => { setP(v); setS(""); }} options={pages.map((n) => [n, n] as const)} />
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{p !== THEME_PAGE && <Pick value={s || "*"} onChange={(v) => setS(v === "*" ? "" : v)} options={[["*", "全部状态"], ...stories.map((x) => [x.name, x.name] as const)]} />}
					<span className="ml-auto" />
					<Pick value={mode} onChange={setMode} options={[["light", "浅色"], ["dark", "深色"]]} />
					{p !== THEME_PAGE && <Pick value={w} onChange={setW} options={WIDTHS} />}
				</div>
			</header>
			{p === THEME_PAGE ? (
				<ThemePage />
			) : (
				<main className="flex flex-col items-center gap-8 px-4 py-6">
					{shown.map((x) => (
						<Frame key={x.name} name={x.name} width={Number(w)}>
							{x.render()}
						</Frame>
					))}
				</main>
			)}
		</div>
	);
}

function Pick({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: readonly (readonly [string, string])[] }) {
	return (
		<ToggleGroup type="single" variant="outline" size="sm" value={value} onValueChange={(v) => v && onChange(v)} className="flex-wrap">
			{options.map(([v, label]) => <ToggleGroupItem key={v} value={v}>{label}</ToggleGroupItem>)}
		</ToggleGroup>
	);
}

/** 一种状态：上面写它叫什么，下面是和主内容板一样的底（background），宽度照选的 */
function Frame({ name, width, children }: { name: string; width: number; children: ReactNode }) {
	return (
		<section data-story={name} className="flex w-full flex-col gap-2" style={width ? { maxWidth: width } : undefined}>
			<h2 className="px-1 text-2xs text-muted-foreground">{name}</h2>
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
