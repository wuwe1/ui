// Combobox's pure parts: what a search keeps, groups, the rows the keys walk, the chips that show, what's announced. Tested in test/combobox.test.ts.
import type { LucideIcon } from "lucide-react";

export type ComboboxOption = {
	value: string;
	label: string;
	/** Gray text after the label – a role, a path; searched too */
	hint?: string;
	icon?: LucideIcon;
	/** An image URL, or true for initials */
	avatar?: string | true;
	/** Options with the same group are listed under one heading */
	group?: string;
	/** More words the search finds it by – pinyin, aliases */
	keywords?: string[];
	/** Listed, but can't be picked */
	disabled?: boolean;
};

/** A row the keys walk: an option, or the row that creates one from the text */
export type Row = { kind: "option"; option: ComboboxOption } | { kind: "create"; text: string };

const fold = (s: string) => s.toLocaleLowerCase();

/** The label, hint or a keyword holds the text, ignoring case. Empty text matches everything */
export function matches(o: ComboboxOption, text: string): boolean {
	const q = fold(text.trim());
	if (!q) return true;
	return [o.label, o.hint ?? "", ...(o.keywords ?? [])].some((s) => fold(s).includes(q));
}

/** Where the text shows up: [start, end) pairs, left to right, not overlapping */
export function ranges(s: string, text: string): [number, number][] {
	const q = fold(text.trim());
	if (!q) return [];
	const hay = fold(s);
	const out: [number, number][] = [];
	for (let i = hay.indexOf(q); i !== -1; i = hay.indexOf(q, i + q.length)) out.push([i, i + q.length]);
	return out;
}

/** Options under their headings: groups in the order they first appear, options in theirs. Ungrouped options form a group with no heading */
export function groupsOf(options: ComboboxOption[]): { name?: string; options: ComboboxOption[] }[] {
	const out = new Map<string, { name?: string; options: ComboboxOption[] }>();
	for (const o of options) {
		const k = o.group ?? "";
		const g = out.get(k) ?? { name: o.group, options: [] };
		g.options.push(o);
		out.set(k, g);
	}
	return [...out.values()];
}

/** No option's label is the text, ignoring case – the create row can offer it */
export function canCreate(options: ComboboxOption[], text: string): boolean {
	const q = fold(text.trim());
	return !!q && !options.some((o) => fold(o.label.trim()) === q);
}

/** The rows in order: options as grouped, then the create row */
export function rowsOf(groups: { options: ComboboxOption[] }[], create?: string): Row[] {
	const rows: Row[] = groups.flatMap((g) => g.options.map((option) => ({ kind: "option" as const, option })));
	if (create) rows.push({ kind: "create", text: create });
	return rows;
}

const pickable = (r: Row | undefined) => !!r && (r.kind === "create" || !r.option.disabled);

/** The first row that can be picked, or -1 */
export function firstRow(rows: Row[]): number {
	return rows.findIndex(pickable);
}

/** The row a key moves to: ↑ ↓ wrap, Home and End jump to the ends, disabled rows are skipped. null – not a moving key */
export function move(rows: Row[], active: number, key: string): number | null {
	const on = rows.map((r, i) => (pickable(r) ? i : -1)).filter((i) => i >= 0);
	if (key !== "ArrowDown" && key !== "ArrowUp" && key !== "Home" && key !== "End") return null;
	if (!on.length) return -1;
	if (key === "Home") return on[0]!;
	if (key === "End") return on[on.length - 1]!;
	const at = on.indexOf(active);
	// Nothing active yet: the first step lands on an end
	if (at < 0) return key === "ArrowDown" ? on[0]! : on[on.length - 1]!;
	return on[(at + (key === "ArrowDown" ? 1 : -1) + on.length) % on.length]!;
}

/** The values after a pick: added at the end or taken out. Single replaces, and keeps its value when it's picked again – × clears it */
export function toggle(values: string[], value: string, multiple: boolean): string[] {
	if (!multiple) return [value];
	return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

/** The chips that show – the first max – and how many roll into 「+N」 */
export function fit(values: string[], max?: number): { shown: string[]; more: number } {
	if (max === undefined || values.length <= max) return { shown: values, more: 0 };
	const n = Math.max(0, max);
	return { shown: values.slice(0, n), more: values.length - n };
}

/** A chip on screen; leaving – its value is gone and it folds away */
export type Chip = { value: string; leaving?: boolean };

/** The chips after the values change: the values in order, and the ones that went stay where they were, leaving, until they've folded */
export function settle(prev: Chip[], values: string[]): Chip[] {
	const has = new Set(values);
	const out: Chip[] = values.map((value) => ({ value }));
	prev.forEach((c, k) => {
		if (has.has(c.value)) return;
		// After the nearest earlier chip that's still there
		let at = 0;
		for (let j = k - 1; j >= 0; j--) {
			const i = out.findIndex((o) => o.value === prev[j]!.value);
			if (i >= 0) {
				at = i + 1;
				break;
			}
		}
		out.splice(at, 0, { value: c.value, leaving: true });
	});
	return out;
}

/** Initials for an avatar: the first letters of the first two words – 「MC」 – or the first character of Chinese text – 「王」 */
export function initials(label: string): string {
	const words = label.trim().split(/\s+/).filter(Boolean);
	if (!words.length) return "";
	const first = [...words[0]!][0]!;
	if (/[㐀-鿿豈-﫿]/.test(first)) return first;
	const second = words[1] ? [...words[1]][0]! : "";
	return (first + second).toLocaleUpperCase();
}

/** What the live region says after a change */
export function announce(kind: "picked" | "removed" | "created" | "armed", label: string, count: number, multiple: boolean): string {
	if (kind === "armed") return `再按一次退格键移除 ${label}`;
	const what = kind === "picked" ? "已选" : kind === "created" ? "已添加" : "已移除";
	return multiple ? `${what} ${label}，共 ${count} 项` : `${what} ${label}`;
}
