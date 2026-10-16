// Components and their states on the showcase. State names match States in docs/components/<file>.md.
import { AppWindow, Bell, CircleAlert, FileText, GitFork, Globe, Inbox, Pencil, Plus, Search, SquarePen, SquareTerminal, Store, Trash2 } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../src/components/alert.tsx";
import { ApprovalCard, type ApprovalStatus } from "../src/components/approval-card.tsx";
import { Badge } from "../src/components/badge.tsx";
import { Button } from "../src/components/button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../src/components/card.tsx";
import { ContextWindow, type ContextPart } from "../src/components/context-window.tsx";
import { ConnectionCard, type ConnectionMark, ConnectionNote, ConnectionRow } from "../src/components/connection-card.tsx";
import { Elapsed } from "../src/components/elapsed.tsx";
import { Inbox as AgentInbox, InboxEmpty, type InboxItem, type InboxStatus } from "../src/components/inbox.tsx";
import { Input } from "../src/components/input.tsx";
import { Outline, useInView } from "../src/components/outline.tsx";
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
import { cn } from "../src/lib/utils.ts";

export type Story = { name: string; render: () => ReactNode };

/** The sidebar: pages by group. A page missing here still shows, under Other */
export const NAV: { label: string; pages: string[] }[] = [
	{ label: "Foundations", pages: ["Theme"] },
	{ label: "Navigation", pages: ["Outline"] },
	{ label: "Agent", pages: ["Inbox", "ThinkingLoader", "ToolCallGroup", "ToolCall", "ApprovalCard", "ContextWindow", "MessageActions", "ConnectionCard", "MemoryPanel"] },
	{ label: "Notifications", pages: ["Toast", "NotificationStack"] },
	{ label: "Status and loading", pages: ["StatusIcon", "Shimmer", "Skeleton", "Spinner", "Placeholder"] },
	{ label: "Base", pages: ["Button", "Badge", "Input", "Tabs", "Card", "Alert", "Feedback"] },
];

const row = "flex flex-wrap items-center gap-2";
const col = "flex flex-col gap-3";

const VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;
const SIZES = ["xs", "sm", "default", "lg"] as const;
const MARKS: Mark[] = ["waiting", "running", "background", "done", "error", "terminal", "ok", "failed", "off"];

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
	ApprovalCard: [
		{ name: "Pending", render: () => <Approval /> },
		{ name: "Diff", render: () => <Approval kind="edit" /> },
		{ name: "Expiring", render: () => <Approval until={Date.now() + 40_000} /> },
		{ name: "From elsewhere", render: () => <Approval label={<span className="flex items-center gap-2"><span className="truncate">mixer › 修 block 手机闪退</span><span className="ml-auto shrink-0">查看 ›</span></span>} keys="none" /> },
		{ name: "Optional parts", render: () => <Approval risk="high" always="始终允许这条命令" edit /> },
		{
			name: "Answered",
			render: () => (
				<div className={col}>
					{(["approved", "denied", "expired", "cancelled"] as const).map((st) => <ApprovalCard key={st} title="运行命令" description="pnpm test" status={st} />)}
				</div>
			),
		},
	],
	Inbox: [
		{ name: "Default", render: () => <Runs /> },
		{ name: "Open", render: () => <Runs open /> },
		{ name: "Steps loading", render: () => <Runs loadingSteps /> },
		{ name: "Live", render: () => <Runs live /> },
		{ name: "Many", render: () => <AgentInbox items={MANY_RUNS} onOpen={() => {}} /> },
		{ name: "Long", render: () => <AgentInbox items={LONG_RUNS} onOpen={() => {}} /> },
		{ name: "Loading", render: () => <AgentInbox items={null} /> },
		{ name: "Empty", render: () => <AgentInbox items={[]} empty={<InboxEmpty><Button variant="outline" size="sm"><SquarePen />新会话</Button></InboxEmpty>} /> },
	],
	Outline: [
		{ name: "Default", render: () => <Doc n={12} /> },
		{ name: "Few", render: () => <Doc n={3} /> },
		{ name: "Many", render: () => <Doc n={240} /> },
		{ name: "Long lines", render: () => <Doc n={10} long /> },
	],
	ContextWindow: [
		{ name: "Loading", render: () => <ContextWindow parts={null} limit={200_000} /> },
		{ name: "Default", render: () => <Ctx /> },
		{ name: "Near the limit", render: () => <Ctx messages={168_000} /> },
		{ name: "Compact", render: () => <Ctx live /> },
		{ name: "Can't compact", render: () => <Ctx disabled="运行中：这一轮结束后再压缩" /> },
		{ name: "Fresh", render: () => <Ctx messages={900} /> },
		{ name: "Narrow", render: () => <div className="w-[300px]"><Ctx /></div> },
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
	ConnectionCard: [
		{ name: "All set", render: () => <Browsers /> },
		{ name: "Needs you", render: () => <Shops /> },
		{ name: "Action", render: () => <SiteLogin /> },
		{
			name: "Error",
			render: () => (
				<ConnectionCard
					icon={<Store />}
					name="Shopee 店铺"
					mark="error"
					status="授权页打开失败"
					description="经 Shopee 的接口读你的商品、订单和类目，不用开浏览器"
					footer={
						<>
							<ConnectionNote mark="error">网关 20 秒内没有响应：检查网络后再试一次</ConnectionNote>
							<Button variant="ghost" size="xs" className="text-muted-foreground">
								<Plus />
								授权一家店
							</Button>
						</>
					}
				/>
			),
		},
		{
			name: "Checking",
			render: () => (
				<ConnectionCard icon={<Globe />} name="蝦皮卖家中心" checking description="上架：在授权了的 Chrome 里登录着就行">
					<ConnectionRow mark="ok" name="卖家中心" meta={["「办公室」里登录着", "店铺 C"]} />
				</ConnectionCard>
			),
		},
		{ name: "Not connected", render: () => <NoBrowser /> },
		{ name: "Nothing to open", render: () => <ConnectionCard icon={<Globe />} name="chanboss" mark="off" status="缺浏览器" description="读订单：在授权了的 Chrome 里登录着就行" /> },
		{ name: "Long", render: () => <Shops initial={MANY_SHOPS} long /> },
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
	{ id: "user", label: "user", hint: "你是谁、喜欢怎么做" },
	{ id: "feedback", label: "feedback", hint: "你纠正过、肯定过的做法" },
	{ id: "project", label: "project", hint: "进行中的事、约束" },
	{ id: "reference", label: "reference", hint: "去哪找什么" },
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

const DIFF = (
	<div className="font-mono text-xs leading-code">
		{[["-", "const title = meta ? sessionTitle(meta) : null;"], ["+", "const title = meta ? sessionTitle(meta) : r.session?.slice(0, 8);"], [" ", "useEffect(() => { document.title = title; }, [title]);"]].map(([t, line], i) => (
			<div key={i} className={cn("px-2.5 whitespace-pre-wrap break-all", t === "-" && "bg-removed-subtle", t === "+" && "bg-added-subtle")}>
				<span className={cn("mr-2 select-none", t === "-" ? "text-removed-strong" : t === "+" ? "text-added-strong" : "text-muted-foreground")}>{t}</span>
				{line}
			</div>
		))}
	</div>
);

const T = Date.now();
const MIN = 60_000;
/** Runs as a host would feed them; steps arrive 600ms after a row opens, like a fetch */
const RUNS: (InboxItem & { all: InboxItem["steps"] })[] = [
	{ id: "s1", status: "waiting", title: "修 block 手机闪退", place: "mixer", label: "待确认", at: T - MIN, all: [{ label: "Read web/src/block/sandbox.tsx", time: "6 分钟前" }, { label: "Edit 默认导出撞名时去掉名字", time: "4 分钟前" }, { label: "Bash pnpm test", time: "2 分钟前" }] },
	{ id: "s2", status: "error", title: "迁移 CI 到 macOS 15", place: "penna", detail: "5 分钟前", label: "出错", at: T - 5 * MIN, all: [{ label: "Edit .github/workflows/ci.yml", time: "9 分钟前" }, { label: "Bash gh run watch", time: "7 分钟前" }, { label: "API Error: 529 overloaded", time: "5 分钟前", error: true }] },
	{ id: "s3", status: "running", title: "affectUI 分批移植", place: "mixer", detail: "Edit composer.tsx", label: "运行中", at: T - 42_000, all: [{ label: "Read docs/components/composer.md", time: "1 分钟前" }, { label: "Grep Tray", time: "50 秒前" }, { label: "Edit composer.tsx", time: "现在" }] },
	{ id: "s4", status: "running", title: "跑全量测试", place: "amore", detail: "正在思考…", label: "运行中", at: T - 3 * MIN, all: [{ label: "Bash pnpm test", time: "2 分钟前" }, { label: "正在思考…", time: "现在" }] },
	{ id: "s5", status: "background", title: "监控部署", place: "gewu", detail: "部署到 Cloudflare 等 2 个", label: "后台任务", at: T - 8 * MIN, all: [{ label: "Bash wrangler deploy", time: "8 分钟前" }] },
	{ id: "s6", status: "done", title: "改动面板重新设计", place: "mixer", detail: "12 分钟前", label: "已完成", at: T - 12 * MIN, all: [{ label: "Edit changes.tsx", time: "15 分钟前" }, { label: "Bash pnpm build", time: "13 分钟前" }, { label: "改好了，截图在 /tmp", time: "12 分钟前" }] },
];
const MANY_RUNS: InboxItem[] = Array.from({ length: 14 }, (_, i) => {
	const status = (["running", "done", "done", "error", "background"] as const)[i % 5] ?? "done";
	return { id: `m${i}`, status, title: `第 ${i + 1} 个会话：${["整理依赖", "补测试", "写文档", "修样式", "迁移数据"][i % 5]}`, place: ["mixer", "gewu", "stems"][i % 3], detail: status === "running" ? "Bash pnpm test" : `${i + 2} 分钟前`, label: { running: "运行中", done: "已完成", error: "出错", background: "后台任务" }[status], at: T - i * MIN };
});
const LONG_RUNS: InboxItem[] = [
	{ id: "l1", status: "running", title: "把 mixer 里学 affectUI 做的那几块（工具组、确认卡片、上下文、思考提示、输入框托盘）拆成通用组件，搬进组件库", place: "mixer › .claude/worktrees/very-long-worktree-name", detail: "Bash pnpm exec vite build -c vite.block.config.ts --logLevel warn && node scripts/check-size.mjs", label: "运行中", aside: <Elapsed since={T - 61 * MIN} aria-hidden />, at: T, steps: [{ label: "Bash pnpm exec vite build -c vite.block.config.ts --logLevel warn && node scripts/check-size.mjs --budget 650", time: "现在" }] },
	{ id: "l2", status: "done", title: "Refactor the entire session panel so that it works in all three layouts", place: "mixer", detail: "刚刚", label: "已完成", at: T },
];
const CYCLE: Record<InboxStatus, [InboxStatus, string]> = { running: ["done", "已完成"], done: ["waiting", "待确认"], waiting: ["running", "运行中"], error: ["running", "运行中"], background: ["done", "已完成"] };

function Runs({ open, loadingSteps, live }: { open?: boolean; loadingSteps?: boolean; live?: boolean }) {
	const [loaded, setLoaded] = useState<Set<string>>(() => new Set(open ? RUNS.map((r) => r.id) : []));
	const [st, setSt] = useState<Record<string, [InboxStatus, string]>>({});
	const items: InboxItem[] = RUNS.map(({ all, ...r }) => {
		const [status, label] = st[r.id] ?? [r.status, r.label];
		return {
			...r,
			status,
			label,
			aside: status === "running" ? <Elapsed since={r.at} aria-hidden /> : undefined,
			steps: loadingSteps ? null : loaded.has(r.id) || status === "waiting" ? all : null,
			children: status === "waiting" ? <ApprovalCard title="运行命令" description="推送到 GitHub" icon={SquareTerminal} code="git push origin main" until={T + 9 * MIN} keys="none" onApprove={() => new Promise((ok) => setTimeout(ok, 800)).then(() => setSt((x) => ({ ...x, [r.id]: ["running", "运行中"] })))} onDeny={() => new Promise((ok) => setTimeout(ok, 800))} /> : undefined,
		};
	});
	return (
		<div className={col}>
			{live && (
				<div className="flex flex-wrap gap-1.5">
					{items.map((it) => (
						<Button key={it.id} size="xs" variant="outline" onClick={() => setSt((x) => ({ ...x, [it.id]: CYCLE[it.status] }))}>
							{it.title.slice(0, 6)} → {CYCLE[it.status][1]}
						</Button>
					))}
				</div>
			)}
			<AgentInbox
				items={items}
				defaultOpen={open || loadingSteps ? RUNS.map((r) => r.id) : undefined}
				onOpen={() => toast("打开会话")}
				onToggle={(it, on) => { if (on && !loaded.has(it.id)) setTimeout(() => setLoaded((l) => new Set([...l, it.id])), 600); }}
			/>
		</div>
	);
}

const PROMPTS = ["把首页改成 Inbox", "确认卡片换成库里的", "Memory 分组能拖着滚", "Context Window 压缩时扫光", "加载用 Skeleton", "目录做成 Outline", "补 StatusIcon 的规格", "截图看手机深色", "提交", "下一个搬什么"];
/** A scroll box with n messages and an Outline on its right edge, wired like a host would */
function Doc({ n, long }: { n: number; long?: boolean }) {
	const box = useRef<HTMLDivElement>(null);
	const targets = () => [...(box.current?.querySelectorAll<HTMLElement>("[data-msg]") ?? [])];
	const { view } = useInView(box, targets, [n]);
	const label = (i: number) => (long ? `${PROMPTS[i % PROMPTS.length]}，再写长一点：看看两行截断、浮出来的那条三行截断，和目录里怎么折行` : (PROMPTS[i % PROMPTS.length] ?? ""));
	const jump = (i: number) => {
		const el = targets()[i];
		const b = box.current;
		if (el && b) b.scrollTo({ top: b.scrollTop + el.getBoundingClientRect().top - b.getBoundingClientRect().top - 12, behavior: "smooth" });
	};
	return (
		<div className="relative h-96 overflow-hidden rounded-lg border">
			<div ref={box} className="h-full overflow-y-auto px-4 py-3 pr-9">
				{Array.from({ length: n }, (_, i) => (
					<div key={i} data-msg className="flex flex-col gap-1.5 pb-6">
						<div className="w-fit max-w-[80%] self-end rounded-xl bg-muted px-3 py-2 text-sm">{label(i)}</div>
						<p className="text-xs text-muted-foreground">Claude 的回复，几行字，撑出一点高度。{"改好了，截图在 /tmp。".repeat(1 + (i % 3))}</p>
					</div>
				))}
			</div>
			{n >= 2 && <Outline items={Array.from({ length: n }, (_, i) => ({ id: String(i), label: label(i) }))} view={view} onJump={jump} title="目录" description={`你的 ${n} 条消息`} scroller={box} className="absolute top-2 right-0 bottom-2" />}
		</div>
	);
}

/** Context parts as mixer feeds them; compacting takes 2.5s, then the conversation shrinks */
function Ctx({ messages = 108_600, live, disabled }: { messages?: number; live?: boolean; disabled?: string }) {
	const [msgs, setMsgs] = useState(messages);
	const parts: ContextPart[] = [
		{ id: "system", label: "系统提示", tokens: 4200, tone: 0 },
		{ id: "tools", label: "工具", tokens: 12_800, tone: 1 },
		{ id: "memory", label: "Memory 文件", tokens: 3900, tone: 2, items: [{ id: "a", label: "mixer/CLAUDE.md", tokens: 2400, mono: true, title: "/Users/demo/repos/mixer/CLAUDE.md" }, { id: "b", label: "memory/MEMORY.md", tokens: 1500, mono: true }] },
		{ id: "skills", label: "Skills", tokens: 2100, tone: 3, items: [{ id: "c", label: "component", tokens: 1300, mono: true }, { id: "d", label: "show-me", tokens: 800, mono: true }] },
		{ id: "messages", label: "消息", tokens: msgs, compact: true, items: [{ id: "e", label: "工具结果", tokens: Math.round(msgs * 0.6) }, { id: "f", label: "Claude 的回复", tokens: Math.round(msgs * 0.25) }, { id: "g", label: "你的消息", tokens: Math.round(msgs * 0.15) }] },
	];
	return (
		<div className={col}>
			<ContextWindow parts={parts} limit={200_000} model="claude-opus-5-5" threshold={0.92} compactDisabled={disabled} onCompact={() => new Promise((ok) => setTimeout(ok, 2500)).then(() => setMsgs(14_200))} />
			{live && msgs !== messages && <Button variant="ghost" size="xs" className="w-fit" onClick={() => setMsgs(messages)}>再来一次</Button>}
		</div>
	);
}

/** A card wired like a host would: approving takes 1.2s, then it folds into its outcome */
function Approval({ kind = "bash", until = Date.now() + 8 * 60_000, label, risk, always, edit, keys = "focus" }: { kind?: "bash" | "edit"; until?: number; label?: ReactNode; risk?: "low" | "medium" | "high"; always?: string; edit?: boolean; keys?: "focus" | "global" | "none" }) {
	const [status, setStatus] = useState<ApprovalStatus>("pending");
	const settle = (st: ApprovalStatus) => new Promise((r) => setTimeout(r, 1200)).then(() => setStatus(st));
	const common = { until, label, risk, always, keys, status, onApprove: () => settle("approved"), onDeny: () => settle("denied"), onEdit: edit ? () => {} : undefined };
	return (
		<div className={col}>
			{kind === "edit" ? (
				<ApprovalCard {...common} title="修改文件" description="web/src/app.tsx" icon={Pencil} preview={DIFF} />
			) : (
				<ApprovalCard {...common} title="运行命令" description="跑一遍测试" icon={SquareTerminal} code="pnpm test --filter ui" details={[{ label: "方式", value: "后台运行" }, { label: "超时", value: "120 秒" }]} args={JSON.stringify({ command: "pnpm test --filter ui", description: "跑一遍测试", run_in_background: true, timeout: 120000 }, null, 2)} />
			)}
			{status !== "pending" && <Button variant="ghost" size="xs" className="w-fit" onClick={() => setStatus("pending")}>再来一次</Button>}
		</div>
	);
}

/** A connection's accounts as a host keeps them; lucide icons stand in for logos */
type Shop = { id: string; name: string; meta: string[]; mark: ConnectionMark; status: string; fix?: string };
const SHOPS: Shop[] = [
	{ id: "a", name: "原木生活馆", meta: ["TW", "授权到 2027-05-04"], mark: "ok", status: "已授权" },
	{ id: "b", name: "小林家居", meta: ["TW", "授权到 2026-10-21"], mark: "waiting", status: "5 天后到期", fix: "重新授权" },
	{ id: "c", name: "店铺 63401287", meta: ["卖家中心在「办公室」里登录着"], mark: "waiting", status: "待授权", fix: "授权" },
];
const MANY_SHOPS: Shop[] = [
	...SHOPS,
	...["SG", "MY", "PH", "TH", "VN", "BR"].map((site, i): Shop => ({ id: site, name: `原木生活馆 ${site} 站点的跨境店铺，名字很长也只占一行`, meta: [site, "授权到 2027-03-1" + i], mark: "ok", status: "已授权" })),
	{ id: "x", name: "旧店铺", meta: ["TW", "授权到 2026-09-30"], mark: "error", status: "已过期", fix: "重新授权" },
];

/** The shops of one platform: fixing a row takes a second, then the header counts again */
function Shops({ initial = SHOPS, long }: { initial?: Shop[]; long?: boolean }) {
	const [shops, setShops] = useState(initial);
	const [busy, setBusy] = useState<string | null>(null);
	const fix = (id: string) => {
		setBusy(id);
		setTimeout(() => {
			setBusy(null);
			setShops((l) => l.map((x): Shop => (x.id === id ? { ...x, mark: "ok", status: "已授权", fix: undefined, meta: ["TW", "授权到 2027-10-16"] } : x)));
		}, 1000);
	};
	const pending = shops.filter((x) => x.mark !== "ok").length;
	return (
		<ConnectionCard
			icon={<Store />}
			name={long ? "Shopee 跨境店铺（台湾、新加坡、马来西亚、菲律宾、泰国、越南、巴西）" : "Shopee 店铺"}
			mark={pending ? "waiting" : "ok"}
			status={pending ? `${pending} 家待处理` : `已授权 ${shops.length} 家`}
			description={
				long
					? "经 Shopee 的接口读你的商品、订单、类目和物流渠道，不用开浏览器。授权一年有效，到期前 14 天提醒你重新授权，过期以后上架、改价都会失败"
					: "经 Shopee 的接口读你的商品、订单和类目，不用开浏览器"
			}
			footer={
				<Button variant="ghost" size="xs" className="text-muted-foreground">
					<Plus />
					授权一家店
				</Button>
			}
		>
			{shops.map((x) => (
				<ConnectionRow
					key={x.id}
					mark={x.mark}
					name={x.name}
					meta={x.meta}
					status={x.status}
					actions={
						x.fix && (
							<Button variant={x.fix === "授权" ? "default" : "outline"} size="xs" disabled={busy !== null} onClick={() => fix(x.id)}>
								{busy === x.id && <Spinner />}
								{x.fix}
							</Button>
						)
					}
				/>
			))}
		</ConnectionCard>
	);
}

/** Browsers that run the extension: a quiet button turns one off or back on */
function Browsers() {
	const [list, setList] = useState([
		{ id: "a", name: "办公室", on: true },
		{ id: "b", name: "未命名（f6a7b8）", on: true },
		{ id: "c", name: "备用", on: false },
	]);
	const on = list.filter((b) => b.on).length;
	return (
		<ConnectionCard
			icon={<AppWindow />}
			name="Chrome 浏览器"
			mark={on ? "ok" : "waiting"}
			status={on ? `已连接 ${on} 个` : "均未启用"}
			description="读 1688 货源、在卖家中心做接口做不了的事：用你登录着的 Chrome"
			footer={
				<Button variant="ghost" size="xs" className="text-muted-foreground">
					<Plus />
					连接浏览器
				</Button>
			}
		>
			{list.map((b) => (
				<ConnectionRow
					key={b.id}
					mark={b.on ? "ok" : "off"}
					name={b.name}
					status={b.on ? "已授权" : "未启用"}
					quiet={
						<Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => setList((l) => l.map((x) => (x.id === b.id ? { ...x, on: !x.on } : x)))}>
							{b.on ? "停用" : "启用"}
						</Button>
					}
				/>
			))}
		</ConnectionCard>
	);
}

/** One press fixes it: the page opens in a second, then the login is checked again */
function SiteLogin() {
	const [step, setStep] = useState<"out" | "opening" | "checking" | "in">("out");
	const go = () => {
		setStep("opening");
		setTimeout(() => setStep("checking"), 1000);
		setTimeout(() => setStep("in"), 2500);
	};
	const done = step === "in";
	return (
		<div className={col}>
			<ConnectionCard
				icon={<Globe />}
				name="1688"
				mark={done ? "ok" : "waiting"}
				status={done ? "已登录" : "未登录"}
				checking={step === "checking"}
				description="读货源：在授权了的 Chrome 里登录着就行"
				action={
					!done && (
						<Button size="sm" disabled={step !== "out"} onClick={go}>
							{step === "opening" && <Spinner />}
							去登录
						</Button>
					)
				}
			>
				<ConnectionRow mark={done ? "ok" : "waiting"} name="1688 登录" meta={[done ? "「办公室」里登录着" : "「办公室」里未登录"]} />
			</ConnectionCard>
			{done && (
				<Button variant="ghost" size="xs" className="w-fit" onClick={() => setStep("out")}>
					再来一次
				</Button>
			)}
		</div>
	);
}

/** Not connected yet: the button opens the steps */
function NoBrowser() {
	const [open, setOpen] = useState(false);
	const steps = ["在 Chrome 的地址栏里打开 chrome://extensions", "打开右上角的「开发者模式」", "点「加载已解压的扩展程序」，选扩展的文件夹", "连上以后会出现在这里：给它起个名字，点「授权」"];
	return (
		<ConnectionCard
			icon={<AppWindow />}
			name="Chrome 浏览器"
			status="未连接"
			description="读 1688 货源、在卖家中心做接口做不了的事：用你登录着的 Chrome"
			action={
				!open && (
					<Button size="sm" onClick={() => setOpen(true)}>
						连接浏览器
					</Button>
				)
			}
			open={open}
			onOpenChange={setOpen}
			footer={
				<ol className="flex flex-col gap-2 px-2 py-1.5 text-xs">
					{steps.map((x, i) => (
						<li key={x} className="grid grid-cols-[1rem_1fr] gap-2">
							<span className="text-muted-foreground tabular-nums">{i + 1}</span>
							{x}
						</li>
					))}
				</ol>
			}
		/>
	);
}
