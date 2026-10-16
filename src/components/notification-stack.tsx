// NotificationStack: a few notices that stay until dismissed, stacked behind each other – dismiss the front one to see the next.
// It sits in the page's flow, e.g. at the foot of a sidebar above a usage line. The next one peeks out above with its whole head line,
// one padding narrower per side, so you can read what comes next; dismissing the front lets it sink and fade while the next moves forward into its place.
// Compact on purpose – a sidebar is narrow: a head line (dot, tag, close), a title, an optional line of text, and the action as a footer row.
import { ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./button.tsx";
import { type Mark, StatusIcon } from "./status-icon.tsx";
import { cn } from "../lib/utils.ts";

/** mark – a StatusIcon dot before the tag; tag – what kind of notice: 「新版本」「已完成」 */
export type Notice = { id: string; mark?: Mark; tag?: string; title: string; text?: string; action?: { label: string; onClick: () => void } };

/** Cards behind the front one that peek out: one, its head line readable; more wait unseen */
const BEHIND = 1;
/** How much of the card behind shows above the one in front: its whole head line – set by the content, not the width */
const PEEK = 30;
/** How much narrower the card behind is, per side: the card's own padding, so its edges line up with the front card's content. Not a scale – the peeking line keeps its size */
const INSET = 10;
const LEAVE_MS = 150;

/** notices – front first. onDismiss – the close button; the caller drops the notice from the list */
function NotificationStack({ notices, onDismiss, label = "通知", className }: { notices: Notice[]; onDismiss: (n: Notice) => void; label?: string; className?: string }) {
	const [leaving, setLeaving] = useState<string | null>(null);
	if (!notices.length) return null;
	// One more than shows, hidden: when the front leaves it fades in behind instead of popping up after
	const shown = notices.slice(0, BEHIND + 2);
	// While the front card leaves, the rest already move one step forward; the top edge counts what stays, so it doesn't bounce
	const step = leaving ? 1 : 0;
	const behind = Math.min(BEHIND, Math.max(0, notices.length - step - 1));
	const dismiss = (n: Notice) => {
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) return onDismiss(n);
		setLeaving(n.id);
		setTimeout(() => {
			setLeaving(null);
			onDismiss(n);
		}, LEAVE_MS);
	};
	return (
		<section aria-label={label} className={cn("relative grid transition-[padding] duration-200 ease-out-strong motion-reduce:transition-none", className)} style={{ paddingTop: behind * PEEK }}>
			{shown.map((n, i) => {
				const gone = n.id === leaving;
				const depth = Math.max(0, i - step);
				const front = depth === 0 && !gone;
				const deep = depth > BEHIND;
				return (
					<article
						key={n.id}
						aria-labelledby={`notice-${n.id}`}
						aria-describedby={notices.length > 1 && i === 0 ? `notice-${n.id}-count` : undefined}
						inert={!front}
						aria-hidden={!front}
						className={cn(
							"col-start-1 row-start-1 self-start overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-sm",
							"transition-[transform,opacity,margin] ease-out-strong motion-reduce:transition-none",
							gone ? "duration-150 ease-in-strong" : "duration-200",
						)}
						style={{
							zIndex: gone ? 20 : 10 - depth,
							visibility: deep && !leaving ? "hidden" : undefined,
							transform: gone ? "translateY(6px)" : `translateY(${-depth * PEEK}px)`,
							marginInline: gone ? 0 : depth * INSET,
							opacity: gone || deep ? 0 : 1,
							// Cards behind keep only their head line in sight: the front one covers the rest
							maxHeight: front || gone ? undefined : depth * PEEK + 12,
						}}
					>
						<div className="flex h-7.5 items-center gap-1.5 pt-1 pr-1.5 pl-2.5 text-xs text-muted-foreground">
							{n.mark && <StatusIcon s={n.mark} />}
							<span className="min-w-0 flex-1 truncate">{n.tag}</span>
							{i === 0 && notices.length > 1 && <span id={`notice-${n.id}-count`} className="sr-only">第 1 条，共 {notices.length} 条</span>}
							<Button variant="ghost" size="icon-xs" className="text-muted-foreground" aria-label={`关闭「${n.title}」`} onClick={() => dismiss(n)}>
								<X />
							</Button>
						</div>
						<div className="flex flex-col gap-0.5 px-2.5 pb-2.5">
							<h3 id={`notice-${n.id}`} className="text-md font-medium wrap-anywhere">{n.title}</h3>
							{n.text && <p className="line-clamp-3 text-xs text-muted-foreground wrap-anywhere">{n.text}</p>}
						</div>
						{n.action && (
							<button type="button" onClick={n.action.onClick} className="flex w-full items-center gap-2 border-t px-2.5 py-2 text-left text-xs text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent pointer-coarse:min-h-11">
								<span className="min-w-0 flex-1 truncate">{n.action.label}</span>
								<ChevronRight className="size-3.5 shrink-0" aria-hidden />
							</button>
						)}
					</article>
				);
			})}
		</section>
	);
}

export { NotificationStack };
