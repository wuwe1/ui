---
name: component
description: Build a component in @wuwe1/ui – usually one affectUI has. Don't copy it: understand it, redesign it our way, propose, build, show the real thing in a mixer block, and commit only after the user says yes.
---

# Build a component

Understand, redesign, then build – never copy. The bars: `docs/principles.md`, `docs/theme.md`, `docs/writing.md`. Finish each step before the next.

## 1. Understand

- affectUI has it – open its page when you get to it, one page at a time; its terms forbid scraping. Look at the result, never the code
- Screenshot every state in both modes, phone and desktop; read When to use, API, Keyboard, Accessibility, Motion
- Say in one or two sentences what job it does
- A project already has its own – list every case it handles; none may be lost

## 2. Redesign

- Keep what serves the job; change what clashes with our rules: no spinner next to text, one accent color, status dots in lists, Chinese UI copy
- One style – the theme does the rest
- Fit agent work: dozens of items mean lines, not cards

## 3. Propose

- A table per component, affectUI against ours: what we keep, adopt, make optional, skip – and why
- Wait for the user's go

## 4. Build

- The spec first: `docs/components/<file>.md`, sections in the order `docs/principles.md` gives, every state
- Props in, callbacks out; no fetching, no global state. Loading and empty are the component's job
- Pure logic in `src/lib/<name>.ts`, tested in `test/<name>.test.ts`
- Tokens only; a signal as text is `-strong`. Keys, screen reader and motion per `docs/principles.md`
- The file's first comment: what it is, and why it's built this way
- Showcase: one story per state in `showcase/stories.tsx`, data that looks real, the page in a `NAV` group

## 5. Check

- `pnpm check`, `pnpm test`, `pnpm build`
- Screenshots: every state × phone 390 and desktop × both modes. Open one directly: `/?p=<Component>&s=<State>&mode=dark&w=390&bare=1`
- The dev server listens on `localhost` over IPv6 – `127.0.0.1` won't connect
- Playwright isn't a dependency: `npm i playwright-core` in `/tmp/pw`, then `npx playwright-core install webkit`. Use WebKit – the iPhone's engine
- An element taller than the viewport – enlarge the viewport; stitched scrolling screenshots distort
- Walk the keys: Tab order, `Enter`, `Esc`, focus rings
- Once more with `reducedMotion: "reduce"`
- Stop servers by PID; screenshots go in `/tmp`

## 6. Show it in a block

The user reviews in mixer, often on a phone.

- Write a ```block that imports the real component – `import { X } from "@wuwe1/ui/<file>"` – with every state, live where it can be (clicks that settle after a second), and a 跟随 / 浅色 / 深色 toggle that sets the block page's class
- The user's computer has reduced motion on: when `matchMedia("(prefers-reduced-motion: reduce)")` matches, show a note and 「在这里照常播放」, which adds a class whose CSS replays the component's motion with `!important`
- Try it first: build mixer, start `HOME=<tmp> MIXER_DATA=<tmp> MIXER_PORT=5859 node server/main.ts` with a session file under `<tmp>/.claude/projects/` holding the block, open it in WebKit, click through, stop it by PID
- Point out what changed against affectUI and against the project's old version

## 7. Commit after a yes

- ui: commit and push. The first line says what changed; below it, where it was checked
- Then wire the project to it: import `@wuwe1/ui/<file>`, keep only the data layer, delete the project's copy, update the project's docs. Commit in the project; push when asked
