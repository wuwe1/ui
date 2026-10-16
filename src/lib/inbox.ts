// What Inbox shows: three sections in order, and which rows moved to another section. Pure – test/inbox.test.ts.

/** A row's status – the same names as StatusIcon */
export type InboxStatus = "waiting" | "error" | "running" | "background" | "done";

/** The three sections: id, title, the statuses each holds – in this order inside it */
export const SECTIONS: readonly { id: string; title: string; of: readonly InboxStatus[] }[] = [
	{ id: "todo", title: "待处理", of: ["waiting", "error"] },
	{ id: "running", title: "运行中", of: ["running", "background"] },
	{ id: "done", title: "已完成", of: ["done"] },
];

/**
 * Into sections, sorted: by status in SECTIONS' order, then by at (ms) – oldest first in 待处理 (the oldest is the most urgent),
 * newest first elsewhere. Empty sections are left out
 */
export function sections<T extends { status: InboxStatus; at: number }>(items: T[]): { id: string; title: string; items: T[] }[] {
	return SECTIONS.map((s) => ({
		id: s.id,
		title: s.title,
		items: items.filter((x) => s.of.includes(x.status)).sort((a, b) => s.of.indexOf(a.status) - s.of.indexOf(b.status) || (s.id === "todo" ? a.at - b.at : b.at - a.at)),
	})).filter((s) => s.items.length);
}

/** The section a status belongs to */
export const sectionOf = (status: InboxStatus) => SECTIONS.find((s) => s.of.includes(status))?.id ?? "done";

/** Rows whose status changed since last time, with the new one – announced, and opened when they start waiting */
export function changed(before: ReadonlyMap<string, InboxStatus>, items: { id: string; status: InboxStatus }[]): { id: string; status: InboxStatus }[] {
	return items.filter((x) => before.has(x.id) && before.get(x.id) !== x.status);
}
