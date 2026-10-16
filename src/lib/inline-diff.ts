// What InlineDiff works out: two texts cut into words and compared, the edits gathered into changes a person decides one by one,
// and the text the decisions make. Words come from Intl.Segmenter, so Chinese splits into words – split on spaces, a Chinese sentence
// is one word and any edit in it replaces the whole sentence. Pure – test/inline-diff.test.ts.

export type DiffSegment = { type: "equal"; text: string } | { type: "change"; remove: string; insert: string };
export type DiffDecision = "accept" | "reject";

const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("zh", { granularity: "word" }) : null;

/** Words, spaces and punctuation, in order; joined they give the text back. Without Intl.Segmenter, each Han character is a word */
export function words(text: string): string[] {
	if (segmenter) return Array.from(segmenter.segment(text), (s) => s.segment);
	return text.match(/\p{Script=Han}|[\p{L}\p{N}_]+|\s+|[^]/gu) ?? [];
}

const EQUAL = 0;
const REMOVE = 1;
const INSERT = 2;
type Op = typeof EQUAL | typeof REMOVE | typeof INSERT;

/** Myers' diff of two word lists: the shortest list of edits. null – they differ in more than limit places */
function myers(a: string[], b: string[], limit: number): Op[] | null {
	const n = a.length;
	const m = b.length;
	const off = n + m + 1;
	const v = new Int32Array(2 * off + 1);
	/** v as it was before each round – only the diagonals that round can reach */
	const trace: Int32Array[] = [];
	for (let d = 0; d <= n + m; d++) {
		if (d > limit) return null;
		trace.push(v.slice(off - d, off + d + 1));
		for (let k = -d; k <= d; k += 2) {
			let x = k === -d || (k !== d && v[off + k - 1]! < v[off + k + 1]!) ? v[off + k + 1]! : v[off + k - 1]! + 1;
			let y = x - k;
			while (x < n && y < m && a[x] === b[y]) {
				x++;
				y++;
			}
			v[off + k] = x;
			if (x >= n && y >= m) return back(trace, n, m);
		}
	}
	return null;
}

function back(trace: Int32Array[], n: number, m: number): Op[] {
	const ops: Op[] = [];
	let x = n;
	let y = m;
	for (let d = trace.length - 1; d >= 0; d--) {
		const v = trace[d]!;
		const at = (k: number) => v[k + d]!;
		const k = x - y;
		const pk = d === 0 ? 0 : k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
		const px = d === 0 ? 0 : at(pk);
		const py = px - pk;
		while (x > px && y > py) {
			ops.push(EQUAL);
			x--;
			y--;
		}
		if (d > 0) {
			if (x === px) {
				ops.push(INSERT);
				y--;
			} else {
				ops.push(REMOVE);
				x--;
			}
		}
	}
	return ops.reverse();
}

/** An unchanged run this small between two changes joins them: only spaces and punctuation, one character, or two Han characters – one Chinese word */
function small(text: string): boolean {
	if (text.includes("\n")) return false;
	const core = text.replace(/[\s\p{P}\p{S}]/gu, "");
	return core.length <= (/^\p{Script=Han}+$/u.test(core) ? 2 : 1);
}

/** Past this many edits the texts barely share anything: the whole middle becomes one change */
const LIMIT = 2000;

/** The suggestion against the original, word by word: unchanged runs and changes. Removals and insertions next to each other are one change */
export function diffWords(original: string, suggested: string): DiffSegment[] {
	if (original === suggested) return original ? [{ type: "equal", text: original }] : [];
	const a = words(original);
	const b = words(suggested);
	// Same words at both ends are left out of the diff
	let head = 0;
	while (head < a.length && head < b.length && a[head] === b[head]) head++;
	let tail = 0;
	while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;
	const midA = a.slice(head, a.length - tail);
	const midB = b.slice(head, b.length - tail);
	const ops = myers(midA, midB, LIMIT);

	const raw: DiffSegment[] = [];
	const equal = (t: string) => {
		const last = raw[raw.length - 1];
		if (last?.type === "equal") last.text += t;
		else raw.push({ type: "equal", text: t });
	};
	const change = (remove: string, insert: string) => {
		const last = raw[raw.length - 1];
		if (last?.type === "change") {
			last.remove += remove;
			last.insert += insert;
		} else raw.push({ type: "change", remove, insert });
	};
	if (head) equal(a.slice(0, head).join(""));
	if (!ops) change(midA.join(""), midB.join(""));
	else {
		let i = 0;
		let j = 0;
		for (const op of ops) {
			if (op === EQUAL) {
				equal(midA[i]!);
				i++;
				j++;
			} else if (op === REMOVE) change(midA[i++]!, "");
			else change("", midB[j++]!);
		}
	}
	if (tail) equal(a.slice(a.length - tail).join(""));

	// A small unchanged run between two changes joins them, so a rewritten phrase reads as one change
	const out: DiffSegment[] = [];
	for (let k = 0; k < raw.length; k++) {
		const s = raw[k]!;
		const prev = out[out.length - 1];
		const next = raw[k + 1];
		if (s.type === "equal" && prev?.type === "change" && next?.type === "change" && small(s.text)) {
			prev.remove += s.text + next.remove;
			prev.insert += s.text + next.insert;
			k++;
			continue;
		}
		out.push(s);
	}
	return out;
}

/** The changes, in order */
export const changesOf = (segments: DiffSegment[]) => segments.filter((s): s is Extract<DiffSegment, { type: "change" }> => s.type === "change");

/** The text the decisions make, one per change in order: accepted – the new words; rejected or still open – the old ones */
export function resolve(segments: DiffSegment[], decisions: readonly (DiffDecision | null | undefined)[]): string {
	let k = 0;
	let out = "";
	for (const s of segments) {
		if (s.type === "equal") out += s.text;
		else out += decisions[k++] === "accept" ? s.insert : s.remove;
	}
	return out;
}

/** The suggestion as given: every change accepted */
export const suggestedOf = (segments: DiffSegment[]) => resolve(segments, changesOf(segments).map(() => "accept"));

const quote = (t: string) => `「${t.length > 40 ? `${t.slice(0, 40)}…` : t}」`;

/** A change in words, for screen readers */
export function describe(c: { remove: string; insert: string }): string {
	if (c.remove.trim() && c.insert.trim()) return `把${quote(c.remove.trim())}改成${quote(c.insert.trim())}`;
	if (c.remove.trim()) return `删掉${quote(c.remove.trim())}`;
	if (c.insert.trim()) return `加上${quote(c.insert.trim())}`;
	return "改动空白";
}

/** Among the open changes, one step from current, wrapping; current not open – the first, or the last going back */
export function step(open: number[], current: number | null, dir: 1 | -1): number | null {
	if (!open.length) return null;
	const i = current === null ? -1 : open.indexOf(current);
	if (i < 0) return dir === 1 ? open[0]! : open[open.length - 1]!;
	return open[(i + dir + open.length) % open.length]!;
}
