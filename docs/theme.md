# 主题

改几个旋钮，整套颜色跟着变。字的对比度有测试守着。主题、深浅色能套在任何一块上。

## 三层

旋钮（`themes.ts`）→ token（`roles.ts` 推出来，生成 `tokens.css`）→ Tailwind 名字（`theme.css`）。

组件只用最后一层：`bg-background`、`text-muted-foreground`、`text-waiting-strong`。不写 `amber-500`、`#fff`、`text-[13px]`。

## 旋钮

| 旋钮 | 管什么 |
|---|---|
| `neutral` | 灰的色调，深浅分开给 |
| `signals` | 七种有固定意思的颜色：`waiting` 要你处理、`unread` 新的或在跑、`success`、`destructive`、`added`、`modified`、`renamed` |
| `series` | 图表的 8 个系列色，过了色盲检查 |
| `radius` | 圆角基准 |

## 怎么推

- 面 – 固定几档亮度：`sidebar` < `background` < `card`
- 字 – 次要的字和 `*-strong` 按对比度求：OKLCH 里只挪亮度，挪到每层面上都有 4.5:1
- 层 – `muted`、`accent` 是半透明的黑或白，叠在哪层上都看得出
- 信号色 – 三份：实心画点和图标，`-strong` 当字，`-subtle` 当淡底
- 广色域 – P3 里的颜色照原样写，只降掉比 P3 还大的

## 改主题

1. 展示页的「主题」页拖旋钮，看深浅两块预览和对比度
2. 点「复制」，贴进 `themes.ts`
3. `pnpm gen`，`pnpm test`

## 套主题

- `data-theme="paper"` – 那一块换主题
- `.dark` / `.light` – 那一块固定深 / 浅；都不写跟着系统，不闪白
- `applyMode("system")` – 给 `<html>` 加 class，Tailwind 的 `dark:` 才认
- `applyTheme(theme, el)` – 套用户自己调的主题

靠 `light-dark()` 实现，需要 Safari 17.5+、Chrome 123+。

## 和以前比

| | 以前（照 affectUI 手挑） | 现在 |
|---|---|---|
| 色值 | 深浅各一套 hex | 旋钮推出来 |
| 对比度 | 侧栏灰字 4.3:1，琥珀字 2.1:1 | 测试守着，全部 ≥ 4.5:1 |
| 信号色当字 | 和点同色 | 单独一份 `-strong` |
| 套主题 | 只能整页 | 任何一块 |

留下的：四层灰从外到里一层比一层亮；半透明的悬停层；默认黑白灰。

## 待定

- 输入框的边 – 现在 1.2:1，WCAG 1.4.11 要 3:1
- 焦点环 – 现在半透明，不到 3:1
- 密度 – 手机 44px、电脑 32px，要不要做成旋钮
