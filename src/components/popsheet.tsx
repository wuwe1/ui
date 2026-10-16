// Popsheet: a small panel from a button – a Popover beside it on desktop, a full-width bottom Sheet on phones. A title line, an optional description;
// bare – the content is a card with its own head (ContextWindow): the title only names the panel for screen readers, no padding, no close button
import { type ComponentProps, type ReactNode, useSyncExternalStore } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.tsx";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./sheet.tsx";
import { cn } from "../lib/utils.ts";

/** Phone width, the sidebar's breakpoint – read on the first render, so it never draws a popover first and swaps. No sidebar needed: works in a block */
const PHONE = "(max-width: 767px)";
const subscribe = (f: () => void) => {
	const m = matchMedia(PHONE);
	m.addEventListener("change", f);
	return () => m.removeEventListener("change", f);
};
const usePhone = () => useSyncExternalStore(subscribe, () => matchMedia(PHONE).matches, () => false);

/**
 * trigger is the button itself and toggles on its own; preventDefault in its onClick to stop that.
 * className and contentProps reach the desktop popover only: width, max height, and the pointer and focus props a hover-to-open panel needs
 */
export function Popsheet({ trigger, title, description, side, align, open, onOpenChange, bare, className, contentProps, children }: {
	trigger: ReactNode;
	title: string;
	/** The content brings its own head: no visible title, no padding, no close button */
	bare?: boolean;
	description?: string;
	side?: "top" | "right" | "bottom" | "left";
	align?: "start" | "center" | "end";
	open?: boolean;
	onOpenChange?: (o: boolean) => void;
	className?: string;
	contentProps?: Omit<ComponentProps<typeof PopoverContent>, "children" | "className" | "side" | "align">;
	children: ReactNode;
}) {
	const isMobile = usePhone();
	if (isMobile)
		return (
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetTrigger asChild>{trigger}</SheetTrigger>
				<SheetContent side="bottom" showCloseButton={!bare} className="max-h-[85svh] gap-0 pb-[max(1rem,env(safe-area-inset-bottom))]" {...(description ? {} : { "aria-describedby": undefined })}>
					<SheetHeader className={cn(bare && "sr-only")}>
						<SheetTitle>{title}</SheetTitle>
						{description && <SheetDescription>{description}</SheetDescription>}
					</SheetHeader>
					<div className={cn("overflow-y-auto px-4", bare && "px-3 pt-3")}>{children}</div>
				</SheetContent>
			</Sheet>
		);
	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>{trigger}</PopoverTrigger>
			<PopoverContent side={side} align={align} aria-label={bare ? title : undefined} className={cn("overflow-y-auto p-3", bare && "rounded-2xl p-0", className)} {...contentProps}>
				{/* The title stays on top while long content scrolls */}
				{!bare && (
					<div className="sticky -top-3 z-10 -mx-3 -mt-3 flex flex-col gap-0.5 bg-popover px-3 pt-3 pb-1">
						<span className="text-sm font-medium">{title}</span>
						{description && <span className="text-xs text-muted-foreground">{description}</span>}
					</div>
				)}
				{children}
			</PopoverContent>
		</Popover>
	);
}
