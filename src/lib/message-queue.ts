// MessageQueue's logic: which cards to draw while messages come and go, how far back each sits, and a message in one line.

/** A message waiting for the agent. images – thumbnail URLs */
export type QueuedMessage = { id: string; text: string; images?: string[] };

/** A card on screen. out – it left and is animating away: taken by the agent goes up, withdrawn goes down */
export type Shown = { m: QueuedMessage; out?: "taken" | "withdrawn" };

/**
 * The cards to draw next: the messages now, oldest first, and the ones that just left kept in their place while they animate out.
 * withdrawn – ids the person pulled back; anything else that left was taken
 */
export function settle(prev: Shown[], items: QueuedMessage[], withdrawn: ReadonlySet<string>): Shown[] {
	const now = new Map(items.map((m) => [m.id, m]));
	const seen = new Set<string>();
	const next: Shown[] = [];
	for (const s of prev) {
		seen.add(s.m.id);
		const m = now.get(s.m.id);
		if (m) next.push({ m });
		else next.push(s.out ? s : { m: s.m, out: withdrawn.has(s.m.id) ? "withdrawn" : "taken" });
	}
	for (const m of items) if (!seen.has(m.id)) next.push({ m });
	return next;
}

/** How far back each card sits, 0 in front. Staying cards count the staying ones after them, so they move forward at once; leaving cards keep their place */
export function depths(shown: Shown[]): number[] {
	return shown.map((s, i) => shown.slice(i + 1).filter((x) => s.out || !x.out).length);
}

/** A message in one line, for names and announcements: whitespace folded, cut at n characters */
export function short(text: string, n = 16) {
	const one = text.replace(/\s+/g, " ").trim();
	return [...one].length > n ? `${[...one].slice(0, n).join("")}…` : one;
}
