// What MatchReview works out: what each pair points at now, which pairs share a right item (they show as one group),
// what deciding, keeping and accepting do to the review, and a label cut into its linked parts. Pure – test/match-review.test.ts.

export type MatchItem = { id: string; label: string; image?: string };
export type MatchSignal = { id: string; label: string };
/** A part of the left label and a part of the right one that match; ok false – same place, different value (150 against 100) */
export type MatchLink = { left: [number, number]; right: [number, number]; ok?: boolean };
export type MatchCandidate = { item: MatchItem; scores?: Record<string, number>; links?: MatchLink[] };
export type MatchPair = {
	id: string;
	left: MatchItem;
	/** The proposal; null – nothing on the right fits */
	right: MatchItem | null;
	links?: MatchLink[];
	/** sure – folded under 「已对上」; unsure – waits for a look */
	confidence: "sure" | "unsure";
	/** The proposal first, then the rest, best first */
	candidates?: MatchCandidate[];
	/** A word at the row's end, 「缺 150」 */
	note?: string;
};
/** right – what was settled, null for no match; proposed – what was suggested. Same – accepted, different – changed, right null – rejected */
export type MatchDecision = { pair: string; right: string | null; proposed: string | null };

/** decisions made; proposals moved when a shared item went to another pair; sure pairs pulled into review; groups kept whole */
export type ReviewState = { decisions: Record<string, MatchDecision>; moved: Record<string, string | null>; promoted: string[]; kept: string[] };
export const EMPTY: ReviewState = { decisions: {}, moved: {}, promoted: [], kept: [] };

export type Block = { key: string; kind: "pair"; pair: MatchPair } | { key: string; kind: "group"; pairs: MatchPair[]; shared: string; right: MatchItem | null };

export const candidatesOf = (p: MatchPair): MatchCandidate[] => (p.candidates?.length ? p.candidates : p.right ? [{ item: p.right, links: p.links }] : []);
export const candidateOf = (p: MatchPair, id: string | null): MatchCandidate | null =>
	id === null ? null : (candidatesOf(p).find((c) => c.item.id === id) ?? (p.right?.id === id ? { item: p.right, links: p.links } : null));
export const proposalOf = (p: MatchPair, s: ReviewState) => (p.id in s.moved ? (s.moved[p.id] ?? null) : (p.right?.id ?? null));
export const rightOf = (p: MatchPair, s: ReviewState) => (s.decisions[p.id] ? s.decisions[p.id]!.right : proposalOf(p, s));
export const inReview = (p: MatchPair, s: ReviewState) => p.confidence !== "sure" || s.promoted.includes(p.id);

/** The rows: a pair alone, or the pairs pointing at the same right item together – placed where the first of them is. Sure pairs no group pulls in are left over */
export function blocks(pairs: MatchPair[], s: ReviewState): { blocks: Block[]; sure: MatchPair[] } {
	const by = new Map<string, MatchPair[]>();
	for (const p of pairs) {
		const r = rightOf(p, s);
		if (r) by.set(r, [...(by.get(r) ?? []), p]);
	}
	const out: Block[] = [];
	const seen = new Set<string>();
	for (const p of pairs.filter((x) => inReview(x, s))) {
		if (seen.has(p.id)) continue;
		const r = rightOf(p, s);
		const g = r ? by.get(r)! : [];
		if (r && g.length > 1) {
			for (const x of g) seen.add(x.id);
			out.push({ key: `g:${r}`, kind: "group", pairs: g, shared: r, right: g.map((x) => candidateOf(x, r)).find(Boolean)?.item ?? null });
		} else {
			seen.add(p.id);
			out.push({ key: `p:${p.id}`, kind: "pair", pair: p });
		}
	}
	return { blocks: out, sure: pairs.filter((p) => !inReview(p, s) && !seen.has(p.id)) };
}

/** Waiting for a look: a pair not decided, a group not kept whole */
export const isOpen = (b: Block, s: ReviewState) => (b.kind === "pair" ? !s.decisions[b.pair.id] : !s.kept.includes(b.key));

export function decide(p: MatchPair, right: string | null, s: ReviewState): ReviewState {
	return { ...s, decisions: { ...s.decisions, [p.id]: { pair: p.id, right, proposed: proposalOf(p, s) } } };
}

