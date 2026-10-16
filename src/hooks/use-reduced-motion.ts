// Whether the device asks for reduced motion, kept in sync with the setting. For the motion a JS decision makes – a highlight that fades in place
// instead of gliding, a pop that becomes a fade; CSS motion uses motion-safe: and motion-reduce:
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (f: () => void) => {
	const m = matchMedia(QUERY);
	m.addEventListener("change", f);
	return () => m.removeEventListener("change", f);
};

export function useReducedMotion(): boolean {
	return useSyncExternalStore(subscribe, () => matchMedia(QUERY).matches, () => false);
}
