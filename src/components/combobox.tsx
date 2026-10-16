// Combobox: pick one or several values from a list too long to scan – type to narrow it, and what's picked sits in the field as chips.
// After affectUI's Combobox, measured in a browser and redesigned to our rules: our heights (32px field, 24px chips, 32px rows), matches in
// semibold instead of a tint, Chinese copy, keys that wait for an input method to commit, and fades under reduced motion.
// The list floats in our Popover – out of reach of overflow, flipped near the bottom of the screen – or with `inline` opens in the flow:
// a mixer block's frame is as tall as its content and would cut a floating list. Phones keep the list under the field rather than in a bottom
// sheet: the keyboard takes the lower half of the screen while you type.
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Kbd } from "./kbd.tsx";
import { Popover, PopoverAnchor, PopoverContent } from "./popover.tsx";
import { Skeleton } from "./skeleton.tsx";
import { announce, canCreate, type Chip, type ComboboxOption, firstRow, fit, groupsOf, initials, matches, move, ranges, type Row, rowsOf, settle, toggle } from "../lib/combobox.ts";
import { cn } from "../lib/utils.ts";

export type { ComboboxOption } from "../lib/combobox.ts";

type ComboboxProps = {
	/** null – loading */
	options: ComboboxOption[] | null;
	/** Many as chips, or one – one closes the list on a pick */
	multiple?: boolean;
	/** Controlled values; single takes at most one */
	value?: string[];
	defaultValue?: string[];
	/** Every pick, removal and creation */
	onChange?: (value: string[], options: ComboboxOption[]) => void;
	/** Above the field; names the list. Without it give aria-label */
	label?: string;
	"aria-label"?: string;
	/** While nothing is picked */
	placeholder?: string;
	/** Offer 「添加 “…”」 when no label matches the text exactly */
	creatable?: boolean;
	/** Builds the new option; left out or void – { value: text, label: text } */
	onCreate?: (text: string) => ComboboxOption | void;
	/** The create row's words, e.g. 「邀请 “…”」 */
	createLabel?: (text: string) => string;
	/** Chips shown at most; the rest roll into 「+N」 */
	maxChips?: number;
	/** When there are no options at all */
	emptyText?: string;
	/** Shown in place of the list: 「加载文件失败：没有权限」 */
	error?: string;
	disabled?: boolean;
	/** Open on mount, without taking focus */
	defaultOpen?: boolean;
	/** The list opens in the flow under the field instead of floating – for a frame as tall as its content */
	inline?: boolean;
	/** The input's id; the list is `${id}-list` */
	id?: string;
	className?: string;
};

/** ease-out-strong, for element.animate – it can't read a CSS variable */
const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
/** A leaving chip darkens this long, then folds this long */
const FLASH = 150;
const FOLD = 150;
/** The 「+N」 chip's place among the chips */
const MORE = "\u0000more";
/** On a phone × grows to 28px and its hit area to 44px */
const HIT = "relative pointer-coarse:size-7 pointer-coarse:after:absolute pointer-coarse:after:-inset-2 pointer-coarse:after:content-['']";
const LI =
	"group/chip mr-1 grid max-w-full grid-cols-[1fr] overflow-hidden transition-[grid-template-columns,margin,opacity] duration-150 ease-in-strong data-leaving:pointer-events-none data-leaving:opacity-0 data-leaving:delay-150 motion-safe:data-leaving:mr-0 motion-safe:data-leaving:grid-cols-[0fr] motion-reduce:transition-opacity motion-reduce:data-leaving:delay-0";
const BODY =
	"flex h-6 min-w-0 items-center gap-1 rounded-sm bg-muted text-md ring-1 ring-foreground/6 ring-inset transition-[background-color,box-shadow] duration-150 select-none group-data-leaving/chip:bg-accent group-data-leaving/chip:ring-foreground/25 pointer-coarse:h-8";
/** Backspace once: the chip about to go */
const ARMED = "bg-accent ring-foreground/25";
const ROW = "relative z-10 flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-sm select-none pointer-coarse:h-11";

