// StatusIcon: the one status mark – sidebar, Inbox, top bar, project summary, tool steps. It takes a status name, never app data
import { cn } from "../lib/utils.ts";

/**
 * A session's status (mixer's Status in lib/live.ts is a subset), plus ok and failed for a finished tool step
 */
export type Mark = "waiting" | "running" | "background" | "done" | "error" | "terminal" | "ok" | "failed" | null;
const STATUS_LABEL: Record<Exclude<Mark, null>, string> = { waiting: "待确认", running: "运行中", background: "后台任务运行中", done: "已完成，未读", error: "出错，未读", terminal: "终端中打开", ok: "成功", failed: "失败" };

/**
 * Solid dot – look at this: amber waiting (with a ripple), blue done and unread, red error and unread. Blue dot with a ripple – running.
 * Blue ring with a ripple – background tasks running while Claude idles; they wake it when done. Gray ring – open in a terminal.
 * A finished tool step: green ok, red failed.
 * Colors mean only this: amber needs you, red error, blue unseen or running, green a step succeeded, gray neutral
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
 * A dot with a ripple; dot is its look (a fill or a border) and the ripple copies it.
 * Reduced motion – the ripple stands still as a faint ring; without it, running and done-unread would be the same blue dot.
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
