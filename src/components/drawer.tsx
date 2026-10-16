// Phone drawer – the sidebar on the left, a panel on the right. Always mounted; lib/drawer owns the position and follows the finger.
// Not Sheet: it unmounts when closed, leaving nothing to drag, and forcing it mounted locks the page's scrolling and taps.
// The swipe (useSwipe) lives here too: mount this on phones only; mounted, it takes swipes – closed too, or it couldn't be pulled open
import { type ComponentProps, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import * as drawer from "../lib/drawer.ts";
import { cn } from "../lib/utils.ts";

/** onHidden – fully closed and hidden, content can unmount. onStart – a drag began from closed, render the content */
export function Drawer({ d, open, onOpenChange, label, onHidden, onStart, clear, className, children, ...props }: Omit<ComponentProps<"div">, "role"> & {
	d: drawer.Drawer;
	/** The page behind must stay readable (a partial panel): a light gray scrim, no blur */
	clear?: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	label: string;
	onHidden?: () => void;
	onStart?: () => void;
}) {
	const el = useRef<HTMLDivElement>(null);
	const ov = useRef<HTMLDivElement>(null);
	const hidden = useRef(onHidden);
	hidden.current = onHidden;
	const change = useRef(onOpenChange);
	change.current = onOpenChange;
	useLayoutEffect(() => (el.current && ov.current ? d.attach(el.current, ov.current, () => hidden.current?.()) : undefined), [d]);
	useEffect(() => d.to(open ? 1 : 0), [d, open]);
	useEffect(() => {
		if (!open) return;
		const esc = (e: KeyboardEvent) => { if (e.key === "Escape") change.current(false); };
		document.addEventListener("keydown", esc);
		return () => document.removeEventListener("keydown", esc);
	}, [open]);
	drawer.useSwipe(d, { open, setOpen: onOpenChange, onStart });
	return createPortal(
		<>
			<div ref={ov} aria-hidden className={cn("fixed inset-0 z-50 bg-black/10", !clear && "supports-backdrop-filter:backdrop-blur-xs")} onClick={() => change.current(false)} />
			<div ref={el} role={open ? "dialog" : undefined} aria-modal={open || undefined} aria-label={label} data-drawer={d.side} className={cn("fixed z-50 flex flex-col shadow-float", className)} {...props}>
				{children}
			</div>
		</>,
		document.body,
	);
}
