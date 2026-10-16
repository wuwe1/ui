# src/components

完成度见 `docs/principles.md`，流程见 `.claude/skills/component/SKILL.md`。

- 互相引用写相对路径带后缀：`./button.tsx`。不用 `@/`，项目有自己的别名
- 有固定意思的颜色：点、图标用实心 `bg-waiting`，字用 `text-waiting-strong`，淡底用 `bg-waiting-subtle`
- 字号只用 `text-2xs` 11px、`text-xs` 12px、`text-md` 13px、`text-sm` 14px、`text-lg` 18px。别的名字 `cn` 会当颜色删掉
- 图标按钮用 Button 的 `size="icon-xs"` 24px、`"icon-sm"` 28px、`"icon"` 32px
- 每种状态在 `showcase/stories.tsx` 登记；不是 shadcn 原样的，写 `docs/components/<文件名>.md`
- 从 shadcn/ui 拷来的，改过的地方在文件开头注明
