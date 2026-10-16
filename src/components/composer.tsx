// Composer: where a message to an agent is written. A white card says what to send and how – attachments on top, the text, a row of controls
// with send at the end; a gray tray around it says what the conversation is doing now, and only shows while there's something to say.
// It's a shell: the host fills the slots (attachments, settings, add, context) and owns the draft, sending and stopping.
// ↵ sends with a keyboard, ⇧↵ breaks the line; on a touch screen ↵ is a new line and the button sends. Never mid input method.
import { ArrowUp, Square } from "lucide-react";
import { type ClipboardEvent, type ReactNode, type Ref, useEffect, useRef, useState } from "react";
import { Button } from "./button.tsx";
import { Spinner } from "./spinner.tsx";
import { Textarea } from "./textarea.tsx";
import { submits } from "../lib/composer.ts";
import { cn } from "../lib/utils.ts";

type ComposerProps = {
	value: string;
	onValueChange: (value: string) => void;
	onSubmit: () => void;
	placeholder?: string;
	/** sm – under a conversation, low; lg – a dialog's, taller */
	size?: "sm" | "lg";
	autoFocus?: boolean;
	textareaRef?: Ref<HTMLTextAreaElement>;
	/** What the conversation is doing now – in the tray above the card. null hides the tray */
	tray?: ReactNode;
	/** Inside the card, above the text: attachments */
	top?: ReactNode;
	/** Words being heard, gray under the text until they're final */
	interim?: string;
	/** Left of the control row: add, settings */
	start?: ReactNode;
	/** Right of the control row, before send: context, dictation */
	end?: ReactNode;
	/** The send button. busy – sending; disabled – nothing to send */
	send: { label: string; icon?: ReactNode; title?: string; disabled?: boolean; busy?: boolean };
	/** While a run goes: with nothing typed, the send button stops it. stopping – asked, not stopped yet */
	stop?: { onStop: () => void; stopping: boolean };
	onPaste?: (e: ClipboardEvent<HTMLTextAreaElement>) => void;
	className?: string;
};

const touchScreen = () => typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;

function Composer({ value, onValueChange, onSubmit, placeholder, size = "sm", autoFocus, textareaRef, tray, top, interim, start, end, send, stop, onPaste, className }: ComposerProps) {
	const sm = size === "sm";
	const own = useRef<HTMLTextAreaElement | null>(null);
	const [touch] = useState(touchScreen);
	// The tray keeps its last words while it folds away
	const last = useRef<ReactNode>(null);
	if (tray) last.current = tray;
	const traying = !!tray;
	const showStop = !!stop && !value.trim() && !send.busy;
	const setRef = (el: HTMLTextAreaElement | null) => {
		own.current = el;
		if (typeof textareaRef === "function") textareaRef(el);
		else if (textareaRef) textareaRef.current = el;
	};
	// Dictated words land at the end: keep the caret there
	useEffect(() => {
		if (interim && own.current) own.current.scrollTop = own.current.scrollHeight;
	}, [interim]);
	return (
		<div data-slot="composer" className={cn("flex w-full flex-col rounded-2xl p-1 transition-colors duration-300 motion-reduce:transition-none", traying ? "bg-muted" : "bg-transparent", className)}>
			<div className={cn("grid transition-[grid-template-rows] duration-300 ease-out-strong motion-reduce:transition-none", traying ? "grid-rows-[1fr]" : "grid-rows-[0fr]")} inert={!traying} aria-hidden={!traying || undefined}>
				<div className="min-h-0 overflow-hidden">
					<div className="flex min-w-0 items-center gap-3 px-1.5 pt-0.5 pb-1.5 text-2xs text-muted-foreground tabular-nums">{last.current}</div>
				</div>
			</div>
			{/* A click anywhere on the card that isn't a control puts the caret in the text */}
			<div
				onPointerDown={(e) => {
					if (e.target === e.currentTarget) {
						e.preventDefault();
						own.current?.focus();
					}
				}}
				className={cn(
					"flex cursor-text flex-col rounded-xl border bg-card shadow-xs transition-[border-color,box-shadow] duration-150",
					sm ? "gap-1 p-1.5 focus-within:border-ring" : "gap-2 p-2 focus-within:ring-3 focus-within:ring-ring/30",
				)}
			>
				{top}
				<Textarea
					ref={setRef}
					autoFocus={autoFocus}
					value={value}
					onChange={(e) => onValueChange(e.target.value)}
					onKeyDown={(e) => {
						if (!submits({ ...e, isComposing: e.nativeEvent.isComposing, keyCode: e.keyCode }, touch)) return;
						e.preventDefault();
						if (!send.disabled && !send.busy) onSubmit();
					}}
					onPaste={onPaste}
					placeholder={placeholder}
					enterKeyHint={touch ? "enter" : "send"}
					aria-keyshortcuts={touch ? "Meta+Enter" : "Enter"}
					className={cn("resize-none border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0 dark:bg-transparent", sm ? "max-h-48 min-h-9" : "max-h-[40svh] min-h-24")}
				/>
				{interim && (
					<p aria-live="polite" className="-mt-1 px-2 pb-1 text-md text-muted-foreground">
						{interim}
					</p>
				)}
				<div className={cn("flex min-w-0 items-center", sm ? "gap-1" : "gap-1.5")}>
					{start}
					<span className="ml-auto" />
					{end}
					{showStop && stop ? (
						<Button size="icon" variant="outline" className="shrink-0 rounded-lg" disabled={stop.stopping} onClick={stop.onStop} aria-label={stop.stopping ? "停止中" : "停止"} title={stop.stopping ? "正在停止…" : "停止这一轮"}>
							{stop.stopping ? <Spinner /> : <Square className="size-3.5 fill-current" />}
						</Button>
					) : (
						<Button size="icon" className="shrink-0 rounded-lg" disabled={send.disabled || send.busy} aria-busy={send.busy || undefined} onClick={onSubmit} aria-label={send.label} title={send.title ?? (touch ? send.label : `${send.label}（↵）`)}>
							{send.busy ? <Spinner /> : (send.icon ?? <ArrowUp className="size-4" />)}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

export { Composer };
