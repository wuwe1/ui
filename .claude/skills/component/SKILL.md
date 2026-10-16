---
name: component
description: 在 @wuwe1/ui 里做新组件，或把项目里的组件搬进来时用。先写规格，再在展示页摆出每种状态，再查键盘、无障碍、动效、深浅色、手机宽度，最后写文档、在项目里接上。
---

# 做一个组件

要求见 `docs/principles.md`、`docs/theme.md`、`docs/writing.md`。一步做完再下一步。

## 1. 它做什么

- 一两句话
- 有 affectUI 的同类组件就先看演示页：截图（深浅色、手机电脑），取元素上的 CSS 变量。只学设计，不搬源码
- 从项目搬来的：列出它现在处理的每种情况，搬完不能少

## 2. 规格

先写 `docs/components/<文件名>.md`，再写代码。小节：做什么 / Anatomy / States / When to use / When not to use / Accessibility / Motion / Responsive / Notes for AI。States 要全。

## 3. 接口

- props 进，回调出；不拿接口，不读全局状态
- 加载中、空由组件自己画：`items={null}` 是加载中，`empty` 是空时放什么
- 纯逻辑放 `src/lib/<名字>.ts`，配 `test/<名字>.test.ts`

## 4. 实现

- 只用 token；信号色当字用 `-strong`
- 键盘、无障碍、动效照 `docs/principles.md`
- 文件开头一两行注释：它是什么，为什么这样做

## 5. 展示页

在 `showcase/stories.tsx` 登记，每个 State 一个，数据像真的。`pnpm dev`，切深浅色和宽度一个个看。

## 6. 检查

- `pnpm check`、`pnpm test`、`pnpm build`
- 截图：每个状态 × 手机 390 / 电脑 × 深浅色。直接打开一种：`/?p=<组件>&s=<状态>&mode=dark&w=390&bare=1`
- Playwright 不在依赖里：`npm i playwright-core` 装到 `/tmp/pw`，`npx playwright-core install webkit`。用 WebKit，和 iPhone 同内核
- 元素比视口高就把视口开大，滚动拼接的截图会走样
- 键盘走一遍：Tab 顺序、`Enter`、`Esc`、焦点环
- `page.emulateMedia({ reducedMotion: "reduce" })` 再看一遍
- 服务按 PID 停掉；截图放 `/tmp`

## 7. 在项目里接上

引 `@wuwe1/ui/<文件名>`，写接数据的那一层，删掉项目里原来那份，同步项目的文档。

## 8. 提交

ui、项目各提交一次。第一行说做了什么，下面写在哪看过。