const REDUCE = "(prefers-reduced-motion: reduce)";
const subscribe = (f: () => void) => {
	const m = matchMedia(REDUCE);
	m.addEventListener("change", f);
	return () => m.removeEventListener("change", f);
};
const useReduced = () => useSyncExternalStore(subscribe, () => matchMedia(REDUCE).matches, () => false);
/** Rows, chips' × and the toggle keep the focus in the input */
const keep = (e: MouseEvent) => e.preventDefault();

/** The text with the typed part in semibold foreground */
function Marked({ s, q, className }: { s: string; q: string; className?: string }) {
	const rs = ranges(s, q);
	if (!rs.length) return <span className={className}>{s}</span>;
	const out: ReactNode[] = [];
	let at = 0;
	rs.forEach(([a, b], i) => {
		if (a > at) out.push(s.slice(at, a));
		out.push(
			<span key={i} className="font-semibold text-foreground">
				{s.slice(a, b)}
			</span>,
		);
		at = b;
	});
	if (at < s.length) out.push(s.slice(at));
	return <span className={className}>{out}</span>;
}

/** A count that rolls: the new number slides in from below when it grows, from above when it shrinks */
function Roll({ n }: { n: number }) {
	const last = useRef(n);
	// Set once per change, so a later render of the same number keeps its direction
	const dir = useRef<"up" | "down" | null>(null);
	if (n !== last.current) {
		dir.current = n > last.current ? "up" : "down";
		last.current = n;
	}
	return (
		<span className="inline-grid overflow-hidden tabular-nums">
			<span key={n} data-roll={dir.current ?? undefined} className={cn(dir.current && "animate-in fade-in-0 duration-200 ease-out-strong", dir.current === "up" && "motion-safe:slide-in-from-bottom-[70%]", dir.current === "down" && "motion-safe:slide-in-from-top-[70%]")}>
				{n}
			</span>
		</span>
	);
}

/** An avatar – a picture or initials – or an icon */
function Media({ o, at }: { o: ComboboxOption; at: "chip" | "row" }) {
	const size = at === "chip" ? "size-4.5 pointer-coarse:size-5.5" : "size-5";
	if (o.avatar === true)
		return (
			<span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full bg-accent text-muted-foreground", size)}>
				<span className={cn("text-2xs font-medium", at === "chip" ? "scale-80" : "scale-90")}>{initials(o.label)}</span>
			</span>
		);
	if (o.avatar) return <img src={o.avatar} alt="" className={cn("shrink-0 rounded-full object-cover", size)} />;
	if (o.icon) {
		const Icon = o.icon;
		return <Icon aria-hidden className={cn("shrink-0 text-muted-foreground", at === "chip" ? "ml-0.5 size-3.5" : "size-4")} />;
	}
	return null;
}

