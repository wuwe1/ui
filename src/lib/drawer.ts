// Phone drawers: the sidebar on the left, a panel on the right. Position is progress p – 0 closed, 1 open.
// Dragging writes styles directly, following the finger without a React render per frame. Release or a button animates from where it is to 0 or 1;
// grabbing mid-animation stops it where it is and drags on. Reduced motion – it jumps, no animation
import { useEffect } from "react";
import { standalone } from "./standalone.ts";

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const clamp = (x: number) => Math.min(1, Math.max(0, x));

export type Drawer = ReturnType<typeof make>;

function make(side: "left" | "right") {
	let panel: HTMLElement | null = null;
	let overlay: HTMLElement | null = null;
	let hidden: (() => void) | undefined;
	let p = 0;
	// Closed means off screen: the left drawer hides left, the right one right
	const off = side === "left" ? -1 : 1;

	function paint(ms: number) {
		if (!panel || !overlay) return;
		const how = ms ? `${ms}ms ${EASE}` : "";
		panel.style.transition = how ? `transform ${how}` : "none";
		overlay.style.transition = how ? `opacity ${how}` : "none";
		panel.style.transform = `translateX(${(1 - p) * off * 100}%)`;
		overlay.style.opacity = String(p);
		overlay.style.pointerEvents = p > 0 ? "auto" : "none";
		// Hide once the closing animation ends (transitionend); a jump hides at once
		if (p > 0 || !ms) panel.style.visibility = overlay.style.visibility = p > 0 ? "visible" : "hidden";
	}

	return {
		side,
		/** Registers the mounted drawer. onHidden – fully closed and hidden, so its content can unmount. Returns undo */
		attach(pa: HTMLElement, ov: HTMLElement, onHidden?: () => void) {
			panel = pa;
			overlay = ov;
			hidden = onHidden;
			const hide = (e: TransitionEvent) => {
				if (e.target !== pa || p !== 0) return;
				pa.style.visibility = ov.style.visibility = "hidden";
				hidden?.();
			};
			pa.addEventListener("transitionend", hide);
			paint(0);
			return () => {
				pa.removeEventListener("transitionend", hide);
				if (panel === pa) panel = overlay = null;
			};
		},
		/** Drawer width, to turn drag distance into progress */
		width: () => panel?.getBoundingClientRect().width || 288,
		/** On touch: stops where it is, mid-animation too, and returns that progress */
		grab(): number {
			if (!panel) return p;
			const t = getComputedStyle(panel).transform;
			p = clamp(t === "none" ? p : 1 - (off * new DOMMatrix(t).m41) / this.width());
			paint(0);
			return p;
		},
		/** While dragging: moves to x, no animation */
		drag(x: number) {
			p = clamp(x);
			paint(0);
		},
		/** Fully open or closed: animates from here; the shorter the way, the quicker */
		to(target: 0 | 1) {
			if (!panel || p === target) return;
			const ms = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : Math.round(150 + 150 * Math.abs(target - p));
			p = target;
			paint(ms);
			if (!target && !ms) hidden?.();
		},
	};
}

export const sidebar = make("left");
export const panel = make("right");

const EDGE = 24;
/** Release faster than this (px/ms) is a fling: it opens or closes the way it was flung */
const FLING = 0.5;

/**
 * On iOS a swipe from the left edge goes back (and from the right edge forward), in Safari and in home-screen apps.
 * A home-screen app has no address bar and no use for it: touches within EDGE of either edge are stopped, so the OS never goes back.
 * Always – dialog, menu or panel open – not only when the drawer swipe would take it; that swipe ignores open dialogs, and an edge swipe there would leave the page.
 * A stopped touchstart gets no click, so a tap that didn't move gets one dispatched. Safari takes the edge before the page can – left to the OS. Call once at the top
 */
export function guardEdges() {
	if (!standalone) return;
	let tap: { el: Element; x: number; y: number } | null = null;
	document.addEventListener("touchstart", (e) => {
		tap = null;
		const t = e.touches[0];
		if (e.touches.length !== 1 || !e.cancelable || (t.clientX >= EDGE && t.clientX <= innerWidth - EDGE)) return;
		e.preventDefault();
		tap = { el: e.target as Element, x: t.clientX, y: t.clientY };
	}, { passive: false });
	document.addEventListener("touchend", (e) => {
		const t = e.changedTouches[0];
		if (!tap || Math.abs(t.clientX - tap.x) >= 10 || Math.abs(t.clientY - tap.y) >= 10) return;
		const el = tap.el;
		tap = null;
		(el.closest("input, textarea, select, [contenteditable]") as HTMLElement | null)?.focus();
		el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
	}, { passive: true });
	document.addEventListener("touchcancel", () => { tap = null; }, { passive: true });
}

/** Selection handles sit just outside the text; a touch this close to an end counts as on the handle */
const HANDLE = 44;

/** The finger is on a selection handle, about to resize the selection. Inputs don't expose selection rects – any selection counts */
function onHandle(target: Element, x: number, y: number) {
	const field = target.closest("textarea, input") as HTMLTextAreaElement | HTMLInputElement | null;
	if (field) return field.selectionStart !== field.selectionEnd;
	const s = getSelection();
	if (!s || s.isCollapsed || !s.rangeCount) return false;
	const r = s.getRangeAt(0).getClientRects();
	if (!r.length) return false;
	const near = (px: number, line: DOMRect) => Math.abs(x - px) < HANDLE && y > line.top - HANDLE && y < line.bottom + HANDLE;
	return near(r[0].left, r[0]) || near(r[r.length - 1].right, r[r.length - 1]);
}

