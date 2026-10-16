// 主题页：拖旋钮现场改主题（深浅两种并排看一小块真实的界面），每个 token 的用途、两种模式下的样子，字的对比度够不够。
// 调满意了点「复制」，把那段贴回 src/theme/themes.ts，再 pnpm gen。docs/theme.md
import { Check, Copy, RotateCcw, X } from "lucide-react";
import { type CSSProperties, type ReactNode, useMemo, useState } from "react";
import { Badge } from "../src/components/badge.tsx";
import { Button } from "../src/components/button.tsx";
import { StatusIcon } from "../src/components/status-icon.tsx";
import { toast } from "../src/components/toast.tsx";
import { ToggleGroup, ToggleGroupItem } from "../src/components/toggle-group.tsx";
import { cn } from "../src/lib/utils.ts";
import { contrast, flatten, type Mode, type Role, roles, SIGNALS, THEMES, type ThemeInput, type Tint, variables } from "../src/theme/index.ts";

const MODES: Mode[] = ["light", "dark"];
const MODE_NAME: Record<Mode, string> = { light: "浅色", dark: "深色" };

/** token 分组：照名字认 */
function groupOf(name: string): string {
	if (name.startsWith("series")) return "系列色";
	if ((SIGNALS as readonly string[]).some((s) => name === s || name.startsWith(`${s}-`))) return "有固定意思的颜色";
	if (name.endsWith("foreground")) return "字";
	if (["secondary", "muted", "accent", "sidebar-accent"].includes(name)) return "半透明的层";
	if (["border", "input", "sidebar-border", "ring", "sidebar-ring"].includes(name)) return "边和焦点";
	return "面";
}
const GROUPS = ["面", "字", "半透明的层", "边和焦点", "有固定意思的颜色"];

export function ThemePage() {
	const [from, setFrom] = useState(THEMES[0].name);
	const start = THEMES.find((t) => t.name === from) ?? THEMES[0];
	const [theme, setTheme] = useState<ThemeInput>(start);
	const vars = useMemo(() => variables(theme) as CSSProperties, [theme]);
	const list = useMemo(() => roles(theme), [theme]);
	const reset = (name: string) => {
		setFrom(name);
		setTheme(THEMES.find((t) => t.name === name) ?? THEMES[0]);
	};
	const tint = (mode: Mode, k: keyof Tint, v: number) => setTheme((t) => ({ ...t, name: "custom", note: "自定义", neutral: { ...t.neutral, [mode]: { ...t.neutral[mode], [k]: v } } }));
	const copy = () => {
		const snippet = `neutral: ${JSON.stringify(theme.neutral)},\nradius: ${theme.radius},`;
		navigator.clipboard?.writeText(snippet).then(() => toast("已复制，贴进 src/theme/themes.ts"), () => toast.error("复制失败"));
	};

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6">
			<section className="flex flex-col gap-4 rounded-xl border bg-background p-4">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-sm font-medium">旋钮</span>
					<span className="text-xs text-muted-foreground">改主题只改这些，别的都推出来</span>
					<span className="ml-auto" />
					<ToggleGroup type="single" variant="outline" size="sm" value={from} onValueChange={(v) => v && reset(v)}>
						{THEMES.map((t) => <ToggleGroupItem key={t.name} value={t.name}>从 {t.name} 开始</ToggleGroupItem>)}
					</ToggleGroup>
					<Button variant="outline" size="sm" onClick={() => reset(from)}><RotateCcw />还原</Button>
					<Button size="sm" onClick={copy}><Copy />复制</Button>
				</div>
				<div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
					{MODES.map((m) => (
						<div key={m} className="flex flex-col gap-2">
							<div className="text-xs text-muted-foreground">{MODE_NAME[m]}的灰</div>
							<Knob label="色相" value={theme.neutral[m].hue} min={0} max={360} step={1} onChange={(v) => tint(m, "hue", v)} format={(v) => `${v}°`} />
							<Knob label="彩度" value={theme.neutral[m].chroma} min={0} max={0.03} step={0.001} onChange={(v) => tint(m, "chroma", v)} format={(v) => v.toFixed(3)} />
						</div>
					))}
					<Knob label="圆角" value={theme.radius} min={0} max={1.2} step={0.025} onChange={(v) => setTheme((t) => ({ ...t, radius: v }))} format={(v) => `${v}rem`} />
				</div>
			</section>

			<section className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{MODES.map((m) => (
					<div key={m} className={cn(m, "overflow-hidden rounded-xl border")} style={vars}>
						<Preview mode={m} />
					</div>
				))}
			</section>

			{GROUPS.map((g) => (
				<section key={g} className="flex flex-col gap-2">
					<h2 className="text-sm font-medium">{g}</h2>
					<div className="overflow-hidden rounded-xl border bg-background">
						{list.filter((r) => groupOf(r.name) === g).map((r) => <Row key={r.name} r={r} list={list} vars={vars} />)}
					</div>
				</section>
			))}
		</main>
	);
}