/** The shared item goes to keeper; the others move to their next candidate and wait again – a sure pair among them comes into review.
 * The next candidate skips what is settled elsewhere – decided for another pair, or held by a sure pair still folded: landing there would only reopen it */
export function keep(pairs: MatchPair[], g: Extract<Block, { kind: "group" }>, keeper: MatchPair, s: ReviewState): ReviewState {
	const others = g.pairs.filter((o) => o.id !== keeper.id);
	const decisions = { ...s.decisions, [keeper.id]: { pair: keeper.id, right: g.shared, proposed: proposalOf(keeper, s) } };
	for (const o of others) delete decisions[o.id];
	const taken = new Set([...Object.values(decisions).map((d) => d.right), ...blocks(pairs, s).sure.map((p) => rightOf(p, s))]);
	const moved = { ...s.moved };
	const promoted = [...s.promoted];
	for (const o of others) {
		moved[o.id] = candidatesOf(o).find((c) => !taken.has(c.item.id))?.item.id ?? null;
		if (!inReview(o, s)) promoted.push(o.id);
	}
	return { ...s, decisions, moved, promoted };
}

/** All of them keep it – one item for several, by choice */
export function keepAll(g: Extract<Block, { kind: "group" }>, s: ReviewState): ReviewState {
	const decisions = { ...s.decisions };
	for (const o of g.pairs) if (inReview(o, s) && !decisions[o.id]) decisions[o.id] = { pair: o.id, right: g.shared, proposed: proposalOf(o, s) };
	return { ...s, decisions, kept: [...s.kept, g.key] };
}

/** Every pair still waiting takes its proposal; every group is kept whole */
export function acceptAll(pairs: MatchPair[], s: ReviewState): ReviewState {
	const decisions = { ...s.decisions };
	for (const p of pairs) if (inReview(p, s) && !decisions[p.id]) decisions[p.id] = { pair: p.id, right: proposalOf(p, s), proposed: proposalOf(p, s) };
	const groups = blocks(pairs, s).blocks.filter((b) => b.kind === "group").map((b) => b.key);
	return { ...s, decisions, kept: [...new Set([...s.kept, ...groups])] };
}

/** The answer: one decision per pair, sure ones as proposed */
export const final = (pairs: MatchPair[], s: ReviewState): MatchDecision[] =>
	pairs.map((p) => s.decisions[p.id] ?? { pair: p.id, right: proposalOf(p, s), proposed: p.right?.id ?? null });

/** Decisions passed back in – the settled review, read only */
export function settled(pairs: MatchPair[], ds: MatchDecision[]): ReviewState {
	const decisions: Record<string, MatchDecision> = {};
	for (const d of ds) decisions[d.pair] = d;
	const s: ReviewState = { ...EMPTY, decisions, promoted: pairs.filter((p) => decisions[p.id] && decisions[p.id]!.right !== (p.right?.id ?? null)).map((p) => p.id) };
	return { ...s, kept: blocks(pairs, s).blocks.filter((b) => b.kind === "group").map((b) => b.key) };
}

/** Keys in order, one step from current, wrapping; current not among them – the first (or last going back) */
export function step(keys: string[], current: string | null | undefined, dir: 1 | -1): string | null {
	if (!keys.length) return null;
	const i = keys.indexOf(current ?? "");
	if (i < 0) return dir === 1 ? keys[0]! : keys[keys.length - 1]!;
	return keys[(i + dir + keys.length) % keys.length]!;
}

export type Segment = { text: string; link?: number; ok?: boolean };

/** A label cut by its links on one side: plain runs and linked parts (the link's index, matched or not). Out-of-range and overlapping parts are clipped */
export function segments(text: string, links: MatchLink[] | undefined, side: "left" | "right"): Segment[] {
	const marks = (links ?? [])
		.map((l, i) => ({ s: Math.max(0, l[side][0]), e: Math.min(text.length, l[side][1]), ok: l.ok !== false, i }))
		.filter((m) => m.e > m.s)
		.sort((a, b) => a.s - b.s);
	const out: Segment[] = [];
	let at = 0;
	for (const m of marks) {
		const s = Math.max(m.s, at);
		if (m.e <= s) continue;
		if (s > at) out.push({ text: text.slice(at, s) });
		out.push({ text: text.slice(s, m.e), link: m.i, ok: m.ok });
		at = m.e;
	}
	if (at < text.length) out.push({ text: text.slice(at) });
	return out;
}
