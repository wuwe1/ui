// Components and their states on the showcase. State names match States in docs/components/<file>.md.
import { AppWindow, Bell, MoveUpRight, CircleAlert, FileText, GitFork, Globe, Hand, Inbox, ListChecks, Pencil, Plus, Search, Sparkles, SquarePen, SquareTerminal, Store, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../src/components/alert.tsx";
import { ApprovalCard, type ApprovalStatus } from "../src/components/approval-card.tsx";
import { Badge } from "../src/components/badge.tsx";
import { Button } from "../src/components/button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../src/components/card.tsx";
import { ContextWindow, type ContextPart } from "../src/components/context-window.tsx";
import { Composer } from "../src/components/composer.tsx";
import { ComposerSettings } from "../src/components/composer-settings.tsx";
import { DictationButton, useDictation } from "../src/components/dictation.tsx";
import { ConnectionCard, type ConnectionMark, ConnectionNote, ConnectionRow } from "../src/components/connection-card.tsx";
import { DataGrid, type DataGridColumn, type DataGridRow, type DataGridSelection, type DataGridTone } from "../src/components/data-grid.tsx";
import { type Decision, type DecisionAnswer, DecisionInbox, type DecisionOption } from "../src/components/decision-inbox.tsx";
import { Elapsed } from "../src/components/elapsed.tsx";
import { Inbox as AgentInbox, InboxEmpty, type InboxItem, type InboxStatus } from "../src/components/inbox.tsx";
import { Input } from "../src/components/input.tsx";
import { Outline, useInView } from "../src/components/outline.tsx";
import { InlineDiff, type DiffDecision } from "../src/components/inline-diff.tsx";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../src/components/input-group.tsx";
import { Kbd } from "../src/components/kbd.tsx";
import { type MatchDecision, type MatchPair, MatchReview } from "../src/components/match-review.tsx";
import { MemoryPanel, type MemoryGroup, type MemoryItem } from "../src/components/memory-panel.tsx";
import { MessageQueue, type QueuedMessage } from "../src/components/message-queue.tsx";
import { NotificationStack, type Notice } from "../src/components/notification-stack.tsx";
import { CopyAction, MessageActions, MessageActionsQuiet, MessageMenu, TurnStats, type TurnFile } from "../src/components/message-actions.tsx";
import { Loading, Placeholder } from "../src/components/placeholder.tsx";
import { Popsheet } from "../src/components/popsheet.tsx";
import { PromptLibrary, type PromptTemplate } from "../src/components/prompt-library.tsx";
import { type SegmentOption, SegmentedControl } from "../src/components/segmented-control.tsx";
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
import { type UsageAccount, UsageMeter, UsageSummary, type UsageWindow } from "../src/components/usage-meter.tsx";
import { cn } from "../src/lib/utils.ts";

export type Story = { name: string; render: () => ReactNode };

/** The sidebar: pages by group. A page missing here still shows, under Other */
export const NAV: { label: string; pages: string[] }[] = [
	{ label: "Foundations", pages: ["Theme"] },
	{ label: "Navigation", pages: ["Outline"] },
	{ label: "Agent", pages: ["Composer", "MessageQueue", "ComposerSettings", "PromptLibrary", "Inbox", "ThinkingLoader", "ToolCallGroup", "ToolCall", "ApprovalCard", "ContextWindow", "UsageMeter", "MessageActions", "ConnectionCard", "MemoryPanel", "MatchReview", "InlineDiff", "DecisionInbox"] },
	{ label: "Data", pages: ["DataGrid"] },
	{ label: "Notifications", pages: ["Toast", "NotificationStack"] },
	{ label: "Status and loading", pages: ["StatusIcon", "Shimmer", "Skeleton", "Spinner", "Placeholder"] },
	{ label: "Base", pages: ["Button", "Badge", "Input", "SegmentedControl", "Tabs", "Card", "Alert", "Feedback"] },
];

const row = "flex flex-wrap items-center gap-2";
const col = "flex flex-col gap-3";

const VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;
const SIZES = ["xs", "sm", "default", "lg"] as const;
const MARKS: Mark[] = ["waiting", "running", "background", "done", "error", "terminal", "ok", "failed", "off"];

export const STORIES: Record<string, Story[]> = {
	SegmentedControl: [
		{ name: "Default", render: () => <Seg options={VIEWS} /> },
		{ name: "With icons", render: () => <Seg options={TOOLS} /> },
		{ name: "With counts", render: () => <SegCounts /> },
		{ name: "Sizes", render: () => <div className={col}><Seg size="sm" options={VIEWS} /><Seg options={VIEWS} /></div> },
		{ name: "Full width", render: () => <SegFull /> },
		{ name: "Disabled", render: () => <div className={col}><Seg options={[...VIEWS.slice(0, 2), { ...VIEWS[2]!, disabled: true }]} /><Seg options={VIEWS} disabled /></div> },
		{ name: "Tabs", render: () => <SegTabs /> },
		{ name: "Too many to fit", render: () => <div className="w-[240px]"><Seg size="sm" options={SEG_GROUPS} /></div> },
		{ name: "Dimmed", render: () => <Seg size="sm" options={SEG_GROUPS.map((g) => (g.count === 0 ? { ...g, dim: true } : g))} /> },
		{ name: "Nothing picked", render: () => <Seg options={VIEWS} start="" /> },
	],
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
	Composer: [
		{ name: "Empty", render: () => <Compose /> },
		{ name: "Typed", render: () => <Compose text={"把 Composer 搬进组件库\n先看懂，再重新设计"} /> },
		{ name: "Running", render: () => <Compose running /> },
		{ name: "Stopping", render: () => <Compose running stopping /> },
		{ name: "Sending", render: () => <Compose text="提交吧" busy /> },
		{ name: "Hearing", render: () => <Compose text="把首页标题" interim="改成 Inbox 然后" /> },
		{ name: "Attachments", render: () => <Compose text="看看这两张" attachments /> },
		{ name: "Queued", render: () => <Queue n={2} /> },
		{ name: "Dialog", render: () => <Compose size="lg" /> },
	],
	MessageQueue: [
		{ name: "One", render: () => <Queue n={1} /> },
		{ name: "Several", render: () => <Queue n={3} /> },
		{ name: "Open", render: () => <Queue n={3} open /> },
		{ name: "Long", render: () => <Queue n={2} open from={1} /> },
		{ name: "Pictures", render: () => <Queue n={2} from={2} /> },
		{ name: "Many", render: () => <Queue n={6} /> },
		{ name: "Live", render: () => <Queue n={2} live /> },
	],
	ComposerSettings: [
		{ name: "Default", render: () => <Settings /> },
		{ name: "Not the defaults", render: () => <Settings model="claude-opus-4-8" effort="high" permission="plan" /> },
		{ name: "No effort", render: () => <Settings model="haiku" /> },
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
	UsageMeter: [
		{ name: "Loading", render: () => <Usage accounts={null} /> },
		{ name: "Default", render: () => <Usage accounts={[claude([five(0.43, 1.6 * HOUR), week(0.56)])]} /> },
		{ name: "Near the limit", render: () => <Usage accounts={[claude([five(0.84, 0.5 * HOUR), week(0.62)])]} /> },
		{ name: "Runs out early", render: () => <Usage accounts={[claude([five(0.64, 3 * HOUR), week(0.58)])]} /> },
		{ name: "Used up", render: () => <Usage accounts={[claude([five(1, 0.8 * HOUR), week(0.71)])]} /> },
		{ name: "Reset", render: () => <Usage accounts={[claude([five(0.43, -0.2 * HOUR), week(0.56)], 25 * MIN)]} /> },
		{ name: "Stale", render: () => <Usage accounts={[claude([five(0.31, 2.5 * HOUR), week(0.52)], 2 * HOUR)]} /> },
		{ name: "Refresh", render: () => <Usage accounts={[claude([five(0.43, 1.6 * HOUR), week(0.56)], 12 * MIN)]} refresh="ok" /> },
		{ name: "Refresh failed", render: () => <Usage accounts={[claude([five(0.43, 1.6 * HOUR), week(0.56)], 12 * MIN)]} refresh="fail" /> },
		{ name: "Spend", render: () => <Usage accounts={[claude([five(0.43, 1.6 * HOUR), week(0.56)]), PI]} /> },
		{ name: "Many", render: () => <Usage accounts={[claude([five(0.43, 1.6 * HOUR), week(0.56)]), { ...claude([five(0.12, 4 * HOUR), week(0.3)]), id: "work", label: "Claude › 公司", plan: "Team" }, PI]} /> },
		{ name: "Long", render: () => <div className="w-[260px]"><Usage accounts={[{ ...claude([five(0.64, 3 * HOUR), { ...week(0.58), label: "本周（所有模型，含 Claude Code）" }]), label: "Claude › 一个很长的组织名字" }, { ...PI, table: { columns: ["今天", "本月"], rows: [{ label: "openrouter-anthropic-claude", values: ["$12.40", "$1,284.06"] }] } }]} /></div> },
		{ name: "Empty", render: () => <Usage accounts={[]} /> },
		{ name: "In the sidebar", render: () => <UsageInSidebar /> },
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
	MatchReview: [
		{ name: "Default", render: () => <Matches pairs={[MR_P3, MR_P1, MR_P2, ...MR_SURE]} /> },
		{ name: "Conflict", render: () => <Matches pairs={MR_PAIRS} /> },
		{ name: "All reviewed", render: () => <Matches pairs={MR_SURE} /> },
		{ name: "Settled", render: () => <MatchReview pairs={MR_PAIRS} decisions={MR_DECIDED} label={MR_LABEL} columns={MR_COLUMNS} signals={MR_SIGNALS} /> },
		{ name: "No images", render: () => <Matches pairs={MR_PAIRS.map(plain)} /> },
		{ name: "Loading", render: () => <MatchReview pairs={null} label={MR_LABEL} /> },
		{ name: "Empty", render: () => <Matches pairs={[]} /> },
		{ name: "Long", render: () => <Matches pairs={MR_LONG} /> },
	],
	PromptLibrary: [
		{ name: "Default", render: () => <Prompts /> },
		{ name: "Filling", render: () => <Act run={(el) => el.querySelector<HTMLInputElement>("p input")?.focus()}><Prompts /></Act> },
		{ name: "Ready", render: () => <Prompts defaultValue="ship" /> },
		{ name: "Search", render: () => <Act run={(el) => type(el.querySelector('input[aria-label^="搜索"]'), "界面")}><Prompts /></Act> },
		{ name: "Editing", render: () => <Act run={(el) => click(el, 'button[aria-label^="编辑"]')}><Prompts defaultValue="polish" /></Act> },
		{ name: "New", render: () => <Act run={(el) => click(el, 'button[aria-label^="新建"]')}><Prompts /></Act> },
		{ name: "Saving", render: () => <Act run={(el) => { click(el, 'button[aria-label^="编辑"]'); setTimeout(() => press(el, "保存"), 50); }}><Prompts hang /></Act> },
		{ name: "Deleted", render: () => <Act run={(el) => { click(el, 'button[aria-label^="编辑"]'); setTimeout(() => press(el, "删除"), 50); }}><Prompts defaultValue="bug" /></Act> },
		{ name: "Read only", render: () => <PromptLibrary templates={PL} onUse={(p) => toast("已放进输入框", { description: p })} /> },
		{ name: "Empty", render: () => <Prompts initial={[]} /> },
		{ name: "Loading", render: () => <PromptLibrary templates={null} /> },
		{ name: "Long", render: () => <Prompts initial={PL_LONG} defaultValue="listing" /> },
		{ name: "Narrow", render: () => <div className="max-w-[360px]"><Prompts /></div> },
	],
	DataGrid: [
		{ name: "Default", render: () => <Grid /> },
		{ name: "Grouped", render: () => <Grid rows={DG_GROUPED} group /> },
		{ name: "Collapsed", render: () => <Grid rows={DG_GROUPED} group collapsed={["缺货源", "待 1688 付款"]} start={{ rows: DG_GROUPED.filter((r) => r.step === "缺货源").map((r) => r.id) }} /> },
		{ name: "Rows selected", render: () => <Grid start={{ rows: DG_ROWS.slice(1, 4).map((r) => r.id) }} /> },
		{ name: "Block selected", render: () => <Grid start={{ rows: DG_ROWS.slice(2, 4).map((r) => r.id), columns: ["item", "step"] }} /> },
		{ name: "Columns selected", render: () => <Grid start={{ rows: DG_ROWS.map((r) => r.id), columns: ["step"] }} /> },
		{ name: "Loading", render: () => <Grid rows={null} height="" /> },
		{ name: "Empty", render: () => <Grid rows={[]} height="" empty="订单都处理完了" /> },
		{ name: "Long", render: () => <Grid rows={DG_LONG} columns={DG_WIDE} /> },
		{ name: "Many", render: () => <Grid rows={DG_MANY} group /> },
		{ name: "No images", render: () => <Grid columns={DG_COLUMNS.filter((c) => c.type !== "image")} /> },
		{ name: "Narrow", render: () => <div className="w-[390px] max-w-full"><Grid /></div> },
	],
	InlineDiff: [
		{ name: "Default", render: () => <Edits a={COPY_A} b={COPY_B} ask="改短一点" /> },
		{ name: "Deciding", render: () => <Act run={(el) => el.querySelectorAll<HTMLElement>("[data-change]")[1]?.focus()}><Edits a={COPY_A} b={COPY_B} ask="改短一点" /></Act> },
		{ name: "All reviewed", render: () => <Act run={(el) => press(el, "全部接受")}><Edits a={COPY_A} b={COPY_B} ask="改短一点" /></Act> },
		{ name: "Settled", render: () => <InlineDiff original={COPY_A} suggested={COPY_B} decisions={COPY_DECIDED} label={<Asked ask="改短一点" />} /> },
		{ name: "Read only", render: () => <InlineDiff original={DOC_A} suggested={DOC_B} label="docs/product.md" readOnly /> },
		{ name: "Writing", render: () => <InlineDiff original={PROMPT_A} suggested={null} label={<Asked ask="让它更像台湾的店" />} /> },
		{ name: "No changes", render: () => <InlineDiff original={COPY_B} suggested={COPY_B} label={<Asked ask="改短一点" />} /> },
		{ name: "Long", render: () => <div className="max-h-[420px] overflow-y-auto rounded-2xl"><Edits a={PROMPT_LONG_A} b={PROMPT_LONG_B} ask="让它更像台湾的店" /></div> },
		{ name: "Prompt", render: () => <Edits a={PROMPT_A} b={PROMPT_B} ask="让它更像台湾的店" /> },
		{ name: "English", render: () => <Edits a={EN_A} b={EN_B} ask="Make it shorter" /> },
	],
	DecisionInbox: [
		{ name: "Default", render: () => <Decide decisions={DI_MEMORY} /> },
		{ name: "Answered", render: () => <Act run={(el) => keys(el, ["2", "1", "2"])}><Decide decisions={DI_MEMORY} /></Act> },
		{ name: "Note", render: () => <Act run={(el) => click(el, '[data-option="edit"]')}><Decide decisions={DI_MEMORY} /></Act> },
		{ name: "All reviewed", render: () => <Act run={(el) => press(el, "采纳其余建议")}><Decide decisions={DI_MEMORY} /></Act> },
		{ name: "Settled", render: () => <DecisionInbox decisions={DI_MEMORY} answers={DI_SETTLED} label={DI_LABEL} /> },
		{ name: "No proposals", render: () => <Decide decisions={DI_PLAIN} label="发布前要你定" /> },
		{ name: "Final answers", render: () => <DecisionInbox decisions={DI_OPS} label="发布前要你定" onDecide={(a) => toast(`已${DI_OPS.find((d) => d.id === a.decision)?.options.find((o) => o.id === a.option)?.label}`, { description: DI_OPS.find((d) => d.id === a.decision)?.title })} /> },
		{ name: "Loading", render: () => <DecisionInbox decisions={null} label={DI_LABEL} /> },
		{ name: "Empty", render: () => <Decide decisions={[]} /> },
		{ name: "Long", render: () => <Decide decisions={DI_LONG} /> },
		{ name: "Many", render: () => <Decide decisions={DI_MANY} label="清理依赖：30 个没用到的包" /> },
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

/** A product photo stand-in: a soft tile with a shape and a mark – no network */
const tile = (hue: number, mark: string) =>
	`data:image/svg+xml;utf8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="hsl(${hue} 45% 88%)"/><circle cx="24" cy="21" r="11" fill="hsl(${hue} 42% 62%)"/><text x="24" y="43" font-size="9" text-anchor="middle" fill="hsl(${hue} 30% 32%)" font-family="sans-serif">${mark}</text></svg>`,
	)}`;
const at = (s: string, t: string): [number, number] => {
	const i = s.indexOf(t);
	return [i, i + t.length];
};
/** Links between two labels from pairs of words: [left word, right word, matched?] */
const linked = (l: string, r: string, words: [string, string, boolean?][]) =>
	words.filter(([a, b]) => l.includes(a) && r.includes(b)).map(([a, b, ok = true]) => ({ left: at(l, a), right: at(r, b), ok }));
const sku = (id: string, label: string, hue: number, mark: string) => ({ id, label, image: tile(hue, mark) });
const MR_LABEL = "规格对照：kitty 猫硅藻泥地垫";
const MR_COLUMNS: [string, string] = ["店里的规格", "1688 规格"];
const MR_SIGNALS = [
	{ id: "text", label: "文字" },
	{ id: "image", label: "图" },
];
const K = {
	k3: sku("k3", "kitty猫款式3 60*90cm", 200, "3"),
	k4: sku("k4", "kitty猫款式4 60*90cm", 140, "4"),
	k5: sku("k5", "kitty猫款式5 60*90cm", 340, "5"),
	k6: sku("k6", "kitty猫款式6 60*90cm", 30, "6"),
	k8: sku("k8", "kitty猫款式8 60*90cm", 260, "8"),
	w100: sku("w100", "特粗26管【双杆】100白色+移动轮", 50, "W"),
	b150: sku("b150", "特粗26管【双杆】150黑色+移动轮", 220, "B"),
};
const SIZE: [string, string][] = [["60*90", "60*90"]];
const RACK = (n: string, c: string): [string, string, boolean?][] => [["雙桿", "双杆"], ["150", n, n === "150"], ["白", c, c === "白"], ["輪", "轮"]];
const cand = (left: string, item: (typeof K)[keyof typeof K], scores: Record<string, number>, words: [string, string, boolean?][]) => ({ item, scores, links: linked(left, item.label, words) });
const MR_P1: MatchPair = {
	id: "p1",
	left: { id: "l1", label: "03,60*90", image: tile(340, "5") },
	right: K.k5,
	links: linked("03,60*90", K.k5.label, SIZE),
	confidence: "unsure",
	candidates: [cand("03,60*90", K.k5, { text: 0.36, image: 0.97 }, SIZE), cand("03,60*90", K.k3, { text: 0.36, image: 0.41 }, SIZE), cand("03,60*90", K.k8, { text: 0.36, image: 0.37 }, SIZE)],
};
const MR_P2: MatchPair = {
	id: "p2",
	left: { id: "l2", label: "04,60*90", image: tile(30, "6") },
	right: K.k5,
	links: linked("04,60*90", K.k5.label, SIZE),
	confidence: "unsure",
	candidates: [cand("04,60*90", K.k5, { text: 0.36, image: 0.64 }, SIZE), cand("04,60*90", K.k6, { text: 0.36, image: 0.61 }, SIZE), cand("04,60*90", K.k4, { text: 0.36, image: 0.3 }, SIZE)],
};
const MR_P3: MatchPair = {
	id: "p3",
	left: { id: "l3", label: "雙桿150白+輪", image: tile(50, "W") },
	right: K.w100,
	links: linked("雙桿150白+輪", K.w100.label, RACK("100", "白")),
	confidence: "unsure",
	note: "缺 150",
	candidates: [cand("雙桿150白+輪", K.w100, { text: 0.71, image: 0.24 }, RACK("100", "白")), cand("雙桿150白+輪", K.b150, { text: 0.64, image: 0.19 }, RACK("150", "黑"))],
};
const MR_SURE: MatchPair[] = [
	["s1", "雙桿150黑+輪", K.b150, [["雙桿", "双杆"], ["150", "150"], ["黑", "黑"], ["輪", "轮"]]] as const,
	["s2", "01,40*60", sku("k1", "kitty猫款式1 40*60cm", 100, "1"), [["40*60", "40*60"]]] as const,
	["s3", "07,80*120", sku("k7", "kitty猫款式7 80*120cm", 300, "7"), [["80*120", "80*120"]]] as const,
].map(([id, label, right, words]) => ({ id, left: { id: `${id}l`, label, image: right.image }, right, links: linked(label, right.label, words as unknown as [string, string][]), confidence: "sure" as const }));
const MR_PAIRS = [MR_P1, MR_P2, MR_P3, ...MR_SURE];
const MR_DECIDED: MatchDecision[] = [
	{ pair: "p1", right: "k5", proposed: "k5" },
	{ pair: "p2", right: "k6", proposed: "k5" },
	{ pair: "p3", right: null, proposed: "w100" },
	...MR_SURE.map((p) => ({ pair: p.id, right: p.right?.id ?? null, proposed: p.right?.id ?? null })),
];
const plain = (p: MatchPair): MatchPair => ({
	...p,
	left: { id: p.left.id, label: p.left.label },
	right: p.right && { id: p.right.id, label: p.right.label },
	candidates: p.candidates?.map((c) => ({ ...c, item: { id: c.item.id, label: c.item.label } })),
});
const MR_LONG: MatchPair[] = [MR_P2, MR_P1].map((p) => ({
	...p,
	left: { ...p.left, label: `${p.left.label} 加厚款｜浴室门口吸水速干防滑脚踏垫 免洗` },
	right: p.right && { ...p.right, label: `${p.right.label}（硅藻泥软垫，卡通图案，家用入户卫生间）` },
}));

const DI_LABEL = "清理 memory：mixer 项目";
const DI_OPTIONS: DecisionOption[] = [
	{ id: "keep", label: "保留" },
	{ id: "drop", label: "删除" },
	{ id: "edit", label: "修改", note: "改成什么" },
];
const DI_MEMORY: Decision[] = [
	{
		id: "ux",
		title: "UX Writing 统一",
		detail: "界面文字不口语化，照一套规范写",
		proposed: "drop",
		reason: "规范已写进 docs/writing.md，这条只剩重复",
		more: "界面上的文字不要口语化（例：「画不出来」「正在画」），要有一套统一的 UX Writing 规范，所有界面文字照它写。\n\nWhy：口语化的说法不该出现在界面上。\nHow to apply：规范写在 docs/writing.md 的 UI copy 一节，新写的界面文字照它写。",
		options: DI_OPTIONS,
	},
	{ id: "zh", title: "回复用中文", detail: "回复、进度说明、提问都用中文", proposed: "keep", reason: "每个会话都用得上，别处没写", options: DI_OPTIONS },
	{ id: "roadmap", title: "图解的路线", detail: "chart、block、canvas 三种图解的进度", proposed: "edit", reason: "三种都做完了，进度可以删，只留结论", options: DI_OPTIONS },
	{ id: "pkill", title: "别用 pkill 按模式杀进程", detail: "只按记下的 PID 或端口杀", proposed: "keep", reason: "误杀过一次，代价大", options: DI_OPTIONS },
	{ id: "route", title: "page.route 会关掉缓存", detail: "测缓存时别用它，在服务前面放个记请求的代理", proposed: "keep", reason: "文档里不显眼，踩过一次", options: DI_OPTIONS },
	{ id: "terms", title: "术语用英文", detail: "hover、focus、toast 直接写英文，不硬译", proposed: "keep", reason: "写回复、文档都用得上", options: DI_OPTIONS },
];
const DI_SETTLED: DecisionAnswer[] = [
	{ decision: "ux", option: "drop", proposed: "drop" },
	{ decision: "zh", option: "keep", proposed: "keep" },
	{ decision: "roadmap", option: "edit", note: "只留三种图解的结论，进度删掉", proposed: "edit" },
	{ decision: "pkill", option: "keep", proposed: "keep" },
	{ decision: "route", option: "drop", proposed: "keep" },
	{ decision: "terms", option: "keep", proposed: "keep" },
];
const DI_OPS: Decision[] = [
	{ id: "pg", title: "把 staging 的数据库升到 Postgres 17？", detail: "迁移在 staging 的副本上跑过，用时 4 分钟", options: [{ id: "go", label: "升级" }, { id: "wait", label: "先不升" }], proposed: "go", reason: "副本上的测试全部通过" },
	{ id: "issues", title: "关闭 14 个 90 天没动的 issue？", detail: "都没有关联的 PR，最近一条评论在 3 月", options: [{ id: "close", label: "关闭" }, { id: "keep", label: "保留" }], proposed: "close", reason: "关闭后还能重新打开" },
	{ id: "tag", title: "给 #512 打 v2.3.0？", detail: "CHANGELOG 已写好，CI 通过", options: [{ id: "tag", label: "打 tag" }, { id: "wait", label: "再等等" }] },
];
const DI_PLAIN: Decision[] = DI_OPS.map(({ id, title, detail, options }) => ({ id, title, detail, options }));
const DI_LONG: Decision[] = [
	{
		...DI_MEMORY[0]!,
		title: "UX Writing 统一：界面文字不口语化、照一套规范写，新写的按钮、状态、空状态和错误都照它",
		detail: "界面上的文字不要口语化（例：「画不出来」「正在画」），要有一套统一的规范；发给 Claude 的段落不算界面文字，不受这条约束",
		reason: "规范已经写进 docs/writing.md 的 UI copy 一节，有改前改后的例子，这条 memory 只剩重复，留着反而可能和规范对不上",
		more: Array.from({ length: 6 }, (_, i) => `第 ${i + 1} 段：${"按钮 2–6 个字、动词在前，状态写「已 X」「X 中」，空状态写「暂无 X」再加一行说明。".repeat(2)}`).join("\n\n"),
	},
	...DI_MEMORY.slice(1, 3).map((d) => ({ ...d, title: `${d.title}：${d.detail}，再加长一点看一行放不下时怎么截断` })),
];
const DI_PACKAGES = ["lodash", "moment", "left-pad", "request", "colors", "uuid", "classnames", "axios", "node-fetch", "chalk", "debug", "rimraf", "mkdirp", "glob", "minimist", "yargs", "commander", "dotenv", "cross-env", "nodemon", "concurrently", "husky", "lint-staged", "prettier", "eslint-plugin-import", "babel-eslint", "core-js", "regenerator-runtime", "whatwg-fetch", "es6-promise"];
const DI_MANY: Decision[] = DI_PACKAGES.map((p, i) => ({
	id: p,
	title: `删除没用到的依赖 ${p}？`,
	detail: `代码里没有 import，最后一次用到是 ${i + 2} 个月前`,
	options: [{ id: "drop", label: "删除" }, { id: "keep", label: "保留" }],
	proposed: "drop",
	reason: "装着只会拖慢安装",
}));
/** An inbox wired like a host: 「完成」 hands the answers back after a moment */
function Decide({ decisions, label = DI_LABEL }: { decisions: Decision[]; label?: string }) {
	return <DecisionInbox decisions={decisions} label={label} onDone={(all) => new Promise((ok) => setTimeout(() => ok(toast.success("已交回答案", { description: `${all.length} 条` })), 800))} />;
}
/** Presses keys on the inbox one after another, each once the last answer has folded */
const keys = (el: HTMLElement, ks: string[]) =>
	ks.forEach((k, i) => setTimeout(() => el.querySelector('[data-slot="decision-inbox"]')?.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true })), i * 900));

/** A review wired like a host: 「完成」 saves for a moment, then the card is settled */
const DAY = 86_400_000;
/** Orders the way Penna shows them: what's in them, where each one waits, and whose turn it is */
const DG_ITEMS = [
	{ name: "卡通kitty貓硅藻泥地墊 入戶門衛生間防滑", spec: "03,60*90", hue: 340, mark: "墊", offer: "1045874691879" },
	{ name: "特粗雙桿移動式落地衣帽架 家用臥室陽台", spec: "特粗26管雙桿100黑+輪", hue: 30, mark: "架", offer: "998618382272" },
	{ name: "不鏽鋼登山扣磁鐵 旋轉掛鉤吸鐵石", spec: "L32銀色（最大拉力45kg）", hue: 210, mark: "扣", offer: "896904099831" },
	{ name: "磁吸手繩手機掛繩 編織手腕繩", spec: "（单规格）", hue: 120, mark: "繩", offer: "923574283809" },
	{ name: "門後洞洞板置物架 落地窄縫收納架", spec: "52×11.8×188 加厚款", hue: 260, mark: "板", offer: "860316641707" },
	{ name: "男士單肩斜挎包 簡約休閒旅行胸包", spec: "黑色", hue: 0, mark: "包", offer: "" },
];
const DG_STEPS: { step: string; note: string }[] = [
	{ step: "缺货源", note: "没填货源链接" },
	{ step: "规格不匹配", note: "「03,60*90」在货源里配不上" },
	{ step: "待加购", note: "" },
	{ step: "待 1688 付款", note: "" },
	{ step: "待预报", note: "" },
	{ step: "待到齐", note: "未到：衣帽架 / 100黑+輪" },
	{ step: "待打包", note: "" },
	{ step: "已打包", note: "" },
];
const DG_SHOPS = ["新新家居日用好物賣場", "Nydia’s shop✨家居好物"];
const dgTone = (v: unknown): DataGridTone | undefined =>
	v === "待到齐" ? "running" : v === "已打包" ? "done" : DG_STEPS.some((s) => s.step === v) ? "waiting" : undefined;
const DG_COLUMNS: DataGridColumn[] = [
	{ key: "sn", label: "订单号" },
	{ key: "image", label: "图", type: "image" },
	{ key: "item", label: "商品", maxWidth: 240 },
	{ key: "step", label: "当前步骤", type: "tag", tone: dgTone },
	{ key: "note", label: "说明", maxWidth: 320 },
	{ key: "days", label: "剩几天", type: "number" },
	{ key: "shop", label: "店铺" },
	{ key: "shipBy", label: "出货期限", type: "date" },
	{ key: "createdAt", label: "下单时间", type: "date" },
	{ key: "url", label: "货源链接", type: "link" },
	{ key: "forecast", label: "已预报", type: "check" },
];
const SN = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
const snOf = (n: number) => `2610${String(10 + (n % 7)).padStart(2, "0")}${Array.from({ length: 8 }, (_, i) => SN[(n * 7 + i * 13 + n * i) % SN.length]).join("")}`;
function dgRow(n: number, now = Date.now()): DataGridRow {
	const it = DG_ITEMS[n % DG_ITEMS.length]!;
	const st = DG_STEPS[(n * 3) % DG_STEPS.length]!;
	const days = 2 + ((n * 5) % 16);
	return {
		id: `o${n}`,
		sn: snOf(n),
		image: it.offer ? [tile(it.hue, it.mark), ...(n % 4 === 0 ? [tile(it.hue + 40, it.mark)] : [])] : [tile(it.hue, it.mark)],
		item: `${it.name} / ${it.spec} × ${1 + (n % 3)}`,
		step: st.step,
		note: st.note,
		days,
		shop: DG_SHOPS[n % 2],
		shipBy: now + days * DAY,
		createdAt: now - ((n * 37) % 11) * DAY - ((n * 53) % 9) * 3_600_000,
		url: it.offer ? `https://detail.1688.com/offer/${it.offer}.html?spm=a360q.8274423` : "",
		forecast: st.step === "待到齐" || st.step === "待打包" || st.step === "已打包",
	};
}
const DG_ROWS = Array.from({ length: 14 }, (_, n) => dgRow(n));
const byStep = (rows: DataGridRow[]) => [...rows].sort((a, b) => DG_STEPS.findIndex((s) => s.step === a.step) - DG_STEPS.findIndex((s) => s.step === b.step));
const DG_GROUPED = byStep(DG_ROWS);
const DG_MANY = byStep(Array.from({ length: 5000 }, (_, n) => dgRow(n)));
const DG_LONG = DG_ROWS.map((r, n) => ({
	...r,
	item: `${r.item}，這一行很長：商品名後面還跟著規格、數量、材質說明和賣家寫的一大段促銷文字，看它怎麼截斷`,
	note: n % 2 ? "「特粗26管【雙層側三網】150白色+移動輪」在货源「特粗雙桿移動式落地衣帽架 家用臥室陽台掛衣架 宿舍衣架」里配不上" : r.note,
	purchase: n % 3 ? "3048912773019844521、3048912773019844522" : "",
	chanboss: ["待处理", "已预报", "已打包"][n % 3],
	shopee: ["待出货", "已出货"][n % 2],
	problem: n === 5 ? "包裹破損，買家要求重寄" : "",
	readAt: Date.now() - n * 600_000,
}));
const DG_WIDE: DataGridColumn[] = [
	...DG_COLUMNS,
	{ key: "purchase", label: "采购单" },
	{ key: "chanboss", label: "chanboss 状态", type: "tag" },
	{ key: "shopee", label: "Shopee 状态", type: "tag" },
	{ key: "problem", label: "问题单" },
	{ key: "readAt", label: "读取时间", type: "date" },
];
/** What a host would make of the selection – here a line under the grid, in Penna a reference in the composer */
function picked(s: DataGridSelection, rows: DataGridRow[], columns: DataGridColumn[]) {
	if (!s) return "未选择";
	const names = (ids: string[]) => {
		const sns = ids.slice(0, 3).map((id) => String(rows.find((r) => r.id === id)?.sn ?? id));
		return ids.length > 3 ? `${sns.join("、")} 等 ${ids.length} 行` : sns.join("、");
	};
	if (!s.columns) return `已选 ${names(s.rows)}`;
	const cols = s.columns.map((k) => columns.find((c) => c.key === k)?.label ?? k).join("、");
	return s.rows.length === rows.length && rows.length > 1 ? `已选整列：${cols}` : `已选 ${names(s.rows)} 的 ${cols}`;
}
function Grid({
	rows = DG_ROWS,
	columns = DG_COLUMNS,
	start = null,
	group,
	collapsed,
	height = "h-[440px]",
	empty,
}: { rows?: DataGridRow[] | null; columns?: DataGridColumn[]; start?: DataGridSelection; group?: boolean; collapsed?: string[]; height?: string; empty?: string }) {
	const [selection, setSelection] = useState<DataGridSelection>(start);
	const sn = (id: string) => String(rows?.find((r) => r.id === id)?.sn ?? id);
	return (
		<div className="flex flex-col gap-2">
			<div className={height}>
				<DataGrid
					label="订单"
					columns={columns}
					rows={rows}
					group={group ? { key: "step" } : undefined}
					defaultCollapsed={collapsed}
					selection={selection}
					onSelectionChange={setSelection}
					onOpen={(id) => toast(`打开订单 ${sn(id)}`)}
					onLink={(url) => toast(`打开 ${url}`)}
					empty={empty}
				/>
			</div>
			{rows && rows.length > 0 && <p className="truncate px-1 text-xs text-muted-foreground">{picked(selection, rows, columns)}</p>}
		</div>
	);
}

function Matches({ pairs }: { pairs: MatchPair[] }) {
	return (
		<MatchReview
			pairs={pairs}
			label={MR_LABEL}
			columns={MR_COLUMNS}
			signals={MR_SIGNALS}
			onDone={(all) => new Promise((ok) => setTimeout(() => ok(toast.success(`已记下 ${all.filter((d) => d.right).length} 对`)), 800))}
		/>
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

/** A composer wired like a host would: ↵ sends (a toast), then it runs for 3 seconds with a tray and a stop */
function Compose({ text: t0 = "", running: r0 = false, stopping, busy, interim, attachments, size = "sm" }: { text?: string; running?: boolean; stopping?: boolean; busy?: boolean; interim?: string; attachments?: boolean; size?: "sm" | "lg" }) {
	const [text, setText] = useState(t0);
	const [running, setRunning] = useState(r0);
	const dictation = useDictation({ onText: (x) => setText((t) => t + x) });
	const send = () => {
		toast("已发送", { description: text });
		setText("");
		setRunning(true);
		setTimeout(() => setRunning(false), 3000);
	};
	return (
		<div className="flex min-h-40 flex-col justify-end">
			<Composer
				size={size}
				value={text}
				onValueChange={setText}
				onSubmit={send}
				placeholder={running ? "运行中，发送后排队…" : size === "lg" ? "要 Claude 做什么…" : "继续…"}
				tray={running ? <span className="flex items-center gap-1.5"><StatusIcon s="running" label={null} className="size-3.5" /><span className="text-foreground">{stopping ? "停止中" : "运行中"}</span><Elapsed since={Date.now()} /></span> : null}
				interim={interim ?? dictation.interim}
				top={attachments ? <div className="flex gap-1.5 px-1 pt-0.5">{["#c7d2fe", "#fde68a"].map((c) => <span key={c} className="size-14 rounded-lg border" style={{ background: c }} />)}</div> : null}
				start={<><Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label="添加"><Plus className="size-4" /></Button><Settings compact /></>}
				end={<><span className="px-1 text-2xs text-muted-foreground tabular-nums">62%</span><DictationButton dictation={dictation} /></>}
				send={{ label: "发送", disabled: !text.trim(), busy }}
				stop={running ? { onStop: () => setRunning(false), stopping: !!stopping } : undefined}
			/>
		</div>
	);
}

/** Shown in the thumbnails of queued messages – a screenshot, a sketch */
const SHOT = (fill: string, line: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='60'><rect width='80' height='60' fill='${fill}'/><rect x='8' y='9' width='40' height='7' rx='2' fill='${line}'/><rect x='8' y='24' width='62' height='4' rx='2' fill='${line}' opacity='.5'/><rect x='8' y='34' width='50' height='4' rx='2' fill='${line}' opacity='.5'/><rect x='8' y='44' width='56' height='4' rx='2' fill='${line}' opacity='.5'/></svg>`)}`;
const QUEUE: QueuedMessage[] = [
	{ id: "q1", text: "用 Postgres 16 的语法，生产还没升到 17" },
	{ id: "q2", text: "另外给 accounts.email 加唯一索引。迁移要能回滚，staging 上试跑时不能丢数据；跑完把 dry run 的输出贴给我看一下，我对一下行数和索引大小，没问题再开 PR" },
	{ id: "q3", text: "顺便看看 orders 表有没有外键指向 users" },
	{ id: "q4", text: "现在的表结构是这样的", images: [SHOT("#eceef1", "#99a1ad"), SHOT("#e8eef8", "#7f93b3")] },
	{ id: "q5", text: "先别动 billing 那几张表" },
	{ id: "q6", text: "PR 描述写中文" },
];

/** A composer while the agent runs, with messages waiting. live – buttons that play the agent picking them up */
function Queue({ n, from = 0, open, live }: { n: number; from?: number; open?: boolean; live?: boolean }) {
	const [items, setItems] = useState(() => QUEUE.slice(from, from + n));
	const [withdrawing, setWithdrawing] = useState<string[]>([]);
	const [text, setText] = useState("");
	const [since] = useState(() => Date.now() - 83_000);
	// Like a host: the server answers after a moment, then the message goes back in the input
	const withdraw = (m: QueuedMessage) => {
		setWithdrawing((w) => [...w, m.id]);
		setTimeout(() => {
			setItems((x) => x.filter((y) => y.id !== m.id));
			setWithdrawing((w) => w.filter((id) => id !== m.id));
			setText((t) => (t.trim() ? `${t.trimEnd()}\n\n${m.text}` : m.text));
		}, 300);
	};
	const send = () => {
		if (!text.trim()) return;
		setItems((x) => [...x, { id: crypto.randomUUID(), text: text.trim() }]);
		setText("");
	};
	return (
		<div className="flex min-h-64 flex-col justify-end gap-3">
			<Composer
				value={text}
				onValueChange={setText}
				onSubmit={send}
				placeholder="运行中，发送后排队…"
				tray={<span className="flex items-center gap-1.5"><StatusIcon s="running" label={null} className="size-3.5" /><span className="text-foreground">运行中</span><Elapsed since={since} /></span>}
				queue={items.length ? <MessageQueue items={items} withdrawing={withdrawing} onWithdraw={withdraw} defaultOpen={open} /> : null}
				onRecall={() => {
					const m = items.at(-1);
					if (m && !withdrawing.includes(m.id)) withdraw(m);
				}}
				start={<Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label="添加"><Plus className="size-4" /></Button>}
				send={{ label: "发送", disabled: !text.trim() }}
				stop={{ onStop: () => setItems([]), stopping: false }}
			/>
			{live && (
				<div className="flex flex-wrap items-center gap-1.5">
					<Button size="xs" variant="outline" disabled={!items.length} onClick={() => setItems([])}>Claude 读到</Button>
					<Button size="xs" variant="ghost" onClick={() => setItems(QUEUE.slice(0, 2))}>再来一次</Button>
				</div>
			)}
		</div>
	);
}

const MODELS = [
	{ value: "", label: "默认", description: "用 Claude Code 的设置" },
	{ value: "opus", label: "Opus 5.5", description: "当前：Opus 5.5" },
	{ value: "sonnet", label: "Sonnet 5.5", description: "Sonnet 最新版，有新版本时自动切换" },
	{ value: "haiku", label: "Haiku 5.5", description: "Haiku 最新版，有新版本时自动切换", badge: "新" },
];
const PINNED = [{ value: "claude-opus-4-8", label: "Opus 4.8" }, { value: "claude-sonnet-4-6", label: "Sonnet 4.6" }];
const EFFORT = [["", "默认"], ["low", "低"], ["medium", "中"], ["high", "高"], ["xhigh", "很高"]] as const;
const PERMS = [
	{ value: "auto", icon: Sparkles, label: "自动", description: "直接执行，有风险的才请求确认" },
	{ value: "default", icon: Hand, label: "每次询问", description: "改文件、运行命令前都请求确认" },
	{ value: "plan", icon: ListChecks, label: "计划", description: "只读不改，先出计划" },
];
/** The settings chip as mixer wires it; compact – inside a Composer story */
function Settings({ model: m0 = "opus", effort: e0 = "", permission: p0 = "auto", compact }: { model?: string; effort?: string; permission?: string; compact?: boolean }) {
	const [model, setModel] = useState(m0);
	const [effort, setEffort] = useState(e0);
	const [permission, setPermission] = useState(p0);
	const name = [...MODELS, ...PINNED].find((x) => x.value === model)?.label ?? model;
	const muted = [EFFORT.find(([v]) => v === effort && v)?.[1], permission !== "auto" && PERMS.find((x) => x.value === permission)?.label].filter(Boolean).join(" ");
	const chip = (
		<ComposerSettings
			summary={<>{name}{muted && <span className="ml-1 opacity-70">{muted}</span>}</>}
			sections={[
				{ id: "model", label: "模型", kind: "list", value: model, onChange: setModel, options: MODELS, more: { label: "更多版本", options: PINNED } },
				...(model === "haiku" ? [] : [{ id: "effort", label: "思考强度", kind: "segmented" as const, value: effort || "default", onChange: (v: string) => setEffort(v === "default" ? "" : v), options: EFFORT.map(([v, l]) => ({ value: v || "default", label: l })) }]),
				{ id: "permission", label: "权限", kind: "segmented", value: permission, onChange: setPermission, options: PERMS },
			]}
		/>
	);
	return compact ? chip : <div className="flex min-h-12 items-end">{chip}</div>;
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

/** SegmentedControl as hosts use it: the pick lives with the host */
const VIEWS: SegmentOption[] = [{ value: "preview", label: "预览" }, { value: "source", label: "源码" }, { value: "diff", label: "改动" }];
const TOOLS: SegmentOption[] = [{ value: "arrow", label: "箭头", icon: MoveUpRight }, { value: "pen", label: "画笔", icon: Pencil }];
const SEG_GROUPS: SegmentOption[] = [["all", "全部", 12], ["user", "user", 3], ["feedback", "feedback", 5], ["project", "project", 4], ["reference", "reference", 0]].map(([value, label, count]) => ({ value: String(value), label: String(label), count: Number(count) }));

function Seg({ options, size, disabled, start }: { options: SegmentOption[]; size?: "sm" | "md"; disabled?: boolean; start?: string }) {
	const [v, setV] = useState(start ?? options[1]?.value ?? "");
	return <SegmentedControl aria-label="查看方式" size={size} options={options} value={v} onChange={setV} disabled={disabled} />;
}

/** A count that changes: the option widens and the pill follows at once */
function SegCounts() {
	const [v, setV] = useState("changes");
	const [n, setN] = useState(3);
	const panels: SegmentOption[] = [{ value: "files", label: "文件" }, { value: "changes", label: "改动", count: n, title: `这个会话有 ${n} 个文件未提交` }, { value: "memory", label: "Memory" }, { value: "exploit", label: "exploit", count: 4 }];
	return (
		<div className={row}>
			<SegmentedControl size="sm" kind="tabs" aria-label="面板" options={panels} value={v} onChange={setV} />
			<Button variant="ghost" size="xs" onClick={() => setN((x) => (x >= 120 ? 1 : x * 7))}>改动数变了</Button>
		</div>
	);
}

/** Thinking effort in a settings panel: equal segments, the pick's description under it */
function SegFull() {
	const opts: SegmentOption[] = [{ value: "default", label: "默认", title: "用 Claude Code 的设置" }, { value: "low", label: "低" }, { value: "medium", label: "中" }, { value: "high", label: "高" }, { value: "xhigh", label: "很高" }, { value: "max", label: "最高" }];
	const [v, setV] = useState("default");
	return (
		<div className="flex w-[300px] flex-col gap-1.5 rounded-xl border bg-popover p-3">
			<span className="text-xs text-muted-foreground">思考强度</span>
			<SegmentedControl fullWidth aria-label="思考强度" options={opts} value={v} onChange={setV} />
			{v === "default" && <span className="px-1 text-xs text-muted-foreground">用 Claude Code 的设置</span>}
		</div>
	);
}

/** kind="tabs": each option controls a panel, and the panel names itself after its tab */
function SegTabs() {
	const [v, setV] = useState("files");
	return (
		<div className={col}>
			<SegmentedControl kind="tabs" id="story-tabs" aria-label="项目" value={v} onChange={setV} options={[{ value: "files", label: "文件", controls: "story-tabs-files-panel" }, { value: "changes", label: "改动", count: 3, controls: "story-tabs-changes-panel" }]} />
			<div role="tabpanel" id={`story-tabs-${v}-panel`} aria-labelledby={`story-tabs-${v}`} className="rounded-lg border p-3 text-sm text-muted-foreground">
				{v === "files" ? "文件列表" : "改动列表"}
			</div>
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

/** Usage as mixer feeds it: Claude's two windows, relative to now; refreshing takes 1.2s */
const HOUR = 60 * MIN;
const NOTE = "每 10 分钟从本机的 claude 获取一次，含终端里的用量；在 mixer 里运行时实时更新";
const five = (used: number, left: number): UsageWindow => ({ label: "5 小时", used, resetsAt: Date.now() + left, span: 5 * HOUR });
const week = (used: number): UsageWindow => ({ label: "本周", used, resetsAt: Date.now() + 40.6 * HOUR, span: 7 * 24 * HOUR });
const claude = (windows: UsageWindow[], ago = 4 * MIN): UsageAccount => ({ id: "claude", label: "Claude", plan: "Max", windows, at: Date.now() - ago, note: NOTE });
const PI: UsageAccount = { id: "pi", label: "pi", table: { columns: ["今天", "本月"], rows: [{ label: "deepseek", values: ["$0.39", "$3.79 / $20"], share: 0.19 }, { label: "openrouter", values: ["$0.05", "$1.25"] }] } };

function Usage({ accounts, refresh }: { accounts: UsageAccount[] | null; refresh?: "ok" | "fail" }) {
	const [list, setList] = useState(accounts);
	const onRefresh = refresh
		? (id: string) =>
				new Promise<void>((ok, no) =>
					setTimeout(() => {
						if (refresh === "fail") return no(new Error("claude 退出了"));
						setList((l) => l?.map((a) => (a.id === id ? { ...a, at: Date.now() } : a)) ?? l);
						ok();
					}, 1200),
				)
		: undefined;
	return (
		<div className="flex w-full max-w-[340px] flex-col gap-3">
			<div className="rounded-xl border bg-sidebar p-1.5">
				<UsageSummary accounts={list} />
			</div>
			<UsageMeter accounts={list} onRefresh={onRefresh} />
		</div>
	);
}

/** The way a host wires it: the summary opens the meter in a bare Popsheet */
function UsageInSidebar() {
	const accounts = [claude([five(0.64, 3 * HOUR), week(0.58)]), PI];
	return (
		<div className="w-60 rounded-xl border bg-sidebar p-1.5">
			<Popsheet trigger={<UsageSummary accounts={accounts} />} title="用量" side="right" align="end" bare className="max-h-[80svh] w-80">
				<UsageMeter accounts={accounts} onRefresh={() => new Promise((ok) => setTimeout(ok, 1200))} />
			</Popsheet>
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

/** Runs a step on the story once it's on screen – focus a blank, type a search, open the editor */
function Act({ run, children }: { run: (el: HTMLElement) => void; children: ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const t = setTimeout(() => ref.current && run(ref.current), 80);
		return () => clearTimeout(t);
	}, []);
	return <div ref={ref}>{children}</div>;
}
const click = (el: HTMLElement, sel: string) => el.querySelector<HTMLElement>(sel)?.click();
const press = (el: HTMLElement, text: string) => [...el.querySelectorAll("button")].find((b) => b.textContent?.trim() === text)?.click();
/** Types into a controlled field: React only hears the native setter plus an input event */
function type(input: HTMLInputElement | null, text: string) {
	if (!input) return;
	Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, text);
	input.dispatchEvent(new Event("input", { bubbles: true }));
	input.focus();
}

const PL: PromptTemplate[] = [
	{ id: "handoff", title: "接手项目", group: "交接", body: "你接手 {项目}：{路径}。先读仓库里的 AGENTS.md、README.md 和 docs/，跑一遍 check、test，再告诉我现在的状况和你打算先做什么。", variables: { 项目: { description: "项目名，例 Penna" }, 路径: { description: "仓库在这台电脑上的路径" } } },
	{ id: "polish", title: "抠界面细节", group: "界面", body: "UI 细节抠一下：{哪里}有问题，再找找别的地方有没有同样的问题。改完截图看过，宽度 {宽度}、{模式}。", variables: { 哪里: { description: "看到问题的地方" }, 宽度: { description: "截图的宽度", default: "390" }, 模式: { description: "浅色或深色", default: "深色" } } },
	{ id: "component", title: "搬组件", group: "界面", body: "/component {组件}：先提议，在 block 里画给我看，我点头再提交。", variables: { 组件: { description: "affectUI 里的组件名" } } },
	{ id: "bug", title: "先找原因", group: "排查", body: "{现象}。先找到原因、指出是哪一行，别急着改。", variables: { 现象: { description: "看到了什么、在哪一步" } } },
	{ id: "ship", title: "提交并推送", group: "收尾", body: "check、test 过了就提交，然后推送 {仓库}。", variables: { 仓库: { description: "要推送的仓库", default: "mixer" } } },
];
const PL_LONG: PromptTemplate[] = [
	...PL,
	{
		id: "listing",
		title: "上品：从 1688 链接生成蝦皮商品稿，核对规格、价格和类目",
		group: "Penna",
		body: "把这个 1688 商品做成蝦皮台湾站的商品稿：{链接}\n\n标题用繁体中文，不超过 60 个字，关键词放前面；描述分点写材质、尺寸、适用场景。规格照 1688 的写，价格按 {倍率} 倍加运费算，类目选最接近的。\n\n做完先别上架，把规格对照、核价和拿不准的地方列给我看。",
		variables: { 链接: { description: "1688 的商品链接" }, 倍率: { description: "售价是进价的几倍", default: "2.2" } },
	},
	{ id: "orders", title: "处理今天的订单", group: "Penna", body: "读 chanboss 里 {日期} 的订单，检查货源和规格，能对上的加进 1688 购物车，对不上的列出来。", variables: { 日期: { default: "今天" } } },
	...Array.from({ length: 12 }, (_, i) => ({ id: `more-${i}`, title: `第 ${i + 1} 个常用的提示词，标题长一点看看截断`, group: i % 2 ? "收尾" : "排查", body: `第 ${i + 1} 个提示词的内容，里面有一个 {空}。` })),
];

/** A library wired like a host: saving takes half a second; hang – it never settles */
function Prompts({ initial = PL, defaultValue, hang }: { initial?: PromptTemplate[]; defaultValue?: string; hang?: boolean }) {
	const [ts, setTs] = useState(initial);
	return (
		<PromptLibrary
			templates={ts}
			defaultValue={defaultValue}
			onUse={(p) => toast("已放进输入框", { description: p })}
			onSave={(t) =>
				hang
					? new Promise(() => {})
					: new Promise((ok) =>
							setTimeout(() => {
								setTs((l) => (l.some((x) => x.id === t.id) ? l.map((x) => (x.id === t.id ? t : x)) : [...l, t]));
								ok(undefined);
							}, 500),
						)
			}
			onDelete={(id) => setTs((l) => l.filter((x) => x.id !== id))}
		/>
	);
}

const COPY_A = "这款保温杯采用 316 不锈钢内胆，保温效果长达 12 小时，非常适合上班族和学生党日常使用。杯盖带有防漏设计，放进包里也不用担心洒出来。";
const COPY_B = "这款保温杯采用 316 不锈钢内胆，保温 12 小时，适合通勤、上学日常使用。杯盖防漏，放进包里不怕洒。";
const COPY_DECIDED: DiffDecision[] = ["accept", "accept", "reject", "accept"];
const PROMPT_A = "你是网店助手。根据 1688 的商品页写蝦皮的标题和描述。\n\n标题不超过 60 个字。描述要分点写清楚材质、尺寸和适用场景，语气要热情一点。\n\n不要编造商品页上没有的信息。";
const PROMPT_B = "你是网店助手。根据 1688 的商品页，为蝦皮台湾站写繁体中文的标题和描述。\n\n标题不超过 60 个字，关键词放前面。描述分点写材质、尺寸和适用场景，语气亲切。\n\n商品页上没有的信息不要写，拿不准就问。";
const PROMPT_LONG_A = [
	PROMPT_A,
	"规格照 1688 的写。颜色、尺码要和图片对得上，对不上的先标出来。",
	"价格按进价的 2 倍算，再加运费。运费按重量估，估不准就写一个范围。",
	"类目选最接近的那个。如果有两个都差不多，选卖得多的那个。",
	"图片用 1688 的主图和详情图，去掉带别家水印和二维码的，最多 9 张。",
	"做完先别上架，把规格对照、核价和拿不准的地方列给我看。",
].join("\n\n");
const PROMPT_LONG_B = [
	PROMPT_B,
	"规格照 1688 的写，颜色、尺码要和图片对得上；对不上的标出来，先别猜。",
	"价格按进价的 2.2 倍算，再加运费。运费按重量估，估不准就写一个范围。",
	"类目选最接近的那个；两个差不多时，选蝦皮上卖得多的。",
	"图片用 1688 的主图和详情图，去掉带水印、二维码的，最多 9 张，第一张放白底图。",
	"做完先别上架，把规格对照、核价和拿不准的地方列给我看。",
].join("\n\n");
const DOC_A = "**输入框**：继续、分叉、新会话是同一个输入框。底下一排是「+」（图片、文件、skill）、运行设置（一颗按钮：模型、思考强度、权限，都按会话记着）、麦克风（说话输入）。";
const DOC_B = "**输入框**：继续、分叉、新会话是同一个输入框。底下一排是「+」（图片、文件、skill、提示词）、运行设置（模型、思考强度、权限，按会话记着）、麦克风。";
const EN_A = "Hi everyone, we are very excited to announce that the new dashboard is now available for all users. It loads a lot faster than before, and you can now export any report to CSV with just a single click. Let us know what you think!";
const EN_B = "Hi everyone, the new dashboard is now live for all users. It loads twice as fast, and you can now export any report to CSV in one click. Let us know what you think!";

/** The tray's line: who suggested it, and what was asked set apart by color */
const Asked = ({ ask }: { ask: string }) => (
	<>
		Claude 的改写<span className="ml-2 text-foreground/70">{ask}</span>
	</>
);

/** A review wired like a host: 「完成」 writes back for a moment, then the card is settled */
function Edits({ a, b, ask }: { a: string; b: string; ask: string }) {
	return <InlineDiff original={a} suggested={b} label={<Asked ask={ask} />} onDone={(t) => new Promise((ok) => setTimeout(() => ok(toast.success("已写回", { description: t })), 800))} />;
}
