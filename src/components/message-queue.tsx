// MessageQueue: messages sent while an agent works, waiting for it to read them. They stack into one card above the composer's text,
// newest in front, older ones peeking out above as thin edges – one line high however many wait: a phone with its keyboard up has little room.
// A tap opens the stack into a list. Withdraw puts a message back in the input, nothing lost.
// A card leaves the way it went: up when the agent took it, down into the input when withdrawn.
import { Undo2 } from "lucide-react";
import { type ReactNode, type Ref, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "./button.tsx";
import { depths, type QueuedMessage, settle, type Shown, short } from "../lib/message-queue.ts";
import { cn } from "../lib/utils.ts";

export type { QueuedMessage } from "../lib/message-queue.ts";

/** Cards behind the front one that peek out; more wait unseen */
const BEHIND = 2;
/** How much of each card behind shows above the one in front */
const EDGE = 4;
/** How much narrower each step back is, per side: the edges read as cards, not as a thick border */
const INSET = 6;
const LEAVE_MS = 200;
/** On a phone the button grows to 32px and its hit area to 44px */
const HIT = "relative pointer-coarse:size-8 pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 pointer-coarse:after:content-['']";
const CARD = "flex min-w-0 gap-1 rounded-lg border bg-card py-0.5 pr-0.5 pl-2.5 text-md text-card-foreground shadow-rest";
const TEXT = "rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
const MOVE = "transition-[translate,opacity,margin] duration-200 ease-out-strong motion-reduce:transition-opacity";
const ENTER = "animate-in fade-in-0 motion-safe:slide-in-from-bottom-2 duration-200 ease-out-strong";

/** What a card says: the text, or how many pictures when there is none */
const words = (m: QueuedMessage) => m.text.trim() || `${m.images?.length ?? 0} 张图片`;

type Props = {
	/** Oldest first */
	items: QueuedMessage[];
	/** The withdraw button: the host takes the message out of items and puts it back in the input */
	onWithdraw: (m: QueuedMessage) => void;
	/** Ids being pulled back: their button waits, and they sink toward the input when they go */
	withdrawing?: string[];
	/** Start opened into a list */
	defaultOpen?: boolean;
	label?: string;
	className?: string;
};

function MessageQueue({ items, onWithdraw, withdrawing = [], defaultOpen = false, label = "排队的消息", className }: Props) {
	// Ids once pulled back stay known: the host may drop an id from withdrawing in the same update that drops its message
	const pulled = useRef(new Set<string>());
	for (const id of withdrawing) pulled.current.add(id);
	const [shown, setShown] = useState<Shown[]>(() => items.map((m) => ({ m })));
	const [fresh, setFresh] = useState<ReadonlySet<string>>(() => new Set());
	const [open, setOpen] = useState(defaultOpen);
	const [said, setSaid] = useState("");
	const before = useRef(items);
	useLayoutEffect(() => {
		const was = before.current;
		if (was === items) return;
		before.current = items;
		const had = new Set(was.map((m) => m.id));
		const has = new Set(items.map((m) => m.id));
		const added = items.filter((m) => !had.has(m.id));
		const left = was.filter((m) => !has.has(m.id));
		setShown((prev) => settle(prev, items, pulled.current));
		const latest = added.at(-1);
		if (latest) {
			setFresh(new Set(added.map((m) => m.id)));
			setSaid(`已排队：${short(words(latest))}`);
		} else if (left.length) setSaid(left.every((m) => pulled.current.has(m.id)) ? "已撤回" : left.length > 1 ? `已发送 ${left.length} 条` : "已发送");
		if (!items.length) setOpen(false);
	}, [items]);
	useEffect(() => {
		if (!fresh.size) return;
		const t = setTimeout(() => setFresh(new Set()), LEAVE_MS + 50);
		return () => clearTimeout(t);
	}, [fresh]);
	// Cards that left are drawn until their way out is over
	useEffect(() => {
		const out = shown.filter((s) => s.out);
		if (!out.length) return;
		const t = setTimeout(() => {
			setShown((p) => p.filter((s) => !s.out));
			for (const s of out) pulled.current.delete(s.m.id);
		}, LEAVE_MS);
		return () => clearTimeout(t);
	}, [shown]);

	// The height follows the content, so opening, closing and cards coming and going never jump
	const inner = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState<number | null>(null);
	useLayoutEffect(() => {
		const el = inner.current;
		if (!el) return;
		const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
		ro.observe(el);
		return () => ro.disconnect();
	}, [shown.length > 0]);

	// Opening and closing swap the stack for the list: focus follows to the newest message's button
	const toggle = useRef<HTMLButtonElement>(null);
	const newest = useRef<HTMLButtonElement>(null);
	const moving = useRef(false);
	const flip = (to: boolean) => {
		moving.current = true;
		setOpen(to);
	};
	useEffect(() => {
		if (!moving.current) return;
		moving.current = false;
		(open ? newest : toggle).current?.focus();
	}, [open]);

	if (!shown.length) return null;
	const live = shown.filter((s) => !s.out);
	const depth = depths(shown);
	const behind = Math.min(BEHIND, Math.max(0, live.length - 1));
	const last = live[live.length - 1]?.m.id;
	// How far a leaving card travels while it fades: --away, 10px, none with reduced motion
	const off = (s: Shown, px = 0) => `calc(${s.out === "taken" ? -1 : s.out ? 1 : 0} * var(--away) - ${px}px)`;
	const withdraw = (m: QueuedMessage) => (
		<Button variant="ghost" size="icon-xs" disabled={pulled.current.has(m.id)} aria-label={`撤回「${short(words(m))}」`} title="撤回" onClick={() => onWithdraw(m)} className={cn("shrink-0 text-muted-foreground", HIT)}>
			<Undo2 />
		</Button>
	);

	return (
		<section
			data-slot="message-queue"
			aria-label={label}
			className={cn("min-w-0 [--away:10px] motion-reduce:[--away:0px]", className)}
			onKeyDown={(e) => {
				if (open && e.key === "Escape") {
					e.stopPropagation();
					flip(false);
				}
			}}
		>
			<div className="overflow-hidden transition-[height] duration-200 ease-out-strong motion-reduce:transition-none" style={height === null ? undefined : { height }}>
				<div ref={inner}>
					{open ? (
						<ol className="flex flex-col gap-1">
							{shown.map((s) => (
								<li key={s.m.id} inert={!!s.out} className={cn(MOVE, s.out && "ease-in-strong", fresh.has(s.m.id) && ENTER)} style={{ opacity: s.out ? 0 : 1, translate: `0 ${off(s)}` }}>
									<div className={cn(CARD, "items-start")}>
										<div className="flex min-w-0 flex-1 flex-col gap-1.5 py-1">
											<button ref={s.m.id === last ? newest : undefined} type="button" aria-expanded onClick={() => flip(false)} className={TEXT}>
												<span className="line-clamp-4 whitespace-pre-wrap wrap-anywhere">{words(s.m)}</span>
											</button>
											{!!s.m.images?.length && (
												<div className="flex flex-wrap gap-1">
													{s.m.images.map((src, i) => <img key={i} src={src} alt="" className="size-10 rounded-md border object-cover" />)}
												</div>
											)}
										</div>
										{withdraw(s.m)}
									</div>
								</li>
							))}
						</ol>
					) : (
						<div className="grid grid-cols-1 transition-[padding] duration-200 ease-out-strong motion-reduce:transition-none" style={{ paddingTop: behind * EDGE }}>
							{shown.map((s, i) => {
								const d = depth[i] ?? 0;
								const front = !s.out && d === 0;
								const deep = d > BEHIND;
								return (
									<div
										key={s.m.id}
										inert={!front}
										aria-hidden={!front || undefined}
										className={cn("col-start-1 row-start-1 min-w-0 self-end", MOVE, s.out && "ease-in-strong", fresh.has(s.m.id) && ENTER)}
										style={{
											zIndex: s.out ? 20 - d : 10 - d,
											translate: `0 ${off(s, d * EDGE)}`,
											marginInline: d * INSET,
											opacity: s.out || deep ? 0 : 1,
											visibility: deep && !s.out ? "hidden" : undefined,
										}}
									>
										<Front m={s.m} count={front ? live.length : 0} toggle={front ? toggle : undefined} onOpen={() => flip(true)}>
											{withdraw(s.m)}
										</Front>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
			<p role="status" className="sr-only">{said}</p>
		</section>
	);
}

/** A card in the stack: one line of the message, a picture, how many more wait behind */
function Front({ m, count, toggle, onOpen, children }: { m: QueuedMessage; count: number; toggle?: Ref<HTMLButtonElement>; onOpen: () => void; children: ReactNode }) {
	return (
		<div className={cn(CARD, "items-center")}>
			<button ref={toggle} type="button" aria-expanded={false} onClick={onOpen} className={cn(TEXT, "min-w-0 flex-1 py-1")}>
				<span className="block truncate">{words(m)}</span>
				{count > 1 && <span className="sr-only">，共 {count} 条</span>}
			</button>
			{m.images?.[0] && <img src={m.images[0]} alt="" className="size-5 shrink-0 rounded-sm border object-cover" />}
			{count > 1 && (
				<span aria-hidden className="shrink-0 px-0.5 text-xs text-muted-foreground tabular-nums">
					+{count - 1}
				</span>
			)}
			{children}
		</div>
	);
}

export { MessageQueue };
