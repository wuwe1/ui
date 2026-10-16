// Dictation: speak instead of type – the browser's speech recognition (Safari and Chrome ship it; the words go to their servers).
// Words still being heard show gray (Composer's interim); once final they join the text. Tap again to stop, Esc throws away what's still gray.
// Where the browser can't, the button isn't there at all.
import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./button.tsx";
import { cn } from "../lib/utils.ts";

// The Web Speech API isn't in TypeScript's DOM types
type Result = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	onresult: ((e: { resultIndex: number; results: ArrayLike<Result> }) => void) | null;
	onerror: ((e: { error: string }) => void) | null;
	onend: (() => void) | null;
	start: () => void;
	stop: () => void;
	abort: () => void;
};
type Ctor = new () => Recognition;
const ctor = (): Ctor | null => {
	if (typeof window === "undefined") return null;
	const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export type Dictation = { supported: boolean; listening: boolean; interim: string; toggle: () => void; cancel: () => void };

/**
 * onText – words that are final, in order. onError – recognition failed: 「not-allowed」 when the microphone was refused.
 * Keeps listening across pauses until stopped
 */
export function useDictation({ lang = "zh-CN", onText, onError }: { lang?: string; onText: (text: string) => void; onError?: (error: string) => void }): Dictation {
	const [listening, setListening] = useState(false);
	const [interim, setInterim] = useState("");
	const rec = useRef<Recognition | null>(null);
	const cb = useRef({ onText, onError });
	cb.current = { onText, onError };
	const [supported] = useState(() => !!ctor());
	useEffect(() => () => rec.current?.abort(), []);
	const start = () => {
		const C = ctor();
		if (!C) return;
		const r = new C();
		r.lang = lang;
		r.continuous = true;
		r.interimResults = true;
		r.onresult = (e) => {
			let gray = "";
			for (let i = e.resultIndex; i < e.results.length; i++) {
				const res = e.results[i];
				if (!res) continue;
				if (res.isFinal) cb.current.onText(res[0].transcript);
				else gray += res[0].transcript;
			}
			setInterim(gray);
		};
		r.onerror = (e) => {
			if (e.error !== "aborted" && e.error !== "no-speech") cb.current.onError?.(e.error);
		};
		r.onend = () => {
			rec.current = null;
			setListening(false);
			setInterim("");
		};
		rec.current = r;
		r.start();
		setListening(true);
	};
	return {
		supported,
		listening,
		interim,
		toggle: () => (rec.current ? rec.current.stop() : start()),
		cancel: () => {
			rec.current?.abort();
			setInterim("");
		},
	};
}

/** The microphone. Listening: pressed, a ripple around it; Esc anywhere cancels */
export function DictationButton({ dictation: d, className }: { dictation: Dictation; className?: string }) {
	useEffect(() => {
		if (!d.listening) return;
		const esc = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			e.preventDefault();
			d.cancel();
		};
		document.addEventListener("keydown", esc, true);
		return () => document.removeEventListener("keydown", esc, true);
	}, [d.listening, d]);
	if (!d.supported) return null;
	return (
		<Button
			variant={d.listening ? "secondary" : "ghost"}
			size="icon-sm"
			aria-pressed={d.listening}
			aria-label={d.listening ? "停止语音输入" : "语音输入"}
			title={d.listening ? "停止语音输入（Esc 放弃）" : "语音输入"}
			onClick={d.toggle}
			className={cn("relative shrink-0", d.listening ? "text-foreground" : "text-muted-foreground", className)}
		>
			{d.listening && <span className="absolute inset-0 animate-ping rounded-md bg-foreground/10 motion-reduce:animate-none" aria-hidden />}
			<Mic className="relative size-4" />
		</Button>
	);
}
