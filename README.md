# @wuwe1/ui

wuwe1 各项目共用的组件库。

- **主题** – 改几个旋钮，整套颜色跟着变；字的对比度有测试守着（`docs/theme.md`）
- **组件** – 基础组件改自 shadcn/ui；AI 产品组件照 affectUI 的完成度做（`docs/principles.md`）
- **展示页** – `pnpm dev`，每个 token、每个组件的每种状态

## 用

还没发 npm。把仓库放在项目旁边，用 link：

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

link 进来的库带着自己的 `node_modules`，项目的 Vite 要 `resolve.dedupe` 掉 React 这些，见 mixer 的 `vite.config.ts`。

## 开发

```sh
pnpm install
pnpm dev     # 展示页
pnpm check
pnpm test
pnpm gen     # 改了主题后
```

规则在 `AGENTS.md`。

## 致谢

基础组件改自 [shadcn/ui](https://ui.shadcn.com)（MIT），动画用 [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css)（MIT），完成度学 [affectUI](https://www.affectui.com)（没用它的源码）。
