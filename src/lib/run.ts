// What a Run says in words: a step's title from the agent's narration, the header's label. Pure – test/run.test.ts.

/** A narration cut into sentences: after 。！？!?, after a period and a space, at a line break */
export function sentences(text: string): string[] {
	return text
		.split(/(?<=[。！？!?])|(?<=\.)\s+|\n+/)
		.map((s) => s.trim())
		.filter(Boolean);
}

/**
 * A step's title: the last sentence the agent said before acting. Its first sentences usually report the step before –
 * 「类型检查过了。」 – the last one says what this step does. Code and bold marks dropped, a closing 。：: or . trimmed.
 * While the agent is still writing, the sentence in progress; empty before it says anything
 */
export function stepTitle(say: string): string {
	const last = sentences(say).at(-1) ?? "";
	return last.replace(/`|\*\*/g, "").replace(/[。：:.]$/, "").trim();
}

export type RunState = "running" | "done" | "stopped";

/** The header's status: 「正在执行第 3 步」, 「已完成 18 步」, 「已中断于第 5 步」 */
export function runLabel(state: RunState, steps: number): string {
	const n = Math.max(steps, 1);
	return state === "running" ? `正在执行第 ${n} 步` : state === "stopped" ? `已中断于第 ${n} 步` : `已完成 ${steps} 步`;
}
