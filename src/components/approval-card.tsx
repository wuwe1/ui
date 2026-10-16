// ApprovalCard: an agent asks before it acts. A white card says what – the action, its object, a preview, the key facts;
// a gray tray under it holds the decision – time left, 「拒绝…」, 「允许」. Answered, the card folds into one line.
// The card never decides on its own: the host owns the deadline and the outcome, and passes status back.
import { Check, type LucideIcon, Shield, X } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Badge } from "./badge.tsx";
import { Button } from "./button.tsx";
import { Input } from "./input.tsx";
import { Kbd } from "./kbd.tsx";
import { Chevron } from "./placeholder.tsx";
import { Spinner } from "./spinner.tsx";
import { type ApprovalStatus, left, OUTCOME } from "../lib/approval.ts";
import { cn } from "../lib/utils.ts";

export type { ApprovalStatus } from "../lib/approval.ts";

const MOD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl ";
const RISK = { low: ["低风险", "bg-secondary text-muted-foreground"], medium: ["中风险", "bg-waiting-subtle text-waiting-strong"], high: ["高风险", "bg-destructive-subtle text-destructive-strong"] } as const;

/** Time left: gray, amber in the last minute, ticking every second only then */
function Countdown({ until, id }: { until: number; id: string }) {
	const [now, setNow] = useState(() => Date.now());
	const l = left(until, now);
	useEffect(() => {
		const t = setTimeout(() => setNow(Date.now()), l.soon ? 1000 : 15_000);
		return () => clearTimeout(t);
	}, [now, l.soon]);
	return (
		<span id={id} className={cn("text-2xs tabular-nums", l.soon ? "text-waiting-strong" : "text-muted-foreground")} title="到时未处理会自动拒绝">
			{l.text}
		</span>
	);
}

type Keys = { approve: (() => void) | null; deny: () => void };

/**
 * ⌘↵ and Esc anywhere on the page, for the one card that should answer them. Captured first, so a composer's ⌘↵ doesn't also send;
 * skipped while typing in a field with text, or with a dialog open
 */
function useGlobalKeys(on: boolean, keys: { current: Keys }) {
	useEffect(() => {
		if (!on) return;
		const down = (e: globalThis.KeyboardEvent) => {
			if (e.defaultPrevented || document.querySelector('[aria-modal="true"]')) return;
			const t = e.target as HTMLElement | null;
			if (t?.isContentEditable || ((t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) && t.value !== "")) return;
			const go = e.key === "Enter" && (e.metaKey || e.ctrlKey) ? keys.current.approve : e.key === "Escape" ? keys.current.deny : null;
			if (!go) return;
			e.preventDefault();
			e.stopPropagation();
			go();
		};
		document.addEventListener("keydown", down, true);
		return () => document.removeEventListener("keydown", down, true);
	}, [on, keys]);
}

type ApprovalCardProps = {
	/** The action – 「运行命令」, 「修改文件」; names the card */
	title: string;
	/** Its object or the agent's note, one line */
	description?: ReactNode;
	icon?: LucideIcon;
	/** On the tray above the card – where the request comes from */
	label?: ReactNode;
	risk?: "low" | "medium" | "high";
	/** A command or file content, shown monospace */
	code?: string;
	/** Anything richer than code – a diff */
	preview?: ReactNode;
	/** Key facts as rows */
	details?: { label: string; value: ReactNode }[];
	/** The full arguments, behind 「完整参数」 */
	args?: string;
	/** Anything else inside the card – a plan, questions */
	children?: ReactNode;
	/** The deadline, in ms since the epoch: shows 「剩 N 分钟」 */
	until?: number;
	/** Anything but pending folds the card into one line */
	status?: ApprovalStatus;
	/** Leave out for requests answered inside the card. A promise locks the card until it settles; a rejection unlocks it */
	onApprove?: (o: { always: boolean }) => unknown;
	onDeny?: (o: { reason?: string }) => unknown;
	approveLabel?: string;
	approveIcon?: LucideIcon;
	approveDisabled?: boolean;
	denyLabel?: string;
	/** Placeholder of the reason field 「拒绝…」 opens; false – deny at once */
	reason?: string | false;
	/** Label of an 「始终允许」 checkbox; shows it */
	always?: string;
	onEdit?: () => void;
	/** Where ⌘↵ and Esc work: inside the card, anywhere on the page (one card at a time), or not at all */
	keys?: "focus" | "global" | "none";
	/** ⌘↵ approves. false for requests that need a look first */
	quick?: boolean;
	className?: string;
};

