# @wuwe1/ui

wuwe1 的组件库：主题（design token）、基础组件、AI 产品组件。mixer、stems、gewu、blockmsg 这些项目共享，组件进了这里，项目里就不再各写一份。
仓库是公开的：外网地址、隧道、邮箱这些个人信息不写进来。

## 命令

- `pnpm dev`：展示页（`showcase/`），主题的每个 token、每个组件的每种状态，能切深浅色和宽度
- `pnpm check`：类型检查；`pnpm test`：node:test（`test/*.test.ts`）；`pnpm build`：打包展示页（确认都编得过）
- `pnpm gen`：改了主题（`src/theme/themes.ts`、`roles.ts`）后重新生成 `src/theme/tokens.css`

改完至少过 `check`、`test`；改了组件或主题，在展示页里把每种状态过一遍、截图（手机宽度、深浅色）看过才算做完。CI 跑 check、test、build，并检查 `tokens.css` 是不是最新的。

## 目录

| 目录 | 是什么 |
|---|---|
| `src/theme/` | 主题：旋钮 → token → CSS。规则在它的 `AGENTS.md`，设计在 `docs/theme.md` |
| `src/components/` | 组件，一个文件一个，项目里 `@wuwe1/ui/<文件名>` 引。规则在它的 `AGENTS.md` |
| `src/styles.css` | 项目引的入口（主题、variant、底、让 Tailwind 扫组件） |
| `showcase/` | 展示页 |
| `docs/` | `theme.md` 主题；`principles.md` 完成度（状态、键盘、无障碍、动效、响应式）；`writing.md` 命名和界面文字；`components/<组件>.md` 每个组件一份 |
| `.claude/skills/component/` | 做一个组件的流程 |

每个文件做什么写在它开头的注释，不另写一份。

## 约定

- 命名：标识符（组件、变量、token、文件、文档小节名、术语）用英文原名，不翻译；自己新起的也直接用名字（`Inbox`，不叫「任务总览」）。给人理解的说明用中文。详见 `docs/writing.md`
- 界面上给人看的字是中文，照 `docs/writing.md`
- 组件只用 token，不写具体颜色、字号；有固定意思的颜色（waiting、destructive…）当字用一律 `-strong`
- 组件只吃数据（props 进、回调出），不拿接口、不读项目的全局状态
- 做组件照 `.claude/skills/component/SKILL.md`：先规格，再展示页的每种状态，再检查，最后文档
- 学 affectUI（只学设计，不搬 Pro 源码）：它想到的细节写进 `docs/principles.md`；它做得不好的（配色）照 `docs/theme.md` 自己做
- 提交直接在 main 上，提交信息用中文、一段话写清做了什么和为什么

## 怎么写 AGENTS.md

这份和子目录里的都照这个写：

- 根目录这份只放每次都要知道的：命令、目录、约定、边界。能从代码看出来的不写
- 只在某个目录用得着的规则，写进那个目录的 `AGENTS.md`（agent 进到那个目录才读）；旁边放一个只有一行 `@AGENTS.md` 的 `CLAUDE.md`，Claude Code 也读得到
- 长的设计说明、规格放 `docs/`，AGENTS.md 里一句话指过去
- 一个文件做什么、为什么这样做，写在它开头的注释，不另开清单（两份迟早对不上）
- 只写试过、确定的事，写明为什么；术语、名字用英文原名，说明用中文
- 一份不超过 200 行，超了就拆进子目录或 `docs/`
