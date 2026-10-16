// What a tool call group shows: which calls run, how many failed, the icons it stacks. Pure – test/tool-call.test.ts.

export type ToolCallStatus = "running" | "done" | "failed";

/** One tool call, as the components read it */
export type ToolCallData = {
	id: string;
	/** The tool – 「Bash」, 「Read」 */
	name: string;
	/** One line on what it does – a command, a path, a query */
	summary: string;
	status: ToolCallStatus;
	/** running – when it started, in ms since the epoch; the line shows a clock */
	since?: number;
	/** done or failed – how long it took, in ms */
	ms?: number;
};

/** The header of a group: running calls in order, failures, the last call, whether all finished */
export function groupState<T extends Pick<ToolCallData, "status">>(calls: T[]) {
	const running = calls.filter((c) => c.status === "running");
	return {
		running,
		failed: calls.filter((c) => c.status === "failed").length,
		last: calls.at(-1),
		done: calls.length > 0 && running.length === 0,
	};
}

/** The stacked icons: the last three distinct ones, newest last; the newest is marked when the last call failed */
export function stack<I>(calls: { icon: I; status: ToolCallStatus }[], max = 3): { icon: I; failed: boolean }[] {
	const out: { icon: I; failed: boolean }[] = [];
	for (let i = calls.length - 1; i >= 0 && out.length < max; i--) {
		const c = calls[i];
		if (!out.some((t) => t.icon === c.icon)) out.unshift({ icon: c.icon, failed: i === calls.length - 1 && c.status === "failed" });
	}
	return out;
}