function ApprovalCard({
	title,
	description,
	icon: I = Shield,
	label,
	risk,
	code,
	preview,
	details,
	args,
	children,
	until,
	status = "pending",
	onApprove,
	onDeny,
	approveLabel = "允许",
	approveIcon: A = Check,
	approveDisabled,
	denyLabel = "拒绝",
	reason = "说明原因（可选）",
	always,
	onEdit,
	keys = "focus",
	quick = true,
	className,
}: ApprovalCardProps) {
	const id = useId();
	const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
	// The reason field: null while closed
	const [why, setWhy] = useState<string | null>(null);
	const [full, setFull] = useState(false);
	const [alw, setAlw] = useState(false);
	const done = status !== "pending";

	const act = async (kind: "approve" | "deny") => {
		if (busy || done) return;
		setBusy(kind);
		try {
			await (kind === "approve" ? onApprove?.({ always: alw }) : onDeny?.({ reason: why?.trim() || undefined }));
		} catch {
			// The host says what went wrong; the card goes back to waiting
		}
		setBusy(null);
	};
	// Closing the reason field puts focus back on 「拒绝…」, which opened it
	const denyRef = useRef<HTMLButtonElement>(null);
	const close = () => {
		setWhy(null);
		requestAnimationFrame(() => denyRef.current?.focus());
	};
	const deny = () => (reason === false ? act("deny") : why === null ? setWhy("") : close());
	const canQuick = quick && !!onApprove && !approveDisabled;
	const handlers = useRef<Keys>({ approve: null, deny });
	handlers.current = { approve: canQuick ? () => act("approve") : null, deny };
	useGlobalKeys(keys === "global" && !done, handlers);
	const onKey = (e: KeyboardEvent) => {
		const go = e.key === "Enter" && (e.metaKey || e.ctrlKey) ? handlers.current.approve : e.key === "Escape" ? handlers.current.deny : null;
		if (!go) return;
		e.preventDefault();
		go();
	};
	const hints = keys !== "none";

	return (
		<div
			role="group"
			aria-labelledby={`${id}-t`}
			aria-describedby={[description ? `${id}-d` : "", until !== undefined && !done ? `${id}-c` : ""].join(" ").trim() || undefined}
			data-slot="approval-card"
			data-status={status}
			onKeyDown={keys === "focus" && !done ? onKey : undefined}
			className={cn("flex flex-col", className)}
		>
			{/* Answered: the card folds away under the one-line outcome */}
			<div className={cn("grid transition-[grid-template-rows,opacity] duration-200 ease-out-strong motion-reduce:transition-none", done ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]")} inert={done || undefined}>
				<div className="min-h-0 overflow-hidden">
					<div className="flex flex-col gap-1.5 rounded-2xl bg-muted p-1.5">
						{label && <div className="truncate px-2 pt-0.5 text-2xs text-muted-foreground">{label}</div>}
						<div className="flex flex-col gap-3 rounded-xl border bg-card p-3 text-card-foreground shadow-xs">
							<div className="flex items-start gap-3">
								<span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background">
									<I className="size-4 text-waiting-strong" aria-hidden />
								</span>
								<div className="flex min-w-0 flex-1 flex-col">
									<span id={`${id}-t`} className="truncate text-sm font-medium">
										{title}
									</span>
									{description && (
										<span id={`${id}-d`} className="truncate text-xs text-muted-foreground" title={typeof description === "string" ? description : undefined}>
											{description}
										</span>
									)}
								</div>
								{risk && <Badge className={cn("shrink-0 border-transparent", RISK[risk][1])}>{RISK[risk][0]}</Badge>}
							</div>
							{(code || preview || !!details?.length) && (
								<div className="flex flex-col overflow-hidden rounded-lg border">
									{code && <pre className="max-h-48 overflow-auto bg-muted/40 p-2.5 font-mono text-xs leading-code whitespace-pre-wrap break-all">{code}</pre>}
									{preview && <div className="max-h-64 overflow-auto">{preview}</div>}
									{!!details?.length && (
										<dl className={cn("grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-3 py-2 text-xs", (code || preview) && "border-t")}>
											{details.map((d) => (
												<div key={d.label} className="contents">
													<dt className="text-muted-foreground">{d.label}</dt>
													<dd className="min-w-0 truncate">{d.value}</dd>
												</div>
											))}
										</dl>
									)}
								</div>
							)}
							{children}
							{args && (
								<div className="flex flex-col gap-1">
									<button type="button" aria-expanded={full} onClick={() => setFull((f) => !f)} className="flex w-fit items-center gap-1 rounded-sm text-2xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50">
										<Chevron open={full} />
										完整参数
									</button>
									{full && <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-2.5 font-mono text-xs leading-code whitespace-pre-wrap break-all">{args}</pre>}
								</div>
							)}
							{always && onApprove && (
								<label className="flex w-fit items-center gap-2 text-xs text-muted-foreground">
									<input type="checkbox" checked={alw} onChange={(e) => setAlw(e.target.checked)} disabled={!!busy} className="size-4 accent-primary" />
									{always}
								</label>
							)}
						</div>
						{why !== null && (
							<Input
								autoFocus
								value={why}
								disabled={!!busy}
								onChange={(e) => setWhy(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") act("deny");
									if (e.key === "Escape") {
										e.stopPropagation();
										close();
									}
								}}
								placeholder={reason || undefined}
								aria-label="拒绝的原因"
								className="bg-background"
							/>
						)}
						<div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-1.5 pb-0.5">
							{until !== undefined && !done && <Countdown until={until} id={`${id}-c`} />}
							<div className="ml-auto flex w-full gap-2 md:w-auto">
								{why !== null ? (
									<>
										<Button variant="ghost" className="h-11 flex-1 md:h-8 md:flex-none" disabled={!!busy} onClick={close}>
											取消
										</Button>
										<Button variant="outline" className="h-11 flex-1 bg-background md:h-8 md:flex-none" disabled={!!busy} onClick={() => act("deny")}>
											{busy === "deny" ? <Spinner /> : <X />}
											{denyLabel}
										</Button>
									</>
								) : (
									<>
										{onEdit && (
											<Button variant="ghost" className="h-11 md:h-8" disabled={!!busy} onClick={onEdit}>
												编辑
											</Button>
										)}
										<Button ref={denyRef} variant="outline" className="h-11 flex-1 bg-background md:h-8 md:flex-none" disabled={!!busy} onClick={deny} aria-keyshortcuts={hints ? "Escape" : undefined}>
											{busy === "deny" ? <Spinner /> : <X />}
											{denyLabel}
											{reason !== false && "…"}
											{hints && <Kbd className="ml-1 hidden md:inline-flex">Esc</Kbd>}
										</Button>
										{onApprove && (
											<Button className="h-11 flex-1 md:h-8 md:flex-none" disabled={!!busy || approveDisabled} onClick={() => act("approve")} aria-keyshortcuts={hints && canQuick ? "Meta+Enter" : undefined}>
												{busy === "approve" ? <Spinner /> : <A />}
												{approveLabel}
												{hints && canQuick && <Kbd className="ml-1 hidden bg-primary-foreground/15 text-primary-foreground/80 md:inline-flex">{MOD}↵</Kbd>}
											</Button>
										)}
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
			{done && (
				<div role="status" className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-md animate-in fade-in duration-200">
					{status === "approved" ? <Check className="size-4 shrink-0 text-muted-foreground" aria-hidden /> : <X className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
					<span className="shrink-0 text-muted-foreground">{OUTCOME[status]}</span>
					<span className="shrink-0">{title}</span>
					{typeof description === "string" && <span className="min-w-0 truncate text-xs text-muted-foreground">{description}</span>}
				</div>
			)}
		</div>
	);
}

export { ApprovalCard };
