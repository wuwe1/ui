# @wuwe1/ui

wuwe1 各项目共用的组件库：主题、基础组件、AI 产品组件。公开仓库，不写个人信息。

## 命令

- `pnpm dev` – 展示页：每个 token、每个组件的每种状态
- `pnpm check` / `pnpm test` / `pnpm build`
- `pnpm gen` – 改了主题后重新生成 `tokens.css`

做完的标准：check、test 过；改了组件或主题，在展示页看过每种状态（手机、深浅色）。

## 目录

| 目录 | 内容 |
|---|---|
| `src/theme/` | 主题。设计见 `docs/theme.md` |
| `src/components/` | 组件，一个文件一个，用法 `@wuwe1/ui/<文件名>` |
| `src/styles.css` | 项目引的入口 |
| `showcase/` | 展示页 |
| `docs/` | `theme.md` 主题；`principles.md` 完成度；`writing.md` 写法和命名；`components/` 组件文档 |
| `.claude/skills/component/` | 做组件的流程 |

文件做什么写在文件开头的注释里。

## 约定

- 写法照 `docs/writing.md`：短、具体；标识符用英文原名，说明用中文
- 组件只用 token；有固定意思的颜色当字用 `-strong`
- 组件只吃数据：props 进，回调出
- 做组件照 `.claude/skills/component/SKILL.md`
- 学 affectUI 的完成度，不搬它的源码
- 提交在 main 上，中文

## 怎么写 AGENTS.md

- 根目录只放每次都要知道的：命令、目录、约定
- 只有某个目录用得到的，写在那个目录的 `AGENTS.md`，旁边放一行 `@AGENTS.md` 的 `CLAUDE.md`
- 长说明放 `docs/`，这里一句话指过去
- 能从代码看出来的不写；只写试过的
- 每份 200 行以内
