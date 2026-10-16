// The one way to draw these: empty states (Placeholder over Empty – an icon, a line, an optional title and buttons), Loading (a centered Spinner), the expand › (Chevron).
// Render errors too (Boundary): no blank page – it says what broke and offers a reload.
import { ChevronRight, type LucideIcon, TriangleAlert } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Button } from "./button.tsx";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./empty.tsx";
import { Spinner } from "./spinner.tsx";
import { cn } from "../lib/utils.ts";

export function Placeholder({ icon: I, title, text, className, children }: { icon?: LucideIcon; title?: string; text: string; className?: string; children?: ReactNode }) {
	return (
		<Empty className={cn("m-auto", className)}>
			<EmptyHeader>
				{I && (
					<EmptyMedia variant="icon">
						<I />
					</EmptyMedia>
				)}
				{title && <EmptyTitle>{title}</EmptyTitle>}
				<EmptyDescription>{text}</EmptyDescription>
			</EmptyHeader>
			{children && <EmptyContent>{children}</EmptyContent>}
		</Empty>
	);
}

/** Loading: fills its parent with a centered Spinner. className goes on that layer – h-80 and the like for a fixed height */
export const Loading = ({ className }: { className?: string }) => (
	<div className={cn("flex min-h-0 flex-1", className)}>
		<Spinner className="m-auto text-muted-foreground" />
	</div>
);

/**
 * Expand and collapse: a › on the left, turned 90° when open. Without open it follows Radix Collapsible's data-state (uncontrolled) –
 * put CHEVRON on the nearest Collapsible or CollapsibleTrigger. Don't nest one CHEVRON in another: an open outer one turns the inner one too
 */
/**
 * Secondary facts in a row – count, time, status – set apart by space, never by ·; empty ones are skipped.
 * Out of room – the last one truncates, the others keep their width. Emphasis comes from the caller (placement, color, weight); this only spaces them
 */
export function Facts({ items, className }: { items: ReactNode[]; className?: string }) {
	const xs = items.filter((x) => x !== null && x !== undefined && x !== false && x !== "");
	if (!xs.length) return null;
	return (
		<span className={cn("flex min-w-0 items-center gap-3 overflow-hidden whitespace-nowrap", className)}>
			{xs.map((x, i) => <span key={i} className={i === xs.length - 1 ? "truncate" : "shrink-0"}>{x}</span>)}
		</span>
	);
}

export const CHEVRON = "group/chevron";
export const Chevron = ({ open, className }: { open?: boolean; className?: string }) => (
	<ChevronRight className={cn("size-3 shrink-0 text-muted-foreground transition-transform", open === undefined ? "group-data-[state=open]/chevron:rotate-90" : open && "rotate-90", className)} />
);

/** A child threw while rendering: shows the error and a reload. className goes on the error layer – a full page needs it to fill */
export class Boundary extends Component<{ children: ReactNode; className?: string }, { error: Error | null }> {
	state = { error: null as Error | null };
	static getDerivedStateFromError(error: unknown) {
		return { error: error instanceof Error ? error : new Error(String(error)) };
	}
	render() {
		const { error } = this.state;
		if (!error) return this.props.children;
		return (
			<div className={cn("flex min-h-0 flex-1", this.props.className)}>
				<Placeholder icon={TriangleAlert} title="页面出错" text={error.message || String(error)}>
					<Button variant="outline" size="sm" onClick={() => location.reload()}>刷新</Button>
				</Placeholder>
			</div>
		);
	}
}
