// What PromptLibrary works out: a template's blanks, the values in them, the finished prompt, the list cut into groups, search,
// and a template tidied for saving. Pure – test/prompt-library.test.ts.

export type PromptVariable = { description?: string; default?: string };
export type PromptTemplate = {
	id: string;
	title: string;
	/** Templates with the same group sit together under its name */
	group?: string;
	/** The prompt; a blank is written {name} */
	body: string;
	/** What a blank asks for and what it starts with, by name */
	variables?: Record<string, PromptVariable>;
};
export type PromptPart = { text: string; name?: undefined } | { name: string; text?: undefined };
export type PromptSection = { group: string | null; templates: PromptTemplate[] };

/** A blank: {name} – letters of any script, digits, - and _. No spaces, so code like { a } stays text */
const BLANK = /\{([\p{L}\p{N}_-]+)\}/gu;

/** The body cut into text and blanks, in order */
export function parts(body: string): PromptPart[] {
	const out: PromptPart[] = [];
	let at = 0;
	for (const m of body.matchAll(BLANK)) {
		if (m.index > at) out.push({ text: body.slice(at, m.index) });
		out.push({ name: m[1]! });
		at = m.index + m[0].length;
	}
	if (at < body.length) out.push({ text: body.slice(at) });
	return out;
}

/** The blanks in order of first appearance – a name used twice is one blank */
export const blanks = (body: string): string[] => [...new Set(Array.from(body.matchAll(BLANK), (m) => m[1]!))];

/** Each blank's value: what was typed, else its default, else empty */
export function valuesOf(t: PromptTemplate, typed: Record<string, string> = {}): Record<string, string> {
	const out: Record<string, string> = {};
	for (const n of blanks(t.body)) out[n] = typed[n] ?? t.variables?.[n]?.default ?? "";
	return out;
}

/** Blanks still empty – spaces alone don't fill one */
export const missing = (t: PromptTemplate, values: Record<string, string>): string[] => blanks(t.body).filter((n) => !values[n]?.trim());

/** The finished prompt: each blank's value, trimmed; an empty blank stays {name} */
export const fill = (body: string, values: Record<string, string>): string => body.replace(BLANK, (all, n: string) => values[n]?.trim() || all);

/** The next empty blank after from, wrapping around; null – every blank is filled */
export function nextEmpty(names: string[], values: Record<string, string>, from: string | null): string | null {
	const i = from === null ? -1 : names.indexOf(from);
	const order = i < 0 ? names : [...names.slice(i + 1), ...names.slice(0, i)];
	return order.find((n) => !values[n]?.trim()) ?? null;
}

/** Every word of the query in the title, group or body, case aside */
export function matches(t: PromptTemplate, query: string): boolean {
	const words = query.toLowerCase().split(/\s+/).filter(Boolean);
	const hay = `${t.title}\n${t.group ?? ""}\n${t.body}`.toLowerCase();
	return words.every((w) => hay.includes(w));
}

/** Templates by group, groups in order of first appearance; templates with no group form a section with no name */
export function sections(ts: PromptTemplate[]): PromptSection[] {
	const out: PromptSection[] = [];
	const by = new Map<string | null, PromptSection>();
	for (const t of ts) {
		const g = t.group?.trim() || null;
		let s = by.get(g);
		if (!s) {
			s = { group: g, templates: [] };
			by.set(g, s);
			out.push(s);
		}
		s.templates.push(t);
	}
	return out;
}

/** The groups in use, for the editor's suggestions */
export const groupsOf = (ts: PromptTemplate[]): string[] => sections(ts).flatMap((s) => (s.group ? [s.group] : []));

/** A template from the editor, ready to save: trimmed; variables kept only for blanks still in the body, empty fields dropped */
export function tidy(t: PromptTemplate): PromptTemplate {
	const variables: Record<string, PromptVariable> = {};
	for (const n of blanks(t.body)) {
		const description = t.variables?.[n]?.description?.trim();
		const value = t.variables?.[n]?.default?.trim();
		if (description || value) variables[n] = { ...(description ? { description } : {}), ...(value ? { default: value } : {}) };
	}
	const group = t.group?.trim();
	return { id: t.id, title: t.title.trim(), ...(group ? { group } : {}), body: t.body.trim(), ...(Object.keys(variables).length ? { variables } : {}) };
}
