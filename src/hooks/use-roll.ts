// A number that rolls to its new value in 300ms, easing out. Reduced motion jumps. ContextWindow and UsageMeter roll their numbers with it.
import { useEffect, useRef, useState } from "react";

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useRoll(value: number): number {
	const [shown, setShown] = useState(value);
	const from = useRef(value);
	useEffect(() => {
		if (reduced() || from.current === value) {
			from.current = value;
			setShown(value);
			return;
		}
		const start = performance.now();
		const a = from.current;
		let raf = 0;
		const tick = (t: number) => {
			const k = Math.min(1, (t - start) / 300);
			const v = a + (value - a) * (1 - (1 - k) ** 3);
			from.current = v;
			setShown(v);
			if (k < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [value]);
	return shown;
}