/**
 * Horizontal swipe for a drawer: the left one opens to the right and closes to the left; the right one mirrors it.
 * In Safari a swipe starting within EDGE of its edge is the OS's back gesture – ignored. Home-screen apps already stopped it (guardEdges), so edges open too.
 * Direction locks on the first move: horizontal and the right way – the swipe is taken and content doesn't scroll; vertical – let go, it scrolls.
 * Ignored while another dialog or menu is open (the other drawer is role="dialog" too), on code or tables that scroll that way,
 * and while selecting text: on a selection handle (onHandle), or when the selection changes after touch-down (long-press, then drag)
 */
export function useSwipe(d: Drawer, { open, setOpen, onStart }: { open: boolean; setOpen: (open: boolean) => void; onStart?: () => void }) {
	useEffect(() => {
		// The opening direction: right (+1) for the left drawer, left (-1) for the right one
		const opening = d.side === "left" ? 1 : -1;
		// from – progress at touch-down (where it stopped, if mid-animation); pts – recent finger positions, for release velocity
		let g: { x: number; y: number; dir: "h" | null; track: boolean; from: number; w: number; pts: [number, number][] } | null = null;
		/** No drag after all (vertical, wrong way, cancelled): the animation stopped at touch-down finishes */
		const settle = () => d.to(open ? 1 : 0);
		/** Whether el scrolls with a finger moving toward sign – a finger moving right scrolls content back left */
		const scrolls = (el: Element, sign: number) => {
			if (sign > 0) return el.scrollLeft > 0;
			if (el.scrollWidth - el.clientWidth - el.scrollLeft < 1) return false;
			const o = getComputedStyle(el).overflowX;
			return o === "auto" || o === "scroll";
		};
		const down = (e: TouchEvent) => {
			g = null;
			if (e.touches.length !== 1) return;
			// Also ignored with a long-press menu or a confirm dialog open
			if (document.querySelector(`[role="dialog"]:not([data-drawer="${d.side}"]), [role="menu"], [role="alertdialog"]`)) return;
			const t = e.touches[0];
			const edge = d.side === "left" ? t.clientX < EDGE : t.clientX > innerWidth - EDGE;
			let track = open || standalone || !edge;
			const sign = open ? -opening : opening;
			if (track) for (let el = e.target as Element | null; el; el = el.parentElement) if (scrolls(el, sign)) track = false;
			if (track && onHandle(e.target as Element, t.clientX, t.clientY)) track = false;
			g = { x: t.clientX, y: t.clientY, dir: null, track, from: track ? d.grab() : 0, w: d.width(), pts: [[e.timeStamp, t.clientX]] };
		};
		const move = (e: TouchEvent) => {
			if (!g?.track) return;
			const t = e.touches[0];
			const dx = t.clientX - g.x;
			const dy = t.clientY - g.y;
			if (!g.dir) {
				// Held until a menu opened (long-press), then moved: that's the menu, not the drawer
				if (document.querySelector('[role="menu"]')) {
					g.track = false;
					return settle();
				}
				if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
				// Mostly vertical, or horizontal the wrong way: not ours
				if (Math.abs(dy) >= Math.abs(dx) || (dx * opening > 0) === open) {
					g.track = false;
					return settle();
				}
				g.dir = "h";
				if (!open) onStart?.();
			}
			if (e.cancelable) e.preventDefault();
			// Follow the finger: the drawer's edge stays under it
			d.drag(g.from + (dx * opening) / g.w);
			g.pts.push([e.timeStamp, t.clientX]);
			if (g.pts.length > 8) g.pts.shift();
		};
		const up = (e: TouchEvent) => {
			if (!g) return;
			const t = e.changedTouches[0];
			const dx = t.clientX - g.x;
			const { dir, track, from, w, pts } = g;
			g = null;
			if (dir) {
				// A fast enough fling wins; otherwise past halfway opens
				const [t0, x0] = pts.find(([at]) => e.timeStamp - at <= 100) ?? pts[pts.length - 1];
				const v = e.timeStamp > t0 ? ((t.clientX - x0) * opening) / (e.timeStamp - t0) : 0;
				const next = v > FLING ? true : v < -FLING ? false : from + (dx * opening) / w > 0.5;
				d.to(next ? 1 : 0);
				if (next !== open) setOpen(next);
			} else if (track) settle();
		};
		// The selection changed mid-touch – a long-press select or a handle drag. Let go if the drawer hasn't moved yet
		const select = () => {
			if (!g?.track || g.dir || getSelection()?.isCollapsed !== false) return;
			g.track = false;
			settle();
		};
		const cancel = () => {
			if (g?.track) settle();
			g = null;
		};
		document.addEventListener("touchstart", down, { passive: false });
		document.addEventListener("touchmove", move, { passive: false });
		document.addEventListener("touchend", up, { passive: true });
		document.addEventListener("touchcancel", cancel, { passive: true });
		document.addEventListener("selectionchange", select);
		return () => {
			document.removeEventListener("selectionchange", select);
			document.removeEventListener("touchstart", down);
			document.removeEventListener("touchmove", move);
			document.removeEventListener("touchend", up);
			document.removeEventListener("touchcancel", cancel);
		};
	}, [d, open, setOpen, onStart]);
}
