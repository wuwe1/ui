// StatusIcon: the one status mark – sidebar, Inbox, top bar, project summary, tool steps, connections. It takes a status name, never app data
import { cn } from "../lib/utils.ts";

/**
 * A session's status (mixer's Status in lib/live.ts is a subset), plus ok and failed for a finished tool step, and off for something not in use
 */
export type Mark = "waiting" | "running" | "background" | "done" | "error" | "terminal" | "ok" | "failed" | "off" | null;
const STATUS_LABEL: Record<Exclude<Mark, null>, string> = { waiting: "待确认", running: "运行中", background: "后台任务运行中", done: "已完成，未读", error: "出错，未读", terminal: "终端中打开", ok: "成功", failed: "失败", off: "未启用" };

/**
 * Solid dot – look at this: amber waiting (with a ripple), green done and unread, red error and unread. Blue dot with a ripple – running.
 * Blue ring with a ripple – background tasks running while Claude idles; they wake it when done. Gray ring – open in a terminal.
 * A finished tool step: green ok, red failed. Faint gray dot – off: not connected or not in use.
 * Colors mean only this: amber needs you, red error, blue running, green finished – a run done and unseen, a step that succeeded – gray neutral.
 * label – the tooltip, the mark's own name by default; null when words beside the mark already say it
 */
export function StatusIcon({ s, label, className }: { s: Mark; label?: string | null; className?: string }) {
	const icon =
		s === "waiting" ? <Ping dot="bg-waiting" />
		: s === "running" ? <Ping dot="bg-unread" />
		: s === "background" ? <Ping dot="border border-unread" />
		: s === "done" ? <span className="size-2 rounded-full bg-success" />
		: s === "error" || s === "failed" ? <span className="size-2 rounded-full bg-destructive" />
		: s === "ok" ? <span className="size-2 rounded-full bg-success" />
		: s === "terminal" ? <span className="size-2 rounded-full border border-muted-foreground" />
		: s === "off" ? <span className="size-2 rounded-full bg-muted-foreground/40" />
		: null;
	const title = label === null ? undefined : (label ?? (s ? STATUS_LABEL[s] : undefined));
	return (
		<span className={cn("flex size-4 shrink-0 items-center justify-center", className)} title={title}>
			{icon}
		</span>
	);
}
/**
 * A dot with a ripple; dot is its look (a fill or a border) and the ripple copies it.
 * Reduced motion – the ripple stands still as a faint ring, so running still reads apart from a still dot.
 * The ripple animates on its own compositing layer, which snaps fractional pixels differently and drifts half a pixel (worst on rings) – so the dot gets a layer too
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
