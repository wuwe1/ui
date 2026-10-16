// 状态标记（StatusIcon）：全站一套，侧栏、Inbox、顶栏、项目汇总、工具调用都用它。只认状态的名字，不碰 mixer 的数据，以后搬进组件库
import { cn } from "../lib/utils.ts";

/**
 * 会话的状态（lib/live.ts 的 Status 是它的一部分），加上 ok / failed：一步工具调用跑完了，成功、失败
 */
export type Mark = "waiting" | "running" | "background" | "done" | "error" | "terminal" | "ok" | "failed" | null;
const STATUS_LABEL: Record<Exclude<Mark, null>, string> = { waiting: "待确认", running: "运行中", background: "后台任务运行中", done: "已完成，未读", error: "出错，未读", terminal: "终端中打开", ok: "成功", failed: "失败" };

/**
 * 状态标记，全站一套：点 = 要你注意（琥珀待确认，带一圈扩散；蓝已完成未读；红出错未读）；带扩散的蓝点 = 运行中；
 * 带扩散的蓝色空心圈 = 后台任务在跑（Claude 闲着，跑完了会叫醒它）；灰色空心圈 = 终端中打开。
 * 一步工具调用跑完了：绿点成功、红点失败。
 * 颜色只有这几种意思：琥珀要你确认，红出错，蓝没看过，绿这一步成功了，灰中性
 */
export function StatusIcon({ s, className }: { s: Mark; className?: string }) {
	const icon =
		s === "waiting" ? <Ping dot="bg-waiting" />
		: s === "running" ? <Ping dot="bg-unread" />
		: s === "background" ? <Ping dot="border border-unread" />
		: s === "done" ? <span className="size-2 rounded-full bg-unread" />
		: s === "error" || s === "failed" ? <span className="size-2 rounded-full bg-destructive" />
		: s === "ok" ? <span className="size-2 rounded-full bg-success" />
		: s === "terminal" ? <span className="size-2 rounded-full border border-muted-foreground" />
		: null;
	return (
		<span className={cn("flex size-4 shrink-0 items-center justify-center", className)} title={s ? STATUS_LABEL[s] : undefined}>
			{icon}
		</span>
	);
}
/**
 * 带一圈扩散的点：dot 是点的样子（实心的底色，或者空心的边框），扩散的那圈照它画。
 * prefers-reduced-motion 时那圈不动，停成点外面一圈淡的：不然「运行中」和「已完成未读」都是一个蓝点，分不出来。
 * 扩散的那圈在动画里是单独一层（合成层），点不在小数像素上时两边对齐像素的办法不一样，会错开半个像素（空心圈最明显）：点也放进单独一层，两层对齐得一样
 */
function Ping({ dot }: { dot: string }) {
	return (
		<span className="relative flex size-2">
			<span className={cn("absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:animate-none motion-reduce:scale-175 motion-reduce:opacity-30", dot)} />
			<span className={cn("relative size-2 transform-gpu rounded-full", dot)} />
		</span>
	);
}

export const statusLabel = (s: Mark) => (s ? STATUS_LABEL[s] : null);
