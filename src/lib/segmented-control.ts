// Which option a key picks in a SegmentedControl, and which one holds the tab stop. Pure – test/segmented-control.test.ts.

type Option = { value: string; disabled?: boolean };

/** The one tab stop: the pick when it's there and enabled, else the first enabled option */
export function stop(options: Option[], value: string | undefined): string | undefined {
	const on = options.find((o) => o.value === value && !o.disabled);
	return on ? on.value : options.find((o) => !o.disabled)?.value;
}

/**
 * The option a key picks, skipping disabled ones, or null when the key isn't ours. ← → wrap; ↑ ↓ too for a radiogroup – a tablist leaves them
 * to the page; Home and End jump to the ends
 */
export function next(options: Option[], value: string | undefined, key: string, kind: "radio" | "tabs" = "radio"): string | null {
	const on = options.filter((o) => !o.disabled);
	if (!on.length) return null;
	const i = on.findIndex((o) => o.value === value);
	const back = key === "ArrowLeft" || (kind === "radio" && key === "ArrowUp");
	const ahead = key === "ArrowRight" || (kind === "radio" && key === "ArrowDown");
	if (key === "Home") return on[0]?.value ?? null;
	if (key === "End") return on[on.length - 1]?.value ?? null;
	if (!back && !ahead) return null;
	// Nothing picked yet: the first step lands on an end
	if (i < 0) return (ahead ? on[0] : on[on.length - 1])?.value ?? null;
	return on[(i + (ahead ? 1 : -1) + on.length) % on.length]?.value ?? null;
}
