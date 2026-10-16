# src/theme

设计见 `docs/theme.md`。

- `tokens.css` 是生成的：改 `themes.ts` 或 `roles.ts`，再 `pnpm gen`。没 gen 就提交，CI 会挂
- 新 token 加在 `roles.ts`：写 `doc`；当字用的写 `needs`（正文 7:1，次要 4.5:1）；再到 `theme.css` 加 Tailwind 名字
- 颜色在 OKLCH 里推，不手挑 hex。系列色例外：它是过了色盲检查的调色板
- `theme.css` 只放 Tailwind 指令：mixer 现场编 block 的 class 时会整份拿去用
- 深浅色靠 `light-dark()`，需要 Safari 17.5+；不写 `.dark [data-theme]` 这类组合选择器
