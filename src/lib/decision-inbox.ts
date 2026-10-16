// What DecisionInbox works out: which decisions still wait, which one opens next, what an answer holds,
// what 「采纳其余建议」 answers, and the list 「完成」 hands back. Pure – test/decision-inbox.test.ts.

export type DecisionOption = {
	id: string;
	/** Without 「…」 – an option with a note gets it on its button */
	label: string;
	/** The answer carries a sentence: the button opens a field first. A string is the field's placeholder */
	note?: boolean | string;
};
/** option – what was picked; proposed – what the agent suggested; note – the sentence an option with a note carries */
export type DecisionAnswer = { decision: string; option: string; note?: string; proposed?: string };
/** Answers by decision id */
export type Answers = Record<string, DecisionAnswer>;
/** What the logic needs of a decision */
type Asked = { id: string; options: DecisionOption[]; proposed?: string };

/** The label on a button and a line: 「修改…」 for an option that opens a field */
export const labelOf = (o: DecisionOption) => (o.note ? `${o.label}…` : o.label);

export const optionOf = (d: Asked, id: string | undefined) => d.options.find((o) => o.id === id);

/** The proposal, when there is one to follow */
export const proposalOf = (d: Asked) => optionOf(d, d.proposed);

export function answerOf(d: Asked, option: string, note?: string): DecisionAnswer {
	const a: DecisionAnswer = { decision: d.id, option };
	const n = note?.trim();
	if (n) a.note = n;
	if (d.proposed) a.proposed = d.proposed;
	return a;
}

/** The one to open once `from` is answered: the next still waiting after it, else the first still waiting */
export function nextOf(ds: Asked[], answers: Answers, from: string | null): string | null {
	const i = ds.findIndex((d) => d.id === from);
	const after = i < 0 ? undefined : ds.slice(i + 1).find((d) => !answers[d.id]);
	return (after ?? ds.find((d) => !answers[d.id]))?.id ?? null;
}

/** ↑ ↓ Home End among the waiting: arrows wrap; from none, ↓ takes the first and ↑ the last. undefined – not a key of ours */
export function moveOf(ids: string[], current: string | null, key: string): string | null | undefined {
	if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(key)) return undefined;
	if (!ids.length) return null;
	if (key === "Home") return ids[0]!;
	if (key === "End") return ids[ids.length - 1]!;
	const dir = key === "ArrowDown" ? 1 : -1;
	const i = ids.indexOf(current ?? "");
	if (i < 0) return dir === 1 ? ids[0]! : ids[ids.length - 1]!;
	return ids[(i + dir + ids.length) % ids.length]!;
}

/** An option with a note needs its sentence – unless it's the proposal: then the reason says what to do */
export const noteRequired = (d: Asked, o: DecisionOption) => !!o.note && o.id !== d.proposed;

/** Every waiting decision with a proposal, answered with it – a proposal with a note goes without one; the rest keep waiting */
export function acceptRest(ds: Asked[], answers: Answers): Answers {
	const next = { ...answers };
	for (const d of ds) {
		const o = proposalOf(d);
		if (!next[d.id] && o) next[d.id] = answerOf(d, o.id);
	}
	return next;
}

/** Whether 「采纳其余建议」 would answer anything */
export const canAcceptRest = (ds: Asked[], answers: Answers) => ds.some((d) => !answers[d.id] && proposalOf(d));

/** What 「完成」 hands back: one answer per decision that has one, in the list's order */
export const final = (ds: Asked[], answers: Answers): DecisionAnswer[] => ds.flatMap((d) => (answers[d.id] ? [answers[d.id]!] : []));

/** Answers passed back as a list, by decision */
export const byDecision = (list: DecisionAnswer[]): Answers => Object.fromEntries(list.map((a) => [a.decision, a]));
