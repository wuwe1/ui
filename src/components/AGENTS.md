# src/components：组件

一个文件一个组件（或一组紧密相关的，比如 `card.tsx` 里的 `Card`、`CardHeader`…），项目里 `@wuwe1/ui/<文件名>` 引。完成度的要求在 `docs/principles.md`，流程在 `.claude/skills/component/SKILL.md`。

- 库里互相引用写相对路径带后缀（`./button.tsx`、`../lib/utils.ts`），不用 `@/` 别名：用的项目有自己的别名
- 颜色、字号、圆角只用 token（`docs/theme.md`）。有固定意思的颜色：点、图标、填色用实心（`bg-waiting`），当字用 `-strong`（`text-destructive-strong`），淡底用 `-subtle`
- 字号用 t-shirt 名字（`text-2xs` 11px、`text-xs` 12px、`text-md` 13px、`text-sm` 14px、`text-lg` 18px），别的名字 `cn` 会当成颜色删掉
- 图标按钮用 Button 的 `size="icon-xs"`（24px）/ `"icon-sm"`（28px）/ `"icon"`（32px），不另写 `size-*`
- 只吃数据：props 进、回调出，不拿接口、不读项目的全局状态
- 每个组件在 `showcase/stories.tsx` 登记全部状态；不是 shadcn 原样的组件写一份 `docs/components/<文件名>.md`
- 基础组件是从 shadcn/ui（MIT）拷来改的，改过的地方在文件里注明；和 shadcn 不一样的写法（destructive 的字用 `-strong`）照这里的规矩
