// A row that scrolls sideways, for a mouse too: drag it, or turn the wheel. Touch and trackpads scroll natively already.
// A drag past a few pixels swallows the click that ends it, so dropping on a chip doesn't pick it.
// Returns which ends have more hidden behind them, for the fades.
import { type RefObject, useEffect, useState } from "react";

const SLOP = 4;

export function useDragScroll(ref: RefObject<HTMLElement | null>): { start: boolean; end: boolean } {
	const [more, setMore] = useState({ start: false, end: false });
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const measure = () => {
			const start = el.scrollLeft > 1;
			const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
			setMore((m) => (m.start === start && m.end === end ? m : { start, end }));
		};
		let drag: { x: number; left: number; id: number; moved: boolean } | null = null;
		const down = (e: PointerEvent) => {
			if (e.pointerType !== "mouse" || e.button !== 0 || el.scrollWidth <= el.clientWidth) return;
			drag = { x: e.clientX, left: el.scrollLeft, id: e.pointerId, moved: false };
		};
		const move = (e: PointerEvent) => {
			if (!drag || e.pointerId !== drag.id) return;
			const dx = e.clientX - drag.x;
			if (!drag.moved && Math.abs(dx) < SLOP) return;
			if (!drag.moved) {
				drag.moved = true;
				el.setPointerCapture(e.pointerId);
				el.style.cursor = "grabbing";
			}
			el.scrollLeft = drag.left - dx;
		};
		const up = (e: PointerEvent) => {
			if (!drag || e.pointerId !== drag.id) return;
			if (drag.moved) {
				el.style.cursor = "";
				// The click lands after pointerup: swallow that one, then let clicks through again
				const swallow = (c: MouseEvent) => {
					c.preventDefault();
					c.stopPropagation();
				};
				el.addEventListener("click", swallow, { capture: true, once: true });
				setTimeout(() => el.removeEventListener("click", swallow, { capture: true }), 0);
			}
			drag = null;
		};
		// A plain wheel scrolls the row sideways; one already sideways (trackpad, Shift) is left alone
		const wheel = (e: WheelEvent) => {
			if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return;
			const before = el.scrollLeft;
			el.scrollLeft += e.deltaY;
			if (el.scrollLeft !== before) e.preventDefault();
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		for (const c of el.children) ro.observe(c);
		el.addEventListener("scroll", measure, { passive: true });
		el.addEventListener("pointerdown", down);
		el.addEventListener("pointermove", move);
		el.addEventListener("pointerup", up);
		el.addEventListener("pointercancel", up);
		el.addEventListener("wheel", wheel, { passive: false });
		return () => {
			ro.disconnect();
			el.removeEventListener("scroll", measure);
			el.removeEventListener("pointerdown", down);
			el.removeEventListener("pointermove", move);
			el.removeEventListener("pointerup", up);
			el.removeEventListener("pointercancel", up);
			el.removeEventListener("wheel", wheel);
		};
	}, [ref]);
	return more;
}
