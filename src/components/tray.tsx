// Tray: a gray shell around a white card. The card holds the content; the tray holds what the system says about it – a label on top,
// status and actions under the card. After affectUI's tray and card, made one part so every tray matches: the corners are concentric
// in every theme – the card's radius is the tray's less its 4px padding – the card rests on the tray (shadow-rest), and a tray that
// floats over the page lifts as a whole (shadow-float, a hairline ring, an opaque ground).
import type { ComponentProps } from "react";
import { cn } from "../lib/utils.ts";

function Tray({ float, className, ...props }: ComponentProps<"div"> & { float?: boolean }) {
	return (
		<div
			data-slot="tray"
			className={cn(
				"flex min-w-0 flex-col gap-1 rounded-[calc(var(--radius)*1.8)] bg-muted p-1",
				// muted is translucent: over the page it needs the background under it
				float && "bg-background bg-[linear-gradient(var(--muted),var(--muted))] shadow-float ring-1 ring-foreground/10",
				className,
			)}
			{...props}
		/>
	);
}

/** Small gray words on the tray, over the card: what this is about. Its text lines up with a card padded p-3 */
function TrayLabel({ className, ...props }: ComponentProps<"div">) {
	return <div data-slot="tray-label" className={cn("truncate px-3 pt-1 text-2xs text-muted-foreground", className)} {...props} />;
}

/** The white card in the tray. Rounded rows inside it, inset 4px, take the tray's radius less 8px */
function TrayCard({ className, ...props }: ComponentProps<"div">) {
	return <div data-slot="tray-card" className={cn("rounded-[calc(var(--radius)*1.8_-_0.25rem)] border bg-card text-card-foreground shadow-rest", className)} {...props} />;
}

export { Tray, TrayCard, TrayLabel };
