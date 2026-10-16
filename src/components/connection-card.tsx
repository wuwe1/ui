// ConnectionCard: something an agent works through for you – a store, a browser, a site login – and whether it can right now.
// A gray tray holds the summary – logo, name, status, what it does for you, the one thing to do – and opens to a white card,
// one row per account. A few connections with a few accounts each: cards that open, not a directory of lines.
// Left alone it opens itself when it starts needing you, and never closes itself: only the person folds it.
import { Children, type ComponentProps, type ReactNode, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible.tsx";
import { Chevron } from "./placeholder.tsx";
import { Shimmer } from "./shimmer.tsx";
import { type Mark, StatusIcon } from "./status-icon.tsx";
import { type ConnectionMark, MARK_LABEL, needsYou, openAfter } from "../lib/connection.ts";
import { Tray, TrayCard } from "./tray.tsx";
import { cn } from "../lib/utils.ts";

export type { ConnectionMark } from "../lib/connection.ts";

/** Needs you ripples – StatusIcon's waiting; an error is a still red dot */
const DOT: Record<ConnectionMark, Mark> = { ok: "ok", waiting: "waiting", error: "failed", off: "off" };
/** Words in the mark's color – a signal as text is -strong; all-is-well and off stay muted */
const TEXT: Record<ConnectionMark, string> = { ok: "text-muted-foreground", waiting: "text-waiting-strong", error: "text-destructive-strong", off: "text-muted-foreground" };

/** Open and close: the body slides in 200ms; with reduced motion there is no animation – it only exists under motion-safe */
const SLIDE = "overflow-hidden ease-out-strong motion-safe:data-open:animate-collapsible-down motion-safe:data-closed:animate-collapsible-up";

type ConnectionCardProps = {
	/** Logo or icon on the white tile */
	icon: ReactNode;
	name: string;
	/** ok, waiting – needs you, error, off – not connected or not in use */
	mark?: ConnectionMark;
	/** A few words beside the name */
	status?: string;
	/** Shows 「检查中」 sweeping in place of the status */
	checking?: boolean;
	/** What it does for you – two lines at most */
	description?: ReactNode;
	/** The one thing to do now */
	action?: ReactNode;
	/** ConnectionRow, one per account */
	children?: ReactNode;
	/** Under the rows: add another, steps, notes */
	footer?: ReactNode;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	className?: string;
};

function ConnectionCard({ icon, name, mark = "off", status, checking = false, description, action, children, footer, open, defaultOpen, onOpenChange, className }: ConnectionCardProps) {
	const [inner, setInner] = useState(defaultOpen ?? needsYou(mark));
	// The mark changed: open if it starts needing you (set while rendering, so it never shows folded first)
	const [was, setWas] = useState(mark);
	if (mark !== was) {
		setWas(mark);
		setInner(openAfter({ open: inner, was, mark }));
	}
	const rows = Children.toArray(children).length > 0;
	// Nothing to open: no chevron, and the header is plain text
	const body = rows || Boolean(footer);
	const shown = body && (open ?? inner);
	const toggle = (o: boolean) => {
		setInner(o);
		onOpenChange?.(o);
	};
	return (
		<Collapsible data-slot="connection-card" open={shown} onOpenChange={toggle} asChild>
			<Tray className={cn("text-sm", className)}>
			<div className="group/header relative flex items-center gap-3 p-1.5">
				<span className="grid size-9 shrink-0 place-items-center self-start overflow-hidden rounded-lg bg-card text-muted-foreground shadow-rest ring-1 ring-foreground/10 [&_img]:size-5 [&_svg:not([class*='size-'])]:size-5">
					{icon}
				</span>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
						{body ? (
							// The whole header opens the card: the button's ::after covers it, and the action sits above that
							<CollapsibleTrigger className="text-left font-medium outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50">
								{name}
							</CollapsibleTrigger>
						) : (
							<span className="font-medium">{name}</span>
						)}
						<span role="status" className={cn("flex items-center text-xs", TEXT[mark])}>
							<StatusIcon s={checking ? null : DOT[mark]} label={status || checking ? null : MARK_LABEL[mark]} className="pointer-events-none" />
							{checking ? <Shimmer>检查中</Shimmer> : status}
						</span>
					</div>
					{description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{description}</p>}
				</div>
				{action && <div className="relative z-10 flex shrink-0 items-center gap-1.5">{action}</div>}
				{body && <Chevron open={shown} className="size-3.5 transition-[color,rotate] group-hover/header:text-foreground" />}
			</div>
			<CollapsibleContent className={SLIDE}>
				<TrayCard>
					{rows && <ul className="flex flex-col p-1">{children}</ul>}
					{footer && <div className={cn("flex flex-col items-start gap-1 px-1 pb-1", !rows && "pt-1")}>{footer}</div>}
				</TrayCard>
			</CollapsibleContent>
			</Tray>
		</Collapsible>
	);
}

type ConnectionRowProps = {
	mark: ConnectionMark;
	/** Text, or an inline editor */
	name: ReactNode;
	/** Facts under the name, spaced apart – never joined with · */
	meta?: ReactNode[];
	/** Words on the right, in the mark's color */
	status?: string;
	/** Buttons that always show */
	actions?: ReactNode;
	/** Buttons that show on hover or focus – and always on touch screens, which can't hover */
	quiet?: ReactNode;
	className?: string;
};

/** One account: mark, name and facts; on the right its status and buttons */
function ConnectionRow({ mark, name, meta, status, actions, quiet, className }: ConnectionRowProps) {
	return (
		<li data-slot="connection-row" className={cn("group/row flex min-h-11 items-center gap-2 rounded-lg py-1.5 pr-1.5 pl-1 transition-colors duration-150 hover:bg-muted", className)}>
			<StatusIcon s={DOT[mark]} label={status ? null : MARK_LABEL[mark]} />
			<div className="min-w-0 flex-1">
				<div className="truncate">{name}</div>
				{meta && meta.length > 0 && (
					<div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
						{meta.map((m, i) => (
							<span key={i}>{m}</span>
						))}
					</div>
				)}
			</div>
			{(quiet || status || actions) && (
				<div className="flex shrink-0 items-center gap-1.5 text-xs">
					{quiet && (
						<div className="flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover/row:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
							{quiet}
						</div>
					)}
					{status && <span className={TEXT[mark]}>{status}</span>}
					{actions}
				</div>
			)}
		</li>
	);
}

/** A line in the footer – muted, or amber or red after its mark */
function ConnectionNote({ mark, className, ...props }: ComponentProps<"p"> & { mark?: ConnectionMark }) {
	return <p data-slot="connection-note" className={cn("px-2 py-1 text-xs wrap-anywhere", mark ? TEXT[mark] : "text-muted-foreground", className)} {...props} />;
}

export { ConnectionCard, ConnectionNote, ConnectionRow };
