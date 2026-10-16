# @wuwe1/ui

Components shared by wuwe1's projects.

- **Theme** – turn a few knobs and every color follows; tests hold text contrast (`docs/theme.md`)
- **Components** – base components adapted from shadcn/ui, AI product components built to affectUI's level of finish (`docs/principles.md`)
- **Showcase** – `pnpm dev`: every token, every state of every component

## Use

Not on npm yet. Clone it next to your project and link it:

```jsonc
"dependencies": { "@wuwe1/ui": "link:../ui" }
```

```css
@import "tailwindcss";
@import "@wuwe1/ui/styles.css";
@import "@fontsource-variable/geist";
```

```tsx
import { Button } from "@wuwe1/ui/button";
import { applyMode } from "@wuwe1/ui/theme";

applyMode("system");
```

In `vite.config.ts`:

```ts
build: { cssTarget: ["safari17.5", "chrome123", "firefox120", "edge123"] },
resolve: { dedupe: ["react", "react-dom", "radix-ui", "lucide-react", "cmdk", "cn", "class-variance-authority"] },
```

- `cssTarget` – keeps `light-dark()` native, so modes work on any block (`docs/theme.md`)
- `dedupe` – a linked package brings its own `node_modules`; React and friends must be one copy

## Develop

```sh
pnpm install
pnpm dev     # showcase
pnpm check
pnpm test
pnpm gen     # after a theme change
```

Rules for people and agents: `AGENTS.md`.

## Credits

Base components adapt [shadcn/ui](https://ui.shadcn.com) (MIT). Animations use [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) (MIT). The level of finish follows [affectUI](https://www.affectui.com); none of its source is used.
