// toast: one line slides in under the top bar – the bar stays visible, the page doesn't move – and leaves after a few seconds. No sonner.
// One at a time; a new one replaces the old. toast("已移出工作区", { action: { label: "撤销", onClick } }), toast.error("…").
// Errors stay longer and read red; duration: Infinity stays until × ("有新版本 · 刷新")
import { X } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { Button } from "./button.tsx";
import { cn } from "../lib/utils.ts";

type Opts = { action?: { label: string; onClick: () => void }; duration?: number };
type Item = Opts & { id: number; text: string; error: boolean };

let current: Item | null = null;
let seq = 0;
const subs = new Set<() => void>();
const set = (x: Item | null) => {
	current = x;
	for (const f of subs) f();
};

function show(text: string, o: Opts = {}, error = false) {
	set({ ...o, id: ++seq, text, error });
}

export const toast = Object.assign((text: string, o?: Opts) => show(text, o), {
	error: (text: string, o?: Opts) => show(text, o, true),
});

/** Mount once, at the top of the page */
export function Toaster() {
	const t = useSyncExternalStore(
		(f) => { subs.add(f); return () => { subs.delete(f); }; },
		() => current,
	);
	useEffect(() => {
		if (!t) return;
		const ms = t.duration ?? (t.error ? 6000 : t.action ? 5000 : 3000);
		if (!Number.isFinite(ms)) return;
		const timer = setTimeout(() => { if (current?.id === t.id) set(null); }, ms);
		return () => clearTimeout(timer);
	}, [t]);
	if (!t) return null;
	return (
		<div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+3.5rem)] z-100 flex justify-center">
			<div key={t.id} className="pointer-events-auto flex min-h-11 w-full max-w-md items-center gap-2 rounded-lg border bg-background py-1 pr-1 pl-3 shadow-md animate-in fade-in slide-in-from-top-2">
				<span className={cn("line-clamp-2 min-w-0 flex-1 text-sm", t.error && "text-destructive-strong")} title={t.text}>{t.text}</span>
				{t.action && (
					<Button size="sm" onClick={() => { set(null); t.action?.onClick(); }}>
						{t.action.label}
					</Button>
				)}
				<Button variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={() => set(null)} aria-label="关闭">
					<X className="size-4" />
				</Button>
			</div>
		</div>
	);
}
