// useTuck: fold a finished item once it has scrolled out of sight above, and keep the reader's place.
// Folding something in view moves every line under it; out of view, with its height taken back from the scroll position, nothing on screen moves.
import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";

/** The nearest ancestor that scrolls up and down; null – the page */
function scrollParent(el: HTMLElement): HTMLElement | null {
	for (let p = el.parentElement; p; p = p.parentElement) {
		const o = getComputedStyle(p).overflowY;
		if (o === "auto" || o === "scroll") return p;
	}
	return null;
}

const scrolling = (root: HTMLElement | null) => root ?? document.scrollingElement ?? document.documentElement;

/**
 * armed – the item may fold now: it finished in front of the person, and nobody opened or closed it by hand.
 * Returns true once it has gone entirely above the top of its scroll container – fold it then, without animation.
 * The height it loses comes off the scroll position, so the text in view stays where it is. Scrolled to the bottom –
 * the browser keeps the bottom in place by itself, and a container that follows new output keeps following
 */
export function useTuck(ref: RefObject<HTMLElement | null>, armed: boolean): boolean {
	const [away, setAway] = useState(false);
	const before = useRef<{ height: number; bottom: boolean } | null>(null);
	useEffect(() => {
		const el = ref.current;
		if (!armed || away || !el) return;
		const root = scrollParent(el);
		const io = new IntersectionObserver(
			([e]) => {
				if (!e || e.isIntersecting) return;
				// Below the view – not read yet; only what was read and left above folds
				if (e.boundingClientRect.bottom > (e.rootBounds?.top ?? 0)) return;
				const s = scrolling(root);
				before.current = { height: el.offsetHeight, bottom: s.scrollHeight - s.scrollTop - s.clientHeight < 2 };
				setAway(true);
			},
			{ root },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [ref, armed, away]);
	// The fold may land a render later – a closing Collapsible unmounts its content after this commit – so watch the size, not the render
	useLayoutEffect(() => {
		const el = ref.current;
		const was = before.current;
		before.current = null;
		if (!away || !was || was.bottom || !el) return;
		const s = scrolling(scrollParent(el));
		let height = was.height;
		const ro = new ResizeObserver(() => {
			const now = el.offsetHeight;
			if (now === height) return;
			s.scrollTop -= height - now;
			height = now;
		});
		ro.observe(el);
		const t = setTimeout(() => ro.disconnect(), 500);
		return () => {
			ro.disconnect();
			clearTimeout(t);
		};
	}, [ref, away]);
	return away;
}
