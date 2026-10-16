// 展示页里有哪些组件、各有哪几种状态（main.tsx 照这个画）。状态的名字和 docs/components/<组件>.md 的 States 对得上；
// 新组件在这里登记，状态要写全：空、加载中、出错、很长、很多、禁用、深浅色下都要能看
import { Bell, CircleAlert, Inbox, Plus, Search, SquarePen, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "../src/components/alert.tsx";
import { Badge } from "../src/components/badge.tsx";
import { Button } from "../src/components/button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../src/components/card.tsx";
import { Input } from "../src/components/input.tsx";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../src/components/input-group.tsx";
import { Kbd } from "../src/components/kbd.tsx";
import { Loading, Placeholder } from "../src/components/placeholder.tsx";
import { Skeleton } from "../src/components/skeleton.tsx";
import { Spinner } from "../src/components/spinner.tsx";
import { type Mark, StatusIcon, statusLabel } from "../src/components/status-icon.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../src/components/tabs.tsx";
import { Textarea } from "../src/components/textarea.tsx";
import { toast } from "../src/components/toast.tsx";
import { ToggleGroup, ToggleGroupItem } from "../src/components/toggle-group.tsx";

export type Story = { name: string; render: () => ReactNode };

const row = "flex flex-wrap items-center gap-2";
const col = "flex flex-col gap-3";

const VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;
const SIZES = ["xs", "sm", "default", "lg"] as const;
const MARKS: Mark[] = ["waiting", "running", "background", "done", "error", "terminal", "ok", "failed"];

export const STORIES: Record<string, Story[]> = {
	Button: [
		{ name: "各种 variant", render: () => <div className={row}>{VARIANTS.map((v) => <Button key={v} variant={v}>{v}</Button>)}</div> },
		{ name: "尺寸", render: () => <div className={row}>{SIZES.map((s) => <Button key={s} size={s}><Plus />{s}</Button>)}</div> },
		{ name: "只有图标", render: () => <div className={row}>{(["icon-xs", "icon-sm", "icon", "icon-lg"] as const).map((s) => <Button key={s} size={s} variant="outline" aria-label="新会话"><SquarePen /></Button>)}</div> },
		{ name: "禁用", render: () => <div className={row}>{VARIANTS.map((v) => <Button key={v} variant={v} disabled>{v}</Button>)}</div> },
		{ name: "很长", render: () => <div className="w-48"><Button className="w-full">一个按钮上的字太长了会怎么样</Button></div> },
	],
	Badge: [
		{ name: "各种 variant", render: () => <div className={row}>{(["default", "secondary", "outline", "ghost", "destructive"] as const).map((v) => <Badge key={v} variant={v}>{v}</Badge>)}</div> },
		{ name: "带图标、数字", render: () => <div className={row}><Badge variant="secondary"><Bell />3</Badge><Badge variant="outline">推荐</Badge><Badge className="tabular-nums">128</Badge></div> },
	],
	StatusIcon: [
		{
			name: "每种状态",
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
		{ name: "空", render: () => <div className="flex min-h-56 flex-col"><Placeholder icon={Inbox} title="Inbox 为空" text="待确认、出错、运行中、跑完没看的会话会出现在这里"><Button variant="outline" size="sm"><SquarePen />新会话</Button></Placeholder></div> },
		{ name: "只有一句", render: () => <div className="flex min-h-32 flex-col"><Placeholder text="选择一个文件" /></div> },
		{ name: "加载中", render: () => <Loading className="h-32" /> },
	],
	Input: [
		{ name: "普通、有字、占位", render: () => <div className={col}><Input placeholder="搜索会话…" /><Input defaultValue="pnpm test" /></div> },
		{ name: "禁用", render: () => <Input placeholder="不能改" disabled /> },
		{ name: "无效", render: () => <div className={col}><Input aria-invalid defaultValue="no-such-branch" /><span className="text-xs text-destructive-strong">分支不存在</span></div> },
		{ name: "带图标", render: () => <InputGroup><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput placeholder="搜索…" /></InputGroup> },
		{ name: "多行", render: () => <Textarea placeholder="继续…" rows={3} /> },
	],
	Tabs: [
		{
			name: "三个 tab",
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
			name: "标题、说明、操作",
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
		{ name: "普通", render: () => <Alert><CircleAlert /><AlertTitle>有新版本</AlertTitle><AlertDescription>刷新后生效</AlertDescription></Alert> },
		{ name: "出错", render: () => <Alert variant="destructive"><Trash2 /><AlertTitle>删除失败</AlertTitle><AlertDescription>文件被别的进程占着</AlertDescription></Alert> },
	],
	Feedback: [
		{ name: "Spinner、Kbd", render: () => <div className={row}><Spinner /><span className="text-sm">运行中</span><Kbd>⌘</Kbd><Kbd>↵</Kbd></div> },
		{ name: "Skeleton", render: () => <div className={col}><Skeleton className="h-4 w-2/5" /><Skeleton className="h-3 w-3/5" /><Skeleton className="h-20 w-full" /></div> },
		{ name: "toast", render: () => <div className={row}><Button variant="outline" size="sm" onClick={() => toast("已复制到剪贴板")}>提示</Button><Button variant="outline" size="sm" onClick={() => toast.error("出错：网络连接已断开")}>出错</Button></div> },
	],
};
