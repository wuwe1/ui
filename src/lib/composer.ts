// What Composer decides on its own: whether a key sends or pulls back a queued message, and how heard words join what's typed. Pure – test/composer.test.ts.

type Key = { key: string; shiftKey: boolean; metaKey: boolean; ctrlKey: boolean; isComposing?: boolean; keyCode?: number };

/**
 * Does this key send? Never while an input method is composing (Chinese, Japanese: Enter picks the candidate).
 * ⌘↵ or Ctrl+↵ always. A plain ↵ sends with a keyboard; on a touch screen it's a new line – the send button sends there. ⇧↵ is a new line
 */
export function submits(e: Key, touch: boolean): boolean {
	if (e.key !== "Enter" || e.isComposing || e.keyCode === 229) return false;
	if (e.metaKey || e.ctrlKey) return true;
	return !touch && !e.shiftKey;
}

/** ↑ in an empty field pulls the newest queued message back, as in a terminal. Not while composing, not with a modifier */
export function recalls(e: Key & { altKey?: boolean }, empty: boolean): boolean {
	return e.key === "ArrowUp" && empty && !e.isComposing && e.keyCode !== 229 && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey;
}

const CJK = /[　-鿿가-힯＀-￯]/;

/** Heard words after what's typed: a space between Latin words, none around Chinese, none after a space or a new line */
export function joinSpeech(text: string, heard: string): string {
	const h = heard.trim();
	if (!h) return text;
	if (!text) return h;
	const last = text.at(-1) ?? "";
	const glue = /\s/.test(last) || CJK.test(last) || CJK.test(h[0] ?? "") ? "" : " ";
	return text + glue + h;
}
