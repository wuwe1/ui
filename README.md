# @wuwe1/ui

wuwe1 的组件库：主题（design token）、基础组件、AI 产品组件。各项目共享。

- **主题**：改几个旋钮，别的颜色都推出来；每个当字用的颜色都有对比度要求，测试守着；主题、深浅色能套在页面的任何一块上（`docs/theme.md`）
- **组件**：基础组件从 shadcn/ui 改来，AI 产品组件（Inbox…）照 affectUI 的完成度做：状态、键盘、无障碍、动效、响应式都想到（`docs/principles.md`）
- **展示页**：`pnpm dev`，每个 token、每个组件的每种状态

## 在项目里用

还没发 npm，先放在项目旁边（`~/repos/ui`），用 link：

```jsonc
// package.json
"dependencies": { "@wuwe1/ui": "link:../ui" }
```

```css
/* 项目的 CSS */
@import "tailwindcss";
@import "@wuwe1/ui/styles.css";
@import "@fontsource-variable/geist";
```

```tsx
import { Button } from "@wuwe1/ui/button";
import { applyMode } from "@wuwe1/ui/theme";

applyMode("system"); // 跟着系统，并给 Tailwind 的 dark: 加 class
```

link 进来的库带着自己的 `node_modules`：项目的 Vite 配置里要 `resolve.dedupe` 掉 React 这些（只能有一份），见 mixer 的 `vite.config.ts`。

换主题：任何元素上写 `data-theme="paper"`；深浅色：`.dark` / `.light`，什么都不写跟着系统。

## 开发

```sh
pnpm install
pnpm dev     # 展示页
pnpm check   # 类型检查
pnpm test    # 对比度、颜色算法
pnpm gen     # 改了主题后重新生成 tokens.css
```

规则在 `AGENTS.md`。

## 致谢

基础组件改自 [shadcn/ui](https://ui.shadcn.com)（MIT），variant 的写法来自它的 `tailwind.css`；动画用 [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css)（MIT）。设计上学了 [affectUI](https://www.affectui.com) 的完成度（没有用它的源码）。
