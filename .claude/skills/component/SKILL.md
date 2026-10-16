---
name: component
description: Build a new component in @wuwe1/ui, or move one in from a project. Spec first, then every state on the showcase, then keys, screen reader, motion, both modes and phone width, then wire it into the project.
---

# Build a component

The bars: `docs/principles.md`, `docs/theme.md`, `docs/writing.md`. Finish each step before the next.

## 1. What it does

- One or two sentences
- affectUI has a counterpart – study its page first: screenshots in both modes on phone and desktop, and the CSS variables on its elements. Learn the design; never copy the source
- Moving one in from a project – list every case it handles today; none may be lost

## 2. Spec

Write `docs/components/<file>.md` before any code, sections in the order `docs/principles.md` gives. States must be complete.

## 3. API

- Props in, callbacks out; no fetching, no global state
- Loading and empty are the component's job: `items={null}` is loading, `empty` is what shows when there's nothing
- Pure logic goes in `src/lib/<name>.ts`, tested in `test/<name>.test.ts`

## 4. Build

- Tokens only; a signal as text is `-strong`
- Keys, screen reader and motion per `docs/principles.md`
- The file's first comment: what it is, and why it's built this way – a line or two

## 5. Showcase

Add it to `showcase/stories.tsx`, one story per state, with data that looks real. `pnpm dev`, then flip modes and widths through each one.

## 6. Check

- `pnpm check`, `pnpm test`, `pnpm build`
- Screenshots: every state × phone 390 and desktop × both modes. Open one directly: `/?p=<Component>&s=<State>&mode=dark&w=390&bare=1`
- The dev server listens on `localhost` over IPv6 – `127.0.0.1` won't connect
- Playwright isn't a dependency: `npm i playwright-core` in `/tmp/pw`, then `npx playwright-core install webkit`. Use WebKit – the iPhone's engine
- An element taller than the viewport – enlarge the viewport; stitched scrolling screenshots distort
- Walk the keys: Tab order, `Enter`, `Esc`, focus rings
- Once more with `page.emulateMedia({ reducedMotion: "reduce" })`
- Stop servers by PID; screenshots go in `/tmp`

## 7. Wire it into the project

Import `@wuwe1/ui/<file>`, write the layer that feeds it data, delete the project's copy, update the project's docs.

## 8. Commit

One commit in ui, one in the project. The first line says what changed; below it, where it was checked.
