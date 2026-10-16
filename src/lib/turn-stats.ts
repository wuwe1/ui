// What TurnStats shows: lines changed across a turn's files, and a path split for the file list. Pure – test/turn-stats.test.ts.

export type TurnFile = { path: string; added: number; removed: number };
export type TurnAgent = { id: string; label: string };

/** Lines added and removed across every file */
export function lineTotals(files: TurnFile[]): { added: number; removed: number } {
	let added = 0;
	let removed = 0;
	for (const f of files) {
		added += f.added;
		removed += f.removed;
	}
	return { added, removed };
}

/** A path as the list shows it: the file name first, its folder after in gray */
export function splitPath(path: string): { name: string; dir: string } {
	const trimmed = path.replace(/\/+$/, "");
	const i = trimmed.lastIndexOf("/");
	return i < 0 ? { name: trimmed, dir: "" } : { name: trimmed.slice(i + 1), dir: trimmed.slice(0, i) };
}
