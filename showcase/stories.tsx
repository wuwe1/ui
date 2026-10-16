// Components and their states on the showcase. State names match States in docs/components/<file>.md.
import { Bell, CircleAlert, FileText, GitFork, Globe, Inbox, Pencil, Plus, Search, SquarePen, SquareTerminal, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../src/components/alert.tsx";
import { Badge } from "../src/components/badge.tsx";
import { Button } from "../src/components/button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../src/components/card.tsx";
import { Input } from "../src/components/input.tsx";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../src/components/input-group.tsx";
import { Kbd } from "../src/components/kbd.tsx";
import { MemoryPanel, type MemoryGroup, type MemoryItem } from "../src/components/memory-panel.tsx";
import { NotificationStack, type Notice } from "../src/components/notification-stack.tsx";
import { CopyAction, MessageActions, MessageActionsQuiet, MessageMenu, TurnStats, type TurnFile } from "../src/components/message-actions.tsx";
import { Loading, Placeholder } from "../src/components/placeholder.tsx";
import { Shimmer } from "../src/components/shimmer.tsx";
import { Skeleton } from "../src/components/skeleton.tsx";
import { Spinner } from "../src/components/spinner.tsx";
import { type Mark, StatusIcon, statusLabel } from "../src/components/status-icon.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../src/components/tabs.tsx";
import { ThinkingLoader } from "../src/components/thinking-loader.tsx";
import { ToolCall, ToolCallGroup, type ToolCallItem } from "../src/components/tool-call.tsx";
import { Textarea } from "../src/components/textarea.tsx";
import { toast } from "../src/components/toast.tsx";
import { ToggleGroup, ToggleGroupItem } from "../src/components/toggle-group.tsx";

export type Story = { name: string; render: () => ReactNode };

/** The sidebar: pages by group. A page missing here still shows, under Other */
export const NAV: { label: string; pages: string[] }[] = [
	{ label: "Foundations", pages: ["Theme"] },
	{ label: "Agent", pages: ["ThinkingLoader", "ToolCallGroup", "ToolCall", "MessageActions", "MemoryPanel"] },
	{ label: "Notifications", pages: ["Toast", "NotificationStack"] },
	{ label: "Status and loading", pages: ["StatusIcon", "Shimmer", "Skeleton", "Spinner", "Placeholder"] },
	{ label: "Base", pages: ["Button", "Badge", "Input", "Tabs", "Card", "Alert", "Feedback"] },
];

const row = "flex flex-wrap items-center gap-2";
const col = "flex flex-col gap-3";

const VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;
const SIZES = ["xs", "sm", "default", "lg"] as const;
const MARKS: Mark[] = ["waiting", "running", "background", "done", "error", "terminal", "ok", "failed"];

export const STORIES: Record<string, Story[]> = {
	Button: [
		{ name: "Variants", render: () => <div className={row}>{VARIANTS.map((v) => <Button key={v} variant={v}>{v}</Button>)}</div> },
		{ name: "Sizes", render: () => <div className={row}>{SIZES.map((s) => <Button key={s} size={s}><Plus />{s}</Button>)}</div> },
		{ name: "Icon only", render: () => <div className={row}>{(["icon-xs", "icon-sm", "icon", "icon-lg"] as const).map((s) => <Button key={s} size={s} variant="outline" aria-label="新会话"><SquarePen /></Button>)}</div> },
		{ name: "Disabled", render: () => <div className={row}>{VARIANTS.map((v) => <Button key={v} variant={v} disabled>{v}</Button>)}</div> },
		{ name: "Long label", render: () => <div className="w-48"><Button className="w-full">一个按钮上的字太长了会怎么样</Button></div> },
	],
	Badge: [
		{ name: "Variants", render: () => <div className={row}>{(["default", "secondary", "outline", "ghost", "destructive"] as const).map((v) => <Badge key={v} variant={v}>{v}</Badge>)}</div> },
		{ name: "Icon and count", render: () => <div className={row}><Badge variant="secondary"><Bell />3</Badge><Badge variant="outline">推荐</Badge><Badge className="tabular-nums">128</Badge></div> },
	],
	StatusIcon: [
		{
			name: "Every mark",
			render: () => (
				<div className={col}>
					{MARKS.map((m) => (
						<div key={m} className="flex items-center gap-2 text-md">
							<StatusIcon s={m} />
							<code className="font-mono text-xs">{m}</code>
							<span className="text-xs text-muted-foreground">{statusLabel(m)}</span>
						</div>
					))}
				</div>
			),
		},
	],
	Placeholder: [
		{ name: "Empty", render: () => <div className="flex min-h-56 flex-col"><Placeholder icon={Inbox} title="Inbox 为空" text="待确认、出错、运行中、跑完没看的会话会出现在这里"><Button variant="outline" size="sm"><SquarePen />新会话</Button></Placeholder></div> },
		{ name: "Text only", render: () => <div className="flex min-h-32 flex-col"><Placeholder text="选择一个文件" /></div> },
		{ name: "Loading", render: () => <Loading className="h-32" /> },
	],
	Input: [
		{ name: "Placeholder, value", render: () => <div className={col}><Input placeholder="搜索会话…" /><Input defaultValue="pnpm test" /></div> },
		{ name: "Disabled", render: () => <Input placeholder="不能改" disabled /> },
		{ name: "Invalid", render: () => <div className={col}><Input aria-invalid defaultValue="no-such-branch" /><span className="text-xs text-destructive-strong">分支不存在</span></div> },
		{ name: "With icon", render: () => <InputGroup><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput placeholder="搜索…" /></InputGroup> },
		{ name: "Multiline", render: () => <Textarea placeholder="继续…" rows={3} /> },
	],
	Tabs: [
		{
			name: "Three tabs",
			render: () => (
				<Tabs defaultValue="files">
					<TabsList>
						<TabsTrigger value="files">文件</TabsTrigger>
						<TabsTrigger value="changes">改动 <span className="text-muted-foreground tabular-nums">3</span></TabsTrigger>
						<TabsTrigger value="exploit" disabled>exploit</TabsTrigger>
					</TabsList>
					<TabsContent value="files" className="pt-2 text-sm text-muted-foreground">文件列表</TabsContent>
					<TabsContent value="changes" className="pt-2 text-sm text-muted-foreground">改动列表</TabsContent>
				</Tabs>
			),
		},
		{ name: "ToggleGroup", render: () => <ToggleGroup type="single" variant="outline" size="sm" defaultValue="b"><ToggleGroupItem value="a">列表</ToggleGroupItem><ToggleGroupItem value="b">卡片</ToggleGroupItem><ToggleGroupItem value="c">表格</ToggleGroupItem></ToggleGroup> },
	],
	Card: [
		{
			name: "Title, description, actions",
			render: () => (
				<Card>
					<CardHeader>
						<CardTitle>修改文件</CardTitle>
						<CardDescription>web/src/app.tsx</CardDescription>
					</CardHeader>
					<CardContent className="text-sm">要改 3 行</CardContent>
					<CardFooter className="gap-2">
						<Button variant="outline" className="flex-1">拒绝…</Button>
						<Button className="flex-1">允许</Button>
					</CardFooter>
				</Card>
			),
		},
	],
	Alert: [
		{ name: "Default", render: () => <Alert><CircleAlert /><AlertTitle>有新版本</AlertTitle><AlertDescription>刷新后生效</AlertDescription></Alert> },
		{ name: "Error", render: () => <Alert variant="destructive"><Trash2 /><AlertTitle>删除失败</AlertTitle><AlertDescription>文件被别的进程占着</AlertDescription></Alert> },
	],
	Shimmer: [
		{ name: "In progress", render: () => <div className="flex items-center gap-2 text-xs"><Shimmer role="status">正在等待回复…</Shimmer><span className="text-2xs text-muted-foreground tabular-nums">0:12</span></div> },
		{ name: "Running step", render: () => <Step running summary="pnpm test" /> },
		{ name: "Long", render: () => <Step running summary="web/src/components/conversation/very-long-file-name-that-does-not-fit.tsx" /> },
		{ name: "Done", render: () => <Step summary="pnpm test" /> },
	],
	Skeleton: [
		{
			name: "List",
			render: () => (
				<div className="flex flex-col gap-1" aria-busy="true">
					{[0, 1, 2].map((i) => (
						<div key={i} className="flex items-start gap-2 py-2">
							<span className="mt-0.5 flex size-4 shrink-0 items-center justify-center"><Skeleton className="size-2 rounded-full" /></span>
							<div className="flex flex-1 flex-col gap-1.5"><Skeleton className="h-3.5 w-2/5" /><Skeleton className="h-3 w-3/5" /></div>
						</div>
					))}
				</div>
			),
		},
		{ name: "Text", render: () => <div className="flex flex-col gap-2" aria-busy="true"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-3 w-4/5" /><Skeleton className="h-3 w-3/5" /></div> },
		{ name: "Block", render: () => <Skeleton className="h-20 w-full rounded-lg" aria-busy="true" /> },
	],
	Spinner: [
		{ name: "In a button", render: () => <div className={row}><Button variant="outline" size="sm" disabled><Spinner />删除</Button><Button size="icon" variant="outline" disabled aria-label="停止中"><Spinner /></Button></div> },
		{ name: "In a chip", render: () => <span className="flex w-fit items-center gap-1.5 rounded-md border py-0.5 pr-2 pl-2 text-xs"><Spinner />screenshot.png</span> },
	],
	ThinkingLoader: [
		{ name: "Waiting", render: () => <ThinkingLoader since={Date.now() - 12_000} /> },
		{ name: "Phase change", render: () => <Phases /> },
		{ name: "Pill", render: () => <ThinkingLoader variant="pill" label="正在搜索网页…" since={Date.now() - 3_000} /> },
		{ name: "Done", render: () => <div className={col}><ThinkingLoader done since={Date.now() - 4_200} /><ThinkingLoader variant="pill" done since={Date.now() - 12_400} /></div> },
	],
	ToolCall: [
		{ name: "Running", render: () => <ToolCall call={{ ...BASH, status: "running", since: Date.now() - 8_000 }} /> },
		{ name: "Done", render: () => <ToolCall call={READ} /> },
		{ name: "Open", render: () => <ToolCall call={GREP} args={GREP_ARGS} result={GREP_RESULT} defaultOpen /> },
		{ name: "Failed", render: () => <ToolCall call={FETCH} args={FETCH_ARGS} error="请求超时：8 秒内 hubspot.com 没有响应" onRetry={() => {}} defaultOpen /> },
		{ name: "Loading", render: () => <ToolCall call={READ} args={null} result={null} defaultOpen /> },
		{ name: "Long", render: () => <ToolCall call={{ ...READ, summary: "web/src/components/conversation/very-long-file-name-that-does-not-fit.tsx" }} /> },
	],
	ToolCallGroup: [
		{ name: "Running", render: () => <ToolCallGroup calls={[READ, GREP, { ...BASH, status: "running", since: Date.now() - 8_000 }]} /> },
		{ name: "Done, folded", render: () => <ToolCallGroup calls={[READ, GREP, EDIT]} ms={2_700} /> },
		{ name: "Done, open", render: () => <ToolCallGroup calls={[READ, GREP, EDIT]} ms={2_700} defaultOpen /> },
		{ name: "Some failed", render: () => <ToolCallGroup calls={[READ, FETCH, EDIT]} ms={9_400} /> },
		{ name: "One failed call", render: () => <ToolCallGroup calls={[FETCH]} ms={8_000} /> },
	],
	MessageActions: [
		{ name: "Quiet", render: () => <Reply time /> },
		{ name: "Lit", render: () => <Reply time quiet={false} /> },
		{ name: "Your message", render: () => <Mine /> },
		{ name: "Turn", render: () => <Reply stats={<TurnStats ms={218_000} tools={12} files={FILES.slice(0, 3)} onFile={() => {}} agents={AGENTS} onAgent={() => {}} model="Opus 5.5" />} /> },
		{ name: "A few facts", render: () => <Reply stats={<TurnStats ms={4_200} tools={2} model="Opus 5.5" />} /> },
		{ name: "Failed calls", render: () => <Reply stats={<TurnStats ms={96_000} tools={9} failed={2} files={FILES.slice(0, 1)} model="Sonnet 5.5" />} /> },
		{ name: "Long", render: () => <Reply stats={<TurnStats ms={4_212_000} tools={148} failed={3} files={FILES} onFile={() => {}} agents={[...AGENTS, { id: "a3", label: "检查 iOS Safari 上的滚动" }, { id: "a4", label: "对比 affectUI 的 Agent Run 页面" }]} onAgent={() => {}} model="Opus 5.5" />} /> },
	],
	MemoryPanel: [
		{ name: "Default", render: () => <Memories /> },
		{ name: "Paused", render: () => <Memories initial={MEMORIES.map((m, i) => (i < 2 ? { ...m, paused: true } : m))} /> },
		{ name: "Off", render: () => <Memories on={false} /> },
		{ name: "Empty", render: () => <Memories initial={[]} /> },
		{ name: "Loading", render: () => <MemoryPanel memories={[]} groups={GROUPS} loading enabled onEnabledChange={() => {}} /> },
		{ name: "Long", render: () => <Memories initial={[...MEMORIES, ...MEMORIES.map((m) => ({ ...m, id: `${m.id}-2`, text: `${m.text}；另外在 lilto 和 listo 两个项目里也一样，长一点看看折行` }))]} /> },
	],
	Toast: [
		{
			name: "Kinds",
			render: () => (
				<div className={row}>
					<Button variant="outline" size="sm" onClick={() => toast("已移出工作区", { action: { label: "撤销", onClick: () => {} } })}>Info · action</Button>
					<Button variant="outline" size="sm" onClick={() => toast.success("已复制到剪贴板")}>Success</Button>
					<Button variant="outline" size="sm" onClick={() => toast.error("发送失败", { description: "网络连接已断开，消息已放回输入框" })}>Error</Button>
					<Button variant="outline" size="sm" onClick={() => toast.promise(new Promise((r) => setTimeout(r, 1500)), { loading: "正在新建会话…", success: { title: "已打开新会话", description: "mixer › 修 block 手机闪退" }, error: "新建会话失败" })}>Promise</Button>
				</div>
			),
		},
		{
			name: "Stack",
			render: () => (
				<Button variant="outline" size="sm" className="w-fit" onClick={() => { toast.success("已删除"); toast.error("停止失败", { description: "进程已退出" }); toast("已移出工作区", { action: { label: "撤销", onClick: () => {} } }); toast("第四条排队，前面关掉一条才出来"); }}>
					一次来四条
				</Button>
			),
		},
		{ name: "Stays", render: () => <Button variant="outline" size="sm" className="w-fit" onClick={() => toast("有新版本", { duration: Number.POSITIVE_INFINITY, action: { label: "刷新", onClick: () => {} } })}>不自己消失</Button> },
		{ name: "Long", render: () => <Button variant="outline" size="sm" className="w-fit" onClick={() => toast.error("启动失败：claude 退出码 1", { description: "Error: ENOENT: no such file or directory, open '/Users/me/repos/very/long/path/to/some/config/file/that/does/not/exist.json'" })}>很长的出错</Button> },
	],
	NotificationStack: [
		{ name: "One", render: () => <Notices initial={NOTICES.slice(2)} /> },
		{ name: "Three", render: () => <Notices initial={NOTICES} /> },
		{ name: "Many", render: () => <Notices initial={[...NOTICES, { id: "n4", tag: "提示", title: "用量快到上限", text: "5 小时窗口已用 92%" }, { id: "n5", tag: "提示", title: "iPhone 上要先添加到主屏幕" }]} /> },
		{ name: "Long", render: () => <Notices initial={[{ id: "l1", mark: "error", tag: "出错", title: "penna › 把导出的 PDF 换成按章节分页、目录可点、页眉带书名", text: "API Error: 529 overloaded_error – the service is temporarily overloaded, retried 10 times over 12 minutes", action: { label: "查看", onClick: () => {} } }]} /> },
	],
	Feedback: [
		{ name: "Kbd", render: () => <div className={row}><Kbd>⌘</Kbd><Kbd>↵</Kbd><Kbd>Esc</Kbd></div> },
		{ name: "toast", render: () => <div className={row}><Button variant="outline" size="sm" onClick={() => toast("已复制到剪贴板")}>提示</Button><Button variant="outline" size="sm" onClick={() => toast.error("出错：网络连接已断开")}>出错</Button></div> },
	],
};

/** A tool step as an agent UI shows it: name, summary, clock. Running – the summary shimmers */
function Step({ running, summary }: { running?: boolean; summary: string }) {
	return (
		<div className="flex min-w-0 items-center gap-2 text-md">
			<span className="shrink-0 font-medium">Bash</span>
			<Shimmer active={running} className="truncate font-mono text-xs text-muted-foreground">{summary}</Shimmer>
			<span className="ml-auto shrink-0 pl-2 text-2xs text-muted-foreground tabular-nums">{running ? "0:08" : "1.2s"}</span>
		</div>
	);
}

const GROUPS: MemoryGroup[] = [
	{ id: "user", label: "你的偏好", hint: "你是谁、喜欢怎么做" },
	{ id: "feedback", label: "做事的反馈", hint: "你纠正过、肯定过的做法" },
	{ id: "project", label: "项目情况", hint: "进行中的事、约束" },
	{ id: "reference", label: "外部资料", hint: "去哪找什么" },
];
const MEMORIES: MemoryItem[] = [
	{ id: "zh", text: "回复用中文，术语用英文原名", detail: "hover、focus、tap、toast、spinner 直接写英文，不译成「指着」「焦点」。\n\n**Why:** 读的时候不用多转一道。", group: "feedback", source: "来自 mixer › Message Actions", date: "10/16" },
	{ id: "color", text: "颜色克制：默认黑白灰，一块最多一种强调色", group: "feedback", source: "来自 mixer › 主题", date: "10/14" },
	{ id: "pkill", text: "别用 pkill 按模式杀进程，只按 PID 或端口", group: "feedback", source: "来自 mixer › 修 block", date: "10/9" },
	{ id: "penna", text: "ui 和 Penna 共用；ui 只对自己负责", group: "project", source: "来自 mixer › Toast", date: "10/16" },
	{ id: "local", text: "域名、隧道、邮箱只写 CLAUDE.local.md", group: "project", source: "你写的", date: "10/2" },
	{ id: "lang", text: "用户是独立开发者，前端和 agent 产品", group: "user", source: "来自 penna › 导出", date: "9/28" },
];

/** A panel wired like a host would: changes land in local state; forgetting keeps the item for Undo */
function Memories({ initial = MEMORIES, on = true }: { initial?: MemoryItem[]; on?: boolean }) {
	const [list, setList] = useState(initial);
	const [enabled, setEnabled] = useState(on);
	const [gone, setGone] = useState<Record<string, MemoryItem>>({});
	return (
		<MemoryPanel
			memories={list}
			groups={GROUPS}
			enabled={enabled}
			onEnabledChange={setEnabled}
			offNote="Claude 不会读取或写入这个项目的 memory，已有的不会删除"
			onAdd={(d) => setList((l) => [{ id: `n${Date.now()}`, text: d.text, group: d.group, source: "你写的", date: "刚刚" }, ...l])}
			onEdit={(id, c) => setList((l) => l.map((m) => (m.id === id ? { ...m, ...c } : m)))}
			onPause={(id, p) => setList((l) => l.map((m) => (m.id === id ? { ...m, paused: p } : m)))}
			onForget={(id) => setList((l) => { const m = l.find((x) => x.id === id); if (m) setGone((g) => ({ ...g, [id]: m })); return l.filter((x) => x.id !== id); })}
			onRestore={(id) => { const m = gone[id]; if (m) setList((l) => [m, ...l]); }}
			onSource={() => toast("打开那个会话")}
		/>
	);
}

const NOTICES: Notice[] = [
	{ id: "n1", mark: "ok", tag: "已完成", title: "mixer › 修 block 手机闪退", text: "改了 3 个文件，测试全部通过", action: { label: "查看", onClick: () => {} } },
	{ id: "n2", mark: "error", tag: "出错", title: "penna › 导出 PDF", text: "API Error：overloaded", action: { label: "查看", onClick: () => {} } },
	{ id: "n3", tag: "新版本", title: "mixer 有新版本", text: "刷新后生效，输入框里的字不会丢", action: { label: "刷新", onClick: () => {} } },
];

/** A stack the way a sidebar foot holds it: dismissing drops the front notice; empty – a button brings them back */
function Notices({ initial }: { initial: Notice[] }) {
	const [list, setList] = useState(initial);
	return (
		<div className="w-52">
			{list.length ? <NotificationStack notices={list} onDismiss={(n) => setList((l) => l.filter((x) => x.id !== n.id))} /> : <Button variant="ghost" size="xs" onClick={() => setList(initial)}>再来一次</Button>}
		</div>
	);
}

const FILES: TurnFile[] = [
	{ path: "web/src/lib/thread.ts", added: 31, removed: 9 },
	{ path: "test/thread.test.ts", added: 14, removed: 0 },
	{ path: "docs/product.md", added: 3, removed: 3 },
	{ path: "web/src/components/conversation.tsx", added: 52, removed: 40 },
	{ path: "server/sessions.ts", added: 18, removed: 2 },
	{ path: "shared/api.ts", added: 1, removed: 0 },
	{ path: "web/src/components/message.tsx", added: 77, removed: 61 },
];
const AGENTS = [{ id: "a1", label: "找出切会话丢消息的原因" }, { id: "a2", label: "写一条复现的测试" }];

/** A reply as a host lays it out: the message wraps the text and the row, so hovering or tapping it lights the quiet part */
function Reply({ time, quiet, stats }: { time?: boolean; quiet?: boolean; stats?: ReactNode }) {
	const text = "修好了：增量里删掉的节点没从旧列表里去掉，切回会话时拿到的是旧的那份。加了两条测试，全部通过。";
	return (
		<div data-message tabIndex={-1} className="flex flex-col gap-1 text-sm outline-none">
			<p>{text}</p>
			<MessageActions className={stats ? undefined : "-ml-1"}>
				{stats}
				<MessageActionsQuiet quiet={quiet}>
					<CopyAction text={text} />
					<MessageMenu items={[{ icon: GitFork, label: "从这里分叉", onSelect: () => {} }]} />
					{time && <span className="px-1">5 分钟前</span>}
				</MessageActionsQuiet>
				{stats && <span className="ml-auto">5 分钟前</span>}
			</MessageActions>
		</div>
	);
}

/** Your own message: the bubble, the row right-aligned, a badge that stays */
function Mine() {
	const text = "切会话时偶尔丢消息，查一下";
	return (
		<div data-message tabIndex={-1} className="flex flex-col items-end gap-1.5 text-sm outline-none">
			<div className="max-w-[88%] rounded-2xl rounded-br-md bg-secondary px-4 py-2.5">{text}</div>
			<MessageActions align="end" className="-mr-1">
				<MessageActionsQuiet>
					<span className="px-1">5 分钟前</span>
					<CopyAction text={text} />
					<MessageMenu items={[{ icon: Pencil, label: "编辑并分叉", onSelect: () => {} }]} />
				</MessageActionsQuiet>
				<Badge variant="outline" className="h-4 px-1.5 text-2xs">中途插入</Badge>
			</MessageActions>
		</div>
	);
}

const BASH: ToolCallItem = { id: "1", name: "Bash", summary: "pnpm test", icon: SquareTerminal, status: "done", ms: 4_100 };
const READ: ToolCallItem = { id: "2", name: "Read", summary: "web/src/app.tsx", icon: FileText, status: "done", ms: 120 };
const GREP: ToolCallItem = { id: "3", name: "Grep", summary: "StatusIcon", icon: Search, status: "done", ms: 340 };
const EDIT: ToolCallItem = { id: "4", name: "Edit", summary: "web/src/app.tsx", icon: Pencil, status: "done", ms: 90 };
const FETCH: ToolCallItem = { id: "5", name: "WebFetch", summary: "hubspot.com/pricing", icon: Globe, status: "failed", ms: 8_000 };
const GREP_ARGS = JSON.stringify({ pattern: "StatusIcon", path: "web/src", output_mode: "files_with_matches" }, null, 2);
const GREP_RESULT = "web/src/app.tsx\nweb/src/components/side.tsx\nweb/src/components/inbox.tsx";
const FETCH_ARGS = JSON.stringify({ url: "https://www.hubspot.com/pricing/sales", prompt: "列出各档价格" }, null, 2);

/** The label changes: the old one rolls out, the new one rolls in */
function Phases() {
	const LABELS = ["正在等待回复…", "正在压缩上下文…", "正在读取 12 个文件…"];
	const [i, setI] = useState(0);
	return (
		<div className={col}>
			<ThinkingLoader label={LABELS[i]} since={Date.now() - 6_000} />
			<Button variant="outline" size="sm" className="w-fit" onClick={() => setI((i + 1) % LABELS.length)}>换一句</Button>
		</div>
	);
}
