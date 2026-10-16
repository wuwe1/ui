# src/theme：主题

设计在 `docs/theme.md`。改这里时：

- `tokens.css` 是生成的，不手改：改 `themes.ts`（旋钮）或 `roles.ts`（怎么推），再 `pnpm gen`。没跑 gen 就提交，CI 会挂
- 新 token 加在 `roles.ts`：写清用途（`doc`），当字用的写 `needs`（要放在哪些底上、要多少对比度：正文 7，次要的 4.5）；再在 `theme.css` 给它 Tailwind 名字（`--color-<名字>`）
- 颜色只在 OKLCH 里推，不手挑 hex（系列色除外：它是过了色盲检查的调色板，照原样用）
- 改完 `pnpm test`：每个内置主题、深浅两种模式下的对比度都要过；在展示页的「主题」一页看深浅两块预览
- `theme.css` 只放 Tailwind 的指令（不出样式），页面里现场给 block 编 class 时会把它整份拿去当输入（mixer 的 `lib/block-compile.ts`）
- 浏览器要支持 `light-dark()`（Safari 17.5 起）：深浅色靠它，不写 `.dark [data-theme=…]` 这种组合选择器