function Combobox({
	options,
	multiple = true,
	value,
	defaultValue,
	onChange,
	label,
	"aria-label": ariaLabel,
	placeholder = "搜索…",
	creatable,
	onCreate,
	createLabel = (t) => `添加 “${t}”`,
	maxChips,
	emptyText = "暂无选项",
	error,
	disabled,
	defaultOpen,
	inline,
	id,
	className,
}: ComboboxProps) {
	const auto = useId();
	const inputId = id ?? `combobox${auto}`;
	const listId = `${inputId}-list`;
	const labelId = `${inputId}-label`;
	const rowId = (i: number) => `${inputId}-o${i}`;

	const [inner, setInner] = useState<string[]>(defaultValue ?? []);
	const values = value ?? inner;
	/** Options made from typed text, until the host's options carry them */
	const [created, setCreated] = useState<ComboboxOption[]>([]);
	const all = useMemo(() => {
		const base = options ?? [];
		const have = new Set(base.map((o) => o.value));
		return [...base, ...created.filter((o) => !have.has(o.value))];
	}, [options, created]);
	const byValue = useMemo(() => new Map(all.map((o) => [o.value, o])), [all]);
	const optionOf = (v: string): ComboboxOption => byValue.get(v) ?? { value: v, label: v };

	const [text, setText] = useState("");
	const [open, setOpen] = useState(!!defaultOpen && !disabled);
	const ready = !error && options !== null;
	const rowsFor = (t: string) => {
		if (!ready) return { groups: [], rows: [] as Row[] };
		const groups = groupsOf(all.filter((o) => matches(o, t)));
		return { groups, rows: rowsOf(groups, creatable && canCreate(all, t) ? t.trim() : undefined) };
	};
	// biome-ignore lint/correctness/useExhaustiveDependencies: rowsFor reads only these
	const { groups, rows } = useMemo(() => rowsFor(text), [all, text, creatable, ready]);
	const [active, setActive] = useState(() => (open ? firstRow(rows) : -1));
	const current = active < rows.length ? active : -1;
	const [armed, setArmed] = useState<string | null>(null);
	const [said, setSaid] = useState("");
	const reduced = useReduced();
	const shown = open && !disabled;

	const rootRef = useRef<HTMLDivElement>(null);
	const fieldRef = useRef<HTMLDivElement>(null);
	const innerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const scrollerRef = useRef<HTMLDivElement>(null);
	const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null);
	const rowEls = useRef<(HTMLDivElement | null)[]>([]);
	const chipEls = useRef(new Map<string, HTMLLIElement>());
	const timers = useRef<number[]>([]);
	useEffect(() => () => timers.current.forEach(clearTimeout), []);
	const later = (ms: number, f: () => void) => void timers.current.push(window.setTimeout(f, ms));

	// Chips: the first maxChips values, then 「+N」; ones that went stay a moment to flash and fold
	const fitted = fit(values, maxChips);
	const lastMore = useRef(0);
	if (fitted.more) lastMore.current = fitted.more;
	const target = [...fitted.shown, ...(fitted.more ? [MORE] : [])];
	const targetKey = target.join("\u0001");
	const was = useRef(target);
	const [chips, setChips] = useState<Chip[]>(() => settle([], target));
	const pop = useRef<string[]>([]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: targetKey stands for target
	useLayoutEffect(() => {
		const prev = was.current;
		if (prev.join("\u0001") === targetKey) return;
		was.current = target;
		pop.current = target.filter((v) => !prev.includes(v));
		setChips((c) => settle(c, target));
		for (const v of prev.filter((x) => !target.includes(x))) later(reduced ? FOLD : FLASH + FOLD, () => setChips((c) => c.filter((x) => !(x.value === v && x.leaving))));
	}, [targetKey]);
	// A new chip grows its width open while it pops; under reduced motion it only fades in
	useLayoutEffect(() => {
		const fresh = pop.current;
		if (!fresh.length) return;
		pop.current = [];
		for (const v of fresh) {
			const li = chipEls.current.get(v);
			const body = li?.firstElementChild;
			if (!li || !(body instanceof HTMLElement) || typeof li.animate !== "function") continue;
			if (reduced) {
				body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: "ease-out" });
				continue;
			}
			li.animate([{ gridTemplateColumns: "0fr", marginRight: "0px" }, { gridTemplateColumns: "1fr", marginRight: "4px" }], { duration: 200, easing: EASE });
			body.animate([{ opacity: 0, transform: "scale(0.8)" }, { opacity: 1, transform: "scale(1.04)", offset: 0.6 }, { opacity: 1, transform: "none" }], { duration: 200, easing: EASE });
		}
	}, [chips]);

	// The field glides to its new height as chips wrap: it is as tall as its contents, measured
	const [fieldH, setFieldH] = useState<number>();
	const [fieldGlide, setFieldGlide] = useState(false);
	useLayoutEffect(() => {
		const el = innerRef.current;
		const f = fieldRef.current;
		if (!el || !f) return;
		const measure = () => setFieldH(el.offsetHeight + f.offsetHeight - f.clientHeight);
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		const r = requestAnimationFrame(() => setFieldGlide(true));
		return () => {
			ro.disconnect();
			cancelAnimationFrame(r);
		};
	}, []);

	// The list glides to its new height while filtering, up to its max-height
	const [listH, setListH] = useState<number>();
	useLayoutEffect(() => {
		const c = contentEl;
		const s = scrollerRef.current;
		if (!c || !s) return;
		const measure = () => {
			const max = Number.parseFloat(getComputedStyle(s).maxHeight);
			setListH(Math.min(c.offsetHeight, Number.isFinite(max) ? max : Number.POSITIVE_INFINITY));
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(c);
		return () => ro.disconnect();
	}, [contentEl]);
	// Glides start a frame after the list shows: it opens at its height, the highlight on its row
	const [glide, setGlide] = useState(false);
	useLayoutEffect(() => {
		setGlide(false);
		if (!shown) return;
		const r = requestAnimationFrame(() => setGlide(true));
		return () => cancelAnimationFrame(r);
	}, [shown, contentEl]);

	// The highlight under the active row
	const [pill, setPill] = useState<{ y: number; h: number } | null>(null);
	useLayoutEffect(() => {
		const el = current >= 0 ? rowEls.current[current] : null;
		if (!el) return setPill(null);
		const y = el.offsetTop;
		const h = el.offsetHeight;
		setPill((p) => (p && p.y === y && p.h === h ? p : { y, h }));
	});
	// Keys keep the active row in view – and its group's heading, going up into it
	const reveal = useRef(false);
	useLayoutEffect(() => {
		if (!reveal.current) return;
		reveal.current = false;
		const s = scrollerRef.current;
		const el = current >= 0 ? rowEls.current[current] : null;
		if (!s || !el) return;
		if (current === firstRow(rows)) {
			s.scrollTop = 0;
			return;
		}
		const head = el.previousElementSibling;
		const top = head instanceof HTMLElement && head.dataset.heading !== undefined ? head.offsetTop : el.offsetTop;
		const bottom = el.offsetTop + el.offsetHeight;
		if (top < s.scrollTop) s.scrollTop = top - 4;
		else if (bottom > s.scrollTop + s.clientHeight) s.scrollTop = bottom - s.clientHeight + 4;
	});

	const show = (at?: number) => {
		if (disabled || open) return;
		setOpen(true);
		setActive(at ?? firstRow(rows));
	};
	const hide = () => {
		setOpen(false);
		setArmed(null);
	};
	const toTop = () => {
		if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
	};

	const commit = (next: string[], kind: "picked" | "removed" | "created", name: string, made?: ComboboxOption) => {
		if (value === undefined) setInner(next);
		onChange?.(
			next,
			next.map((v) => (made?.value === v ? made : optionOf(v))),
		);
		setSaid(announce(kind, name, next.length, multiple));
		setArmed(null);
	};
	// After a pick the typed text clears; one value closes the list
	const after = (i: number) => {
		if (!multiple) {
			hide();
			setText("");
			return;
		}
		if (text) {
			setText("");
			setActive(firstRow(rowsFor("").rows));
			toTop();
		} else setActive(i);
	};
	const pickRow = (row: Row, i: number) => {
		if (disabled) return;
		if (row.kind === "create") {
			const o = onCreate?.(row.text) || { value: row.text, label: row.text };
			if (!byValue.has(o.value)) setCreated((c) => [...c, o]);
			commit(values.includes(o.value) ? values : multiple ? [...values, o.value] : [o.value], "created", o.label, o);
			after(i);
			return;
		}
		const o = row.option;
		if (o.disabled) return;
		const next = toggle(values, o.value, multiple);
		commit(next, next.includes(o.value) ? "picked" : "removed", o.label);
		after(i);
	};
	const remove = (v: string) => commit(values.filter((x) => x !== v), "removed", optionOf(v).label);

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		// An input method is composing: its keys pick a word, not a row
		if (e.nativeEvent.isComposing || e.keyCode === 229) return;
		if (e.key !== "Backspace" && armed) setArmed(null);
		switch (e.key) {
			case "ArrowDown":
			case "ArrowUp": {
				e.preventDefault();
				if (!open) return show(e.key === "ArrowUp" ? (move(rows, -1, "ArrowUp") ?? -1) : undefined);
				const to = move(rows, current, e.key);
				if (to !== null) {
					reveal.current = true;
					setActive(to);
				}
				return;
			}
			case "Home":
			case "End": {
				if (!open) return;
				e.preventDefault();
				const to = move(rows, current, e.key);
				if (to !== null) {
					reveal.current = true;
					setActive(to);
				}
				return;
			}
			case "Enter": {
				if (!open) {
					e.preventDefault();
					return show();
				}
				const row = rows[current];
				if (row) {
					e.preventDefault();
					pickRow(row, current);
				}
				return;
			}
			case "Escape":
				if (open) {
					e.preventDefault();
					hide();
				} else if (text) {
					e.preventDefault();
					setText("");
				}
				return;
			case "Tab":
				if (open) hide();
				return;
			case "Backspace": {
				const el = e.currentTarget;
				if (text || !values.length || el.selectionStart !== 0 || el.selectionEnd !== 0) return;
				e.preventDefault();
				const last = values[values.length - 1]!;
				if (armed === last) return remove(last);
				setArmed(last);
				setSaid(announce("armed", optionOf(last).label, values.length, multiple));
			}
		}
	};

	const armedNow = armed && values.includes(armed) ? armed : null;
	const field = (
		<div
			ref={fieldRef}
			data-slot="combobox-field"
			onMouseDown={(e) => {
				if (e.target !== inputRef.current) e.preventDefault();
			}}
			onClick={() => {
				if (disabled) return;
				inputRef.current?.focus();
				show();
			}}
			style={{ height: fieldH }}
			className={cn(
				"relative w-full cursor-text overflow-hidden rounded-lg border border-input bg-transparent transition-[border-color,box-shadow] duration-200 ease-out-strong dark:bg-field/30 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50",
				fieldGlide && "motion-safe:transition-[border-color,box-shadow,height]",
				disabled && "pointer-events-none cursor-not-allowed bg-field/50 opacity-50",
			)}
		>
			<div ref={innerRef} className="flex flex-wrap items-center gap-y-1 py-[3px] pr-8 pl-[3px] pointer-coarse:py-[5px] pointer-coarse:pr-11 pointer-coarse:pl-[5px]">
				<ul aria-label="已选" className="contents">
					{chips.map((c) => {
						const ref = (el: HTMLLIElement | null) => {
							if (el) chipEls.current.set(c.value, el);
							else chipEls.current.delete(c.value);
						};
						if (c.value === MORE) {
							const n = fitted.more || lastMore.current;
							return (
								<li key={MORE} ref={ref} data-leaving={c.leaving || undefined} className={LI}>
									<span className={cn(BODY, "px-1.5 text-muted-foreground", armedNow && !fitted.shown.includes(armedNow) && ARMED)}>
										<span aria-hidden>
											+<Roll n={n} />
										</span>
										<span className="sr-only">还有 {n} 项</span>
									</span>
								</li>
							);
						}
						const o = optionOf(c.value);
						return (
							<li key={c.value} ref={ref} data-leaving={c.leaving || undefined} aria-hidden={c.leaving || undefined} className={LI}>
								<span className={cn(BODY, "pr-0.5 pl-1", armedNow === c.value && ARMED)}>
									<Media o={o} at="chip" />
									<span className="min-w-0 truncate px-0.5">{o.label}</span>
									<button
										type="button"
										tabIndex={-1}
										aria-label={`移除 ${o.label}`}
										onMouseDown={keep}
										onClick={(e) => {
											e.stopPropagation();
											remove(c.value);
										}}
										className={cn("grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground", HIT)}
									>
										<X className="size-3.5" />
									</button>
								</span>
							</li>
						);
					})}
				</ul>
				<input
					ref={inputRef}
					id={inputId}
					role="combobox"
					aria-expanded={shown}
					aria-controls={shown ? listId : undefined}
					aria-autocomplete="list"
					aria-activedescendant={shown && current >= 0 ? rowId(current) : undefined}
					aria-label={label ? undefined : ariaLabel}
					// Popsheet leaves Esc to us while there's something to close or clear
					data-escape={shown || text ? "local" : undefined}
					autoComplete="off"
					autoCorrect="off"
					autoCapitalize="off"
					spellCheck={false}
					enterKeyHint="done"
					disabled={disabled}
					value={text}
					placeholder={values.length ? undefined : placeholder}
					onChange={(e) => {
						const t = e.target.value;
						setText(t);
						setArmed(null);
						if (!disabled) setOpen(true);
						setActive(firstRow(rowsFor(t).rows));
						toTop();
					}}
					onKeyDown={onKeyDown}
					onBlur={(e) => {
						if (!rootRef.current?.contains(e.relatedTarget as Node | null)) hide();
					}}
					className="h-6 min-w-16 flex-1 bg-transparent px-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed pointer-coarse:h-8 pointer-coarse:text-base"
				/>
			</div>
			<button
				type="button"
				tabIndex={-1}
				aria-label={shown ? "收起列表" : "展开列表"}
				disabled={disabled}
				onMouseDown={keep}
				onClick={(e) => {
					e.stopPropagation();
					inputRef.current?.focus();
					if (open) hide();
					else show();
				}}
				className="absolute top-[3px] right-[3px] grid size-6 place-items-center rounded-sm text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground pointer-coarse:top-[5px] pointer-coarse:right-[5px] pointer-coarse:size-8"
			>
				<ChevronDown className={cn("size-4 transition-transform duration-200 ease-out-strong motion-reduce:transition-none", shown && "rotate-180")} />
			</button>
		</div>
	);

	const hasOptions = rows.some((r) => r.kind === "option");
	const message = error ? (
		<div className="px-2 py-3 text-md text-destructive-strong">{error}</div>
	) : options === null ? (
		<div aria-hidden className="flex flex-col">
			{[40, 56, 32].map((w) => (
				<div key={w} className="flex h-8 items-center gap-2 px-2 pointer-coarse:h-11">
					<Skeleton className="size-5 rounded-full" />
					<Skeleton className="h-3.5" style={{ width: `${w}%` }} />
				</div>
			))}
		</div>
	) : hasOptions ? null : (
		<div className={cn("animate-in px-2 text-center text-md text-muted-foreground fade-in-0 duration-200 ease-out-strong motion-safe:slide-in-from-bottom-0.5", rows.length ? "pt-2.5 pb-2" : "py-6")}>{text.trim() ? "无匹配结果" : emptyText}</div>
	);

	let n = 0;
	const rowEl = (o: ComboboxOption) => {
		const i = n++;
		const picked = values.includes(o.value);
		return (
			<div
				key={o.value}
				ref={(el) => {
					rowEls.current[i] = el;
				}}
				id={rowId(i)}
				role="option"
				aria-selected={picked}
				aria-disabled={o.disabled || undefined}
				data-active={i === current || undefined}
				onPointerMove={() => {
					if (!o.disabled && i !== current) setActive(i);
				}}
				onClick={() => pickRow({ kind: "option", option: o }, i)}
				className={cn(ROW, o.disabled && "opacity-50")}
			>
				<Media o={o} at="row" />
				<span className="flex min-w-0 flex-1 items-baseline gap-2">
					<Marked s={o.label} q={text} className="max-w-full shrink-0 truncate" />
					{o.hint && <Marked s={o.hint} q={text} className="min-w-0 truncate text-xs text-muted-foreground" />}
				</span>
				<Check aria-hidden className={cn("size-4 shrink-0 transition-[opacity,scale] duration-150 motion-reduce:transition-opacity", picked ? "scale-100 opacity-100 ease-out-strong" : "scale-50 opacity-0 ease-in-strong motion-reduce:scale-100")} />
			</div>
		);
	};
	const createRow = rows[rows.length - 1]?.kind === "create" ? (rows[rows.length - 1] as Extract<Row, { kind: "create" }>) : null;
	const panel = (
		<div onMouseDown={keep} className="flex min-h-0 flex-col">
			<div ref={scrollerRef} data-slot="combobox-list" style={{ height: listH }} className={cn("max-h-75 overflow-y-auto overscroll-contain pointer-coarse:max-h-[min(22rem,45svh)]", glide && "motion-safe:transition-[height] motion-safe:duration-200 motion-safe:ease-out-strong")}>
				<div ref={setContentEl} className="relative p-1">
					{pill && (
						<span
							aria-hidden
							// Reduced motion: no glide – the highlight fades in at its row
							key={reduced ? current : "pill"}
							style={{ translate: `0 ${pill.y}px`, height: pill.h }}
							className={cn(
								"pointer-events-none absolute inset-x-1 top-0 rounded-md bg-accent",
								reduced ? "animate-in fade-in-0 transition-none duration-150" : glide && "transition-[translate,height] duration-200 ease-out-strong",
							)}
						/>
					)}
					{message}
					<div id={listId} role="listbox" aria-multiselectable={multiple || undefined} aria-labelledby={label ? labelId : undefined} aria-label={label ? undefined : ariaLabel} aria-busy={options === null || undefined}>
						{groups.map((g, gi) => (
							<div key={g.name ?? "\u0000"} role={g.name ? "group" : "presentation"} aria-labelledby={g.name ? `${inputId}-g${gi}` : undefined}>
								{g.name && (
									<div id={`${inputId}-g${gi}`} data-heading="" className={cn("px-2 pb-1 text-xs font-medium text-muted-foreground", gi === 0 ? "pt-1" : "pt-2.5")}>
										{g.name}
									</div>
								)}
								{g.options.map(rowEl)}
							</div>
						))}
						{createRow &&
							(() => {
								const i = rows.length - 1;
								return (
									<div
										key="create"
										ref={(el) => {
											rowEls.current[i] = el;
										}}
										id={rowId(i)}
										role="option"
										aria-selected={false}
										data-active={i === current || undefined}
										onPointerMove={() => {
											if (i !== current) setActive(i);
										}}
										onClick={() => pickRow(createRow, i)}
										className={cn(ROW, "animate-in fade-in-0 duration-200 ease-out-strong motion-safe:slide-in-from-bottom-0.5")}
									>
										<span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-full border border-dashed border-muted-foreground/60 text-muted-foreground">
											<Plus className="size-3" />
										</span>
										<span className="min-w-0 truncate">{createLabel(createRow.text)}</span>
									</div>
								);
							})()}
					</div>
				</div>
			</div>
			{multiple && ready && (
				<div aria-hidden className="flex h-8 shrink-0 items-center justify-between gap-3 border-t px-2.5 text-xs text-muted-foreground">
					<span className="whitespace-nowrap">
						已选 <Roll n={values.length} /> 项
					</span>
					<span className="flex items-center gap-1 whitespace-nowrap pointer-coarse:hidden">
						<Kbd>↑</Kbd>
						<Kbd>↓</Kbd>
						<span className="mr-1.5 ml-0.5">移动</span>
						<Kbd>↵</Kbd>
						<span className="ml-0.5">选择</span>
					</span>
				</div>
			)}
		</div>
	);

	return (
		<div ref={rootRef} data-slot="combobox" className={cn("flex w-full min-w-0 flex-col", className)}>
			{label && (
				<label id={labelId} htmlFor={inputId} className="mb-1.5 text-md font-medium">
					{label}
				</label>
			)}
			{inline ? (
				field
			) : (
				<Popover
					open={shown}
					onOpenChange={(o) => {
						if (!o) hide();
					}}
				>
					<PopoverAnchor asChild>{field}</PopoverAnchor>
					<PopoverContent
						role="presentation"
						side="bottom"
						align="start"
						sideOffset={6}
						collisionPadding={8}
						onOpenAutoFocus={(e) => e.preventDefault()}
						onCloseAutoFocus={(e) => e.preventDefault()}
						// The input handles Esc: close, then clear
						onEscapeKeyDown={(e) => e.preventDefault()}
						onInteractOutside={(e) => {
							if (rootRef.current?.contains(e.target as Node)) e.preventDefault();
						}}
						// The popover's own motion is 95% and 8px in 100ms. cn can't merge tw-animate classes, so these win by being more specific
						className="w-(--radix-popover-trigger-width) gap-0 overflow-hidden p-0 transition-none duration-200 ease-out-strong data-closed:duration-150 data-closed:ease-in-strong [&[data-state=open]]:zoom-in-98 [&[data-state=closed]]:zoom-out-100 [&[data-side=bottom][data-state=open]]:slide-in-from-top-1 [&[data-side=top][data-state=open]]:slide-in-from-bottom-1 motion-reduce:[&[data-slot][data-state=open]]:zoom-in-100 motion-reduce:[&[data-slot][data-side=bottom][data-state=open]]:slide-in-from-top-0 motion-reduce:[&[data-slot][data-side=top][data-state=open]]:slide-in-from-bottom-0"
					>
						{panel}
					</PopoverContent>
				</Popover>
			)}
			{inline && (
				<div
					inert={!shown}
					data-slot="combobox-inline"
					className={cn(
						"grid transition-[grid-template-rows,opacity] motion-reduce:transition-opacity",
						shown ? "grid-rows-[1fr] duration-200 ease-out-strong" : "grid-rows-[0fr] opacity-0 duration-150 ease-in-strong",
					)}
				>
					<div className="min-h-0 overflow-hidden">
						<div className="mt-1.5 flex flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground">{panel}</div>
					</div>
				</div>
			)}
			<span role="status" className="sr-only">
				{said}
			</span>
		</div>
	);
}

export { Combobox };
