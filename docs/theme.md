# 主题（design token）

改主题只动几个旋钮，别的颜色都推出来；每个当字用的颜色都有对比度要求，测试守着；主题、深浅色能套在页面的任何一块上。代码：`src/theme/`，各文件开头写着它做什么。

## 三层

```
旋钮（themes.ts）→ token（roles.ts 推出来，生成 tokens.css）→ Tailwind 名字（theme.css）
```

组件只用最后一层：`bg-background`、`text-muted-foreground`、`bg-waiting`、`text-waiting-strong`。不写具体颜色（`amber-500`、`#fff`、`text-[13px]`），review 时看到就是要改的。

## 旋钮

| 旋钮 | 管什么 |
|---|---|
| `neutral` | 灰的色调（色相、彩度），深浅色分开给。base 的浅色是纯灰，深色带一点冷色 |
| `signals` | 七种有固定意思的颜色的实心那份：`waiting`（要你处理）、`unread`（新的、在跑）、`success`、`destructive`（出错、删除）、`added`、`modified`、`renamed`（`removed` 就是 `destructive`） |
| `series` | 8 个系列色：图表里哪一组、构成图里哪一部分。dataviz 的参考调色板，相邻两色过了色盲区分度检查 |
| `radius` | 圆角基准，别的圆角是它的倍数 |

## token 怎么推出来

- **面**：固定几档亮度，从外到里 `sidebar` < `background` < `card` / `popover`（深色反过来），色调照 `neutral`
- **字**：正文固定；次要的字（`muted-foreground`）、有固定意思的颜色当字用（`*-strong`）按对比度求：OKLCH 里色相、彩度不动，只挪亮度，挪到在每层面上、在自己的淡底上都至少 4.5:1（WCAG AA）为止
- **半透明的层**：`muted`、`secondary`、`accent` 是黑（深色里是白）加一点不透明度，叠在哪层面上都比那层深一点
- **有固定意思的颜色各三份**：实心（点、图标、填色）、`-strong`（当字用）、`-subtle`（淡底：diff 的行、徽标）
- **广色域**：琥珀、绿这些 sRGB 放不下的颜色照原样写（Mac、iPhone 的屏上更鲜艳），只把比 Display P3 还大的降到放得下（不然 Chrome 按通道截断、色相跑偏）；算对比度时按放进 sRGB 的样子估

每个 token 的用途、要满足的对比度写在 `roles.ts`；`test/theme.test.ts` 对每个内置主题、深浅两种模式都查一遍，不够就挂。

## 改主题

1. 展示页（`pnpm dev`）的「主题」一页拖旋钮，深浅两种并排看一小块真实的界面，下面的表里每个字的对比度够不够一眼看得出
2. 满意了点「复制」，贴进 `src/theme/themes.ts`
3. `pnpm gen` 重新生成 `tokens.css`，`pnpm test` 查对比度

要新的 token：在 `roles.ts` 加一个（写清用途、要放在哪些底上、要多少对比度），`theme.css` 里给它 Tailwind 名字，再 `pnpm gen`。

## 套主题

- 默认主题就在 `:root` 上；别的内置主题：任何元素上写 `data-theme="paper"`，那一块就换了
- 深浅色：什么都不写跟着系统（不用 JS，也不会先白一下再变黑）；`.dark` / `.light` 套在哪一块，那一块就固定成深 / 浅
- `applyMode("light" | "dark" | "system")`：记住用户选的，并在 `<html>` 上加 class（Tailwind 的 `dark:` 认 class）
- 自定义的主题（用户自己调的）：`applyTheme(theme, el)` 把变量写在那个元素上

能这样套，是因为每个 token 写成 `light-dark(浅色, 深色)`，取哪个看所在那一块的 `color-scheme`：不用写「深色下的 paper 主题」这种组合选择器，主题和深浅色可以随便嵌套。要求浏览器支持 `light-dark()`（Safari 17.5、Chrome 123、Firefox 120 起）。

## 和以前比（mixer 照 affectUI 手挑的那一套）

| | 以前 | 现在 |
|---|---|---|
| 色值 | 深浅各一套手挑的 hex | 旋钮推出来：换一个色调，整套跟着变 |
| 对比度 | 没人查：侧栏上的灰字 4.3:1，倒计时的琥珀字 2.1:1，改动的 +12、文件状态字母 3.2–3.8:1 | 每个字的 token 写明要放在哪些底上、要多少，测试守着 |
| 状态色当字用 | 和点同一个颜色 | 实心 / `-strong` / `-subtle` 三份 |
| 套主题 | 整页切 `.dark` | 任何一块都能换主题、切深浅 |
| 广色域 | 超出 sRGB 的颜色交给浏览器 | 只降到 P3 放得下，不会被截断 |
| 中文 | 落到浏览器挑的字体 | 明确落到系统黑体（苹方、冬青、思源） |

留下来的（affectUI 做得好的）：四层灰从外到里一层比一层亮，半透明的悬停层，默认黑白灰、颜色挑着用。

## 待定

- **输入框的边**：现在和分隔线一样（1.2:1）。WCAG 1.4.11 要求输入框的边界和旁边至少 3:1，做到要深不少
- **焦点环**：组件里是 `ring` 的一半透明，对比度不到 3:1（WCAG 2.4.13，AAA）。可以改成实心、外面留 2px 空隙
- **密度**：手机上一行 44px、电脑上 32px 现在写在各组件里，要不要成为旋钮
