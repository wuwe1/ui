// Semantic tokens – the only colors components use. Each one is derived from the knobs; needs is the contrast it must meet.
import { flatten, type Oklch, solve } from "./color.ts";

export type Mode = "light" | "dark";
/** A tint: hue in degrees, chroma (0 is pure gray) */
export type Tint = { hue: number; chroma: number };

/** Colors with a fixed meaning: status (needs you, new or running, succeeded, error) and changes (added, modified, renamed; removed is destructive) */
export const SIGNALS = ["waiting", "unread", "success", "destructive", "added", "modified", "renamed"] as const;
export type Signal = (typeof SIGNALS)[number];

/** A theme: the only things a theme changes */
export type ThemeInput = {
	/** The data-theme value */
	name: string;
	/** One line: how it looks, who it's for */
	note: string;
	/** Gray tint per mode – a touch of blue in dark grays reads as screen, not wet paper */
	neutral: Record<Mode, Tint>;
	/** The solid shade of each signal – dots, icons, fills. No dark value – the light one is used */
	signals: Record<Signal, { light: Oklch; dark?: Oklch }>;
	/** Series colors for charts and parts of a whole, used in order, never cycled. Neighbors must pass a color-blindness check */
	series: Record<Mode, string[]>;
	/** Base radius in rem; the other radii are multiples (theme.css) */
	radius: number;
};

/**
 * Surface lightness. Light rises from the outside in: sidebar outermost, background the content panel, card and popover on top.
 * Dark puts the sidebar a step above the panel – the panel reads as set into it, its edge drawn by SidebarInset's ring; menus over the sidebar sit darker and keep their border.
 * raised – what sits up on a muted track, a segmented control's pill: white like a card in light, a step above the track in dark.
 * border, sidebarBorder – lines as drawn; LINE moves them where a mode asks for contrast. field – the fill under inputs, and where input borders start
 */
const SURFACE: Record<Mode, { sidebar: number; background: number; card: number; raised: number; border: number; field: number; sidebarBorder: number; foreground: number; primary: number; ring: number }> = {
	light: { sidebar: 0.9702, background: 0.9911, card: 1, raised: 1, border: 0.9219, field: 0.9219, sidebarBorder: 0.9219, foreground: 0.1448, primary: 0.2046, ring: 0.708 },
	dark: { sidebar: 0.24, background: 0.1826, card: 0.2143, raised: 0.285, border: 0.2694, field: 0.302, sidebarBorder: 0.2401, foreground: 0.9461, primary: 0.9461, ring: 0.556 },
};
/** Translucent layers – black in light mode, white in dark – so they show on any surface. muted and secondary inset, accent hovers */
const OVERLAY: Record<Mode, { muted: number; accent: number }> = { light: { muted: 0.039, accent: 0.051 }, dark: { muted: 0.051, accent: 0.071 } };
/** Shadows – black at these opacities. Dark surfaces need far more for a shadow to show at all. rest – under a card resting in a tray; near and far – the tight and the wide part of a floating shadow */
const SHADE: Record<Mode, { rest: number; near: number; far: number }> = { light: { rest: 0.05, near: 0.06, far: 0.16 }, dark: { rest: 0.3, near: 0.3, far: 0.55 } };
/** subtle – a signal's tint for diff lines and badge fills: the solid shade at this opacity */
const SUBTLE: Record<Mode, number> = { light: 0.12, dark: 0.18 };
/** Where muted text starts; contrast moves it darker or lighter if needed */
const MUTED_TEXT: Record<Mode, number> = { light: 0.5555, dark: 0.65 };

/** Text contrast (WCAG 2): body text 7 (AAA); secondary text and signal text 4.5 (AA) */
export const TEXT = { strong: 7, normal: 4.5 } as const;

/**
 * Line contrast on every surface a line sits on. input – 3 in both modes, what WCAG 1.4.11 asks of a control's edge.
 * divider – dividers and card edges: 1.8 in dark, where 1.2 was lost on a phone; light lines stay as drawn, about 1.2
 */
export const LINE: { divider: Partial<Record<Mode, number>>; input: number } = { divider: { dark: 1.8 }, input: 3 };