function Knob({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
	return (
		<label className="flex items-center gap-3 text-xs">
			<span className="w-8 shrink-0 text-muted-foreground">{label}</span>
			<input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-6 flex-1 accent-primary" />
			<span className="w-16 shrink-0 text-right tabular-nums">{format(value)}</span>
		</label>
	);
}

/** 一小块真实的界面：侧栏、主内容板、卡片、按钮、状态、倒计时 */
function Preview({ mode }: { mode: Mode }) {
	return (
		<div className="flex h-64 bg-sidebar text-foreground">
			<div className="flex w-32 shrink-0 flex-col gap-1 p-2 text-md">
				<span className="px-2 py-1 font-semibold">{MODE_NAME[mode]}</span>
				<span className="flex items-center gap-1.5 rounded-md bg-sidebar-accent px-2 py-1">会话 <StatusIcon s="running" className="ml-auto" /></span>
				<span className="flex items-center gap-1.5 px-2 py-1">修 bug <StatusIcon s="waiting" className="ml-auto" /></span>
				<span className="flex items-center gap-1.5 px-2 py-1 text-muted-foreground">5 分钟</span>
			</div>
			<div className="m-1.5 ml-0 flex flex-1 flex-col gap-3 rounded-lg border bg-background p-3">
				<div className="flex items-center gap-2 text-sm font-medium">主内容 <Badge variant="secondary">徽标</Badge></div>
				<div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
					<div className="flex items-center gap-2 text-sm font-medium">卡片标题<span className="ml-auto text-2xs font-normal text-waiting-strong">剩 1 分钟</span></div>
					<p className="text-xs text-muted-foreground">次要的字在卡片上也读得清</p>
					<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">pnpm test</code>
					<div className="flex gap-2">
						<Button size="sm" variant="outline">拒绝…</Button>
						<Button size="sm">允许</Button>
					</div>
				</div>
				<div className="flex gap-3 text-xs">
					<span className="text-added-strong">+12</span>
					<span className="text-removed-strong">−3</span>
					<span className="rounded bg-success-subtle px-1.5 text-success-strong">成功</span>
					<span className="text-destructive-strong">出错</span>
				</div>
			</div>
		</div>
	);
}

/** 一个 token：名字、用途、两种模式的样子；字的 token 带对比度（最差的那个底） */
function Row({ r, list, vars }: { r: Role; list: Role[]; vars: CSSProperties }) {
	const value = new Map(list.map((x) => [x.name, x.value]));
	return (
		<div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t px-3 py-2 first:border-t-0 sm:grid-cols-[14rem_1fr_auto_auto]">
			<code className="truncate font-mono text-xs">--{r.name}</code>
			<span className="hidden text-xs text-muted-foreground sm:block">{r.doc}</span>
			{MODES.map((m) => {
				const worst = r.needs ? Math.min(...r.needs[1].map((u) => contrast(r.value[m], flatten(value.get(u)?.[m] ?? r.value[m], value.get("background")?.[m] ?? r.value[m])))) : null;
				const ok = worst === null || worst >= (r.needs?.[0] ?? 0) - 0.01;
				return (
					<div key={m} className={cn(m, "flex items-center gap-2 rounded-md p-1")} style={vars}>
						<Sample r={r} />
						<span className={cn("flex w-14 items-center gap-0.5 text-2xs tabular-nums", ok ? "text-muted-foreground" : "text-destructive-strong")} title={worst === null ? undefined : `和 ${r.needs?.[1].join("、")} 里最差的那个比，要 ${r.needs?.[0]}`}>
							{worst !== null && (ok ? <Check className="size-3" /> : <X className="size-3" />)}
							{worst?.toFixed(1)}
						</span>
					</div>
				);
			})}
		</div>
	);
}

/** token 的样子：面是一块，字是写在它要放的第一个底上，半透明的层叠在 background 上，边是一圈 */
function Sample({ r }: { r: Role }) {
	const v = `var(--${r.name})`;
	const g = groupOf(r.name);
	const box = "flex h-8 w-16 shrink-0 items-center justify-center rounded-md text-xs";
	let body: ReactNode;
	if (g === "字" || r.name.endsWith("-strong")) {
		const under = r.needs?.[1][0] ?? "background";
		body = <span className={cn(box, "border font-medium")} style={{ background: `var(--${under === "sidebar" ? "sidebar" : under})`, color: v }}>Aa 字</span>;
	} else if (g === "半透明的层" || r.name.endsWith("-subtle")) {
		body = <span className={cn(box, "border bg-background")}><span className="size-6 rounded" style={{ background: v }} /></span>;
	} else if (g === "边和焦点") {
		body = <span className={cn(box, "bg-background")} style={{ border: `2px solid ${v}` }} />;
	} else if (g === "有固定意思的颜色") {
		body = <span className={cn(box, "border bg-background")}><span className="size-3 rounded-full" style={{ background: v }} /></span>;
	} else {
		body = <span className={cn(box, "border")} style={{ background: v }} />;
	}
	return body;
}
