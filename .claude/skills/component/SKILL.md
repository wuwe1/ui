---
name: component
description: 在 @wuwe1/ui 里做一个新组件，或者把项目（mixer 等）里的组件搬进来时用。照 affectUI 的完成度：先写规格（承载什么、全部状态），再在展示页摆出每种状态，再查键盘、无障碍、动效、深浅色、手机宽度，最后写文档、在项目里接上。
---

# 做一个组件

要求在 `docs/principles.md`（完成度）、`docs/theme.md`（token）、`docs/writing.md`（命名、界面文字）。一步一步来，每步做完再下一步。

## 1. 承载什么

- 一两句话写清它替用户做了什么事。用户的说法和代码里的名字对不上时，用代码里的英文名，顺手告诉用户
- 有参考的（affectUI 的同类组件）先看演示页：用 Playwright 截图（深浅色、手机电脑），取元素上的 CSS 变量看尺寸、间距、动效时长。只学设计，不搬 Pro 源码。把它想到的细节列出来（状态、键盘、动效、空的时候怎样），哪些照学、哪些我们做得更好，写进规格
- 从项目里搬过来的：读它现在的代码和文档，列出它已经处理的情况，搬过来不能少

## 2. 规格（先写，再写代码）

`docs/components/<文件名>.md`，小节照这个顺序：

承载什么 / Anatomy（每个元素是什么、来自哪个数据）/ States（全部状态，每个一句）/ When to use / When not to use / Accessibility / Motion / Responsive / Notes for AI

每条写具体行为（哪个元素、什么情况、怎么样），不写形容词。States 要全：默认、空、加载中、出错、很长、很多、禁用、实时变化。

## 3. 接口

- 只吃数据：props 进、回调出（`onOpen`、`onAllow`）。不拿接口、不读全局状态；项目里另写一个接数据的组件（mixer 的 `InboxHome` 接 `Inbox`）
- 加载中、空这些状态由组件自己画（`items={null}` 是加载中，`empty` 给空的时候放什么）
- 只有纯逻辑（分段、排序、格式化）放进 `src/lib/<名字>.ts`，配 `test/<名字>.test.ts`

## 4. 实现

- token：颜色、字号、圆角只用 token；有固定意思的颜色当字用 `-strong`
- 键盘：能点的都能 Tab 到；一组同类的用方向键走；`Esc` 关浮层、焦点还回去；快捷键只给最该接的那一个
- 无障碍：能点的有名字；状态变了 `role="status"`；不嵌套可点的东西；手机上至少 44px
- 动效：只给有意义的变化，时长、缓动照 `docs/principles.md`；`motion-reduce:` 下换成淡入淡出或直接到位
- 文件开头写注释：它做什么、为什么这样做

## 5. 展示页

在 `showcase/stories.tsx` 登记，规格里的每个 State 一个，数据像真的（真实的长度、真实的中文）。`pnpm dev` 打开，切深浅色、手机 / 平板 / 不限宽，一个一个看。

## 6. 检查

- `pnpm check`、`pnpm test`、`pnpm build`
- 截图：每个状态 × 手机（390）/ 电脑 × 浅色 / 深色，看完再说做完了。地址带参数直接打开一种：`/?p=<组件>&s=<状态>&mode=dark&w=390&bare=1`
  - Playwright 不在依赖里：`mkdir -p /tmp/pw && cd /tmp/pw && npm i playwright-core && npx playwright-core install webkit`，用 WebKit（和 iPhone 同一个内核）
  - 元素比视口高时把视口开大（不然截图要滚，滚动拼接会走样）
- 键盘走一遍：Tab 的顺序、`Enter` / `Space`、`Esc`、焦点环看得见
- 减少动效：`page.emulateMedia({ reducedMotion: "reduce" })` 再看一遍
- 用完的服务按 PID 停掉，截图放 `/tmp`，不放仓库里

## 7. 项目里接上

- 项目里引 `@wuwe1/ui/<文件名>`，写接数据的那一层，删掉项目里原来的那份
- 项目的文档（产品行为、组件文档的链接）同步改

## 8. 提交

ui 仓库、项目各提交一次，中文、一段话写清做了什么和为什么、在哪看过（截了哪些状态）。