/** A contrast a token must meet: one for both modes, or per mode – a mode left out has none */
export type Need = number | Partial<Record<Mode, number>>;

/** A token: CSS variable name without --, its use, a value per mode; needs – [contrast, tokens it sits on] */
export type Role = { name: string; doc: string; value: Record<Mode, Oklch>; needs?: [Need, string[]] };

/** The contrast r needs in this mode, if any */
export const needOf = (r: Role, mode: Mode): number | undefined => (r.needs === undefined ? undefined : typeof r.needs[0] === "number" ? r.needs[0] : r.needs[0][mode]);

const gray = (t: Tint, l: number, alpha?: number): Oklch => (alpha === undefined ? { l, c: t.chroma, h: t.hue } : { l, c: 0, h: 0, alpha });

/** Theme → every token, in the order the CSS lists them */
export function roles(theme: ThemeInput): Role[] {
	const by = (f: (mode: Mode) => Oklch): Record<Mode, Oklch> => ({ light: f("light"), dark: f("dark") });
	const s = (mode: Mode) => SURFACE[mode];
	const n = (mode: Mode, l: number) => gray(theme.neutral[mode], l);
	const surfaces = (mode: Mode) => [n(mode, s(mode).background), n(mode, s(mode).card), n(mode, s(mode).sidebar), n(mode, s(mode).raised)];
	/** muted over background – code and badge fills; muted text must read on it too */
	const mutedBg = (mode: Mode) => flatten(gray(theme.neutral[mode], ink(mode), OVERLAY[mode].muted), n(mode, s(mode).background));
	const away = (mode: Mode) => (mode === "light" ? "darker" : "lighter");
	const ink = (mode: Mode) => (mode === "light" ? 0 : 1);
	const SURFACES = ["background", "card", "popover", "sidebar", "raised"];
	/** What lines sit on: the opaque surfaces (popover is card) */
	const under = (mode: Mode) => [n(mode, s(mode).background), n(mode, s(mode).card), n(mode, s(mode).sidebar)];
	const LINED = ["background", "card", "popover", "sidebar"];
	/** A line drawn at l, moved until target on every color in on; no target – as drawn */
	const line = (mode: Mode, l: number, target: number | undefined, on: Oklch[]) => (target === undefined ? n(mode, l) : solve(n(mode, l), target, on, away(mode)));

	const list: Role[] = [
		{ name: "sidebar", doc: "Outermost surface – the sidebar", value: by((m) => n(m, s(m).sidebar)) },
		{ name: "background", doc: "Content panel", value: by((m) => n(m, s(m).background)) },
		{ name: "card", doc: "Cards", value: by((m) => n(m, s(m).card)) },
		{ name: "popover", doc: "Menus, popovers, dialogs", value: by((m) => n(m, s(m).card)) },
		{ name: "raised", doc: "Raised on a muted track – a segmented control's pill", value: by((m) => n(m, s(m).raised)) },
		{ name: "foreground", doc: "Body text", value: by((m) => n(m, s(m).foreground)), needs: [TEXT.strong, SURFACES] },
		{ name: "card-foreground", doc: "Text on cards", value: by((m) => n(m, s(m).foreground)), needs: [TEXT.strong, ["card"]] },
		{ name: "popover-foreground", doc: "Text on popovers", value: by((m) => n(m, s(m).foreground)), needs: [TEXT.strong, ["popover"]] },
		{ name: "sidebar-foreground", doc: "Text in the sidebar", value: by((m) => n(m, s(m).foreground)), needs: [TEXT.strong, ["sidebar"]] },
		{ name: "muted-foreground", doc: "Secondary text – times, captions", value: by((m) => solve(n(m, MUTED_TEXT[m]), TEXT.normal, [...surfaces(m), mutedBg(m)], away(m))), needs: [TEXT.normal, [...SURFACES, "muted"]] },
		{ name: "primary", doc: "Primary button fill", value: by((m) => n(m, s(m).primary)) },
		{ name: "primary-foreground", doc: "Primary button text", value: by((m) => n(m, m === "light" ? 1 : s(m).background)), needs: [TEXT.normal, ["primary"]] },
		{ name: "secondary", doc: "Secondary button fill, translucent", value: by((m) => gray(theme.neutral[m], ink(m), OVERLAY[m].muted)) },
		{ name: "secondary-foreground", doc: "Secondary button text", value: by((m) => n(m, s(m).foreground)), needs: [TEXT.strong, ["secondary"]] },
		{ name: "muted", doc: "Inset layer for code and badges, translucent", value: by((m) => gray(theme.neutral[m], ink(m), OVERLAY[m].muted)) },
		{ name: "accent", doc: "Hover and selection, translucent", value: by((m) => gray(theme.neutral[m], ink(m), OVERLAY[m].accent)) },
		{ name: "accent-foreground", doc: "Text on hover and selection", value: by((m) => n(m, s(m).foreground)), needs: [TEXT.strong, ["accent"]] },
		{ name: "sidebar-accent", doc: "Hovered or selected sidebar row", value: by((m) => gray(theme.neutral[m], ink(m), OVERLAY[m].accent)) },
		{ name: "sidebar-accent-foreground", doc: "Text on the selected sidebar row", value: by((m) => n(m, s(m).foreground)), needs: [TEXT.strong, ["sidebar-accent"]] },
		{ name: "sidebar-primary", doc: "Strongest fill in the sidebar", value: by((m) => n(m, s(m).primary)) },
		{ name: "sidebar-primary-foreground", doc: "Text on the strongest sidebar fill", value: by((m) => n(m, m === "light" ? 1 : s(m).background)), needs: [TEXT.normal, ["sidebar-primary"]] },
		{ name: "border", doc: "Dividers, card edges, outline buttons", value: by((m) => line(m, s(m).border, LINE.divider[m], under(m))), needs: [LINE.divider, LINED] },
		{ name: "input", doc: "Edges of fields – inputs, textareas, selects", value: by((m) => line(m, s(m).field, LINE.input, under(m))), needs: [LINE.input, LINED] },
		{ name: "field", doc: "Fills of fields and switch tracks, translucent (bg-field/30); a selected tab's edge", value: by((m) => n(m, s(m).field)) },
		{ name: "sidebar-border", doc: "Dividers in the sidebar", value: by((m) => line(m, s(m).sidebarBorder, LINE.divider[m], [n(m, s(m).sidebar)])), needs: [LINE.divider, ["sidebar"]] },
		{ name: "ring", doc: "Focus ring", value: by((m) => n(m, s(m).ring)) },
		{ name: "sidebar-ring", doc: "Focus ring in the sidebar", value: by((m) => n(m, s(m).ring)) },
		{ name: "shade-rest", doc: "Shadow under what rests on a surface – a card in a tray", value: by((m) => gray(theme.neutral[m], 0, SHADE[m].rest)) },
		{ name: "shade-near", doc: "The tight part of a floating shadow", value: by((m) => gray(theme.neutral[m], 0, SHADE[m].near)) },
		{ name: "shade-far", doc: "The soft, wide part of a floating shadow", value: by((m) => gray(theme.neutral[m], 0, SHADE[m].far)) },
	];

	for (const sig of SIGNALS) {
		const solid = (m: Mode) => theme.signals[sig][m] ?? theme.signals[sig].light;
		const subtle = (m: Mode): Oklch => ({ ...solid(m), alpha: SUBTLE[m] });
		const what = SIGNAL_DOC[sig];
		list.push(
			{ name: sig, doc: `${what} – dots, icons`, value: by(solid) },
			{
				name: `${sig}-strong`,
				doc: `${what} – text`,
				value: by((m) => solve(solid(m), TEXT.normal, [...surfaces(m), flatten(subtle(m), n(m, s(m).background))], away(m))),
				needs: [TEXT.normal, [...SURFACES, `${sig}-subtle`]],
			},
			{ name: `${sig}-subtle`, doc: `${what} – tint`, value: by(subtle) },
		);
	}
	return list;
}

/** What each signal means – the same everywhere; never decoration or categories */
export const SIGNAL_DOC: Record<Signal, string> = {
	waiting: "Needs you",
	unread: "New or running",
	success: "Succeeded",
	destructive: "Error or delete",
	added: "Added",
	modified: "Modified",
	renamed: "Renamed",
};
