# Writing

How prose and UI copy read. The bar is affectUI: short, concrete, nothing to skip.

## Prose

Docs, specs, comments, commit messages – English in this repo.

- Lead with what it is or does
- One idea per bullet, one line
- Say what people see, not how the code gets there
- Join a situation and its result with an en dash: `Waits under half a second – the loader would only flash`
- Give the number: 4.5:1, 150ms, 44px – not "fast" or "a bit smaller"
- Plain words: use, show, need – not utilize, leverage, facilitate
- No filler: simply, just, easily, basically, in order to, allows you to, please
- Present tense, active voice, sentence-case headings
- No nested parentheses, no chains of colons
- If the reader can do without a sentence, cut it
- Comments say why, not what – usually one line
- Commit messages: the first line says what changed; up to three more say why and where it was checked

Before:

> To change the theme, you simply need to adjust a few knobs, and all of the other colors will be derived from them automatically. Every color that is used for text has a contrast requirement, which is enforced by the tests. It is possible to apply themes and light and dark modes to any part of the page.

After:

> Turn a few knobs; every color follows. Tests hold text contrast. Themes and modes apply to any subtree.

## Chinese prose

Projects that write docs in Chinese – mixer – follow the same rules, plus:

- No 「其实」「一下」「这样的话」
- The en dash joins a situation and its result here too: `不到半秒的等待 – loader 只会闪一下`

Before:

> 改主题只动几个旋钮，别的颜色都推出来；每个当字用的颜色都有对比度要求，测试守着；主题、深浅色能套在页面的任何一块上。代码：`src/theme/`，各文件开头写着它做什么。

After:

> 改几个旋钮，整套颜色跟着变。字的对比度有测试守着。主题、深浅色能套在任何一块上。

## Naming

- Identifiers keep their English names everywhere, Chinese prose included: components, variables, tokens, files, section names, terms
- New things get a name, not a translation: `Inbox`, never 「任务总览」
- Files kebab-case (`status-icon.tsx`), components PascalCase (`StatusIcon`)
- Tokens name a role (`muted-foreground`), never a color (`gray-500`)

## UI copy

Chinese, and it reads like system settings, not chat.

- Formal verbs: 运行、显示、查看、停止、关闭、移除、取消、创建
- Errors: `X 失败：原因`. Blocked: `原因：怎么办`. Cause unknown: `未知错误`
- Not 「没 X」「不对」「不认识」 – write 「X 失败」「无效」「未知」
- Status: `已 X`, `X 中` or `正在 X…`, `待 X`, `X 失败`
- Empty: `X 为空` or `暂无 X`, then one line on what will show up
- Buttons: 2–6 characters, verb first; `…` when another input follows; cancel is 「取消」
- Status up to 8 characters; a tooltip is one sentence; a description two at most
- Facts in a row are set apart by position, color and weight – never `·` or `|`. Hierarchy uses `›`
- Say 「你」, never 「您」 or 「请」. Say 「这一轮」「这个会话」, not 「本轮」「此」
- A count follows its title, not bold; `%` hugs the number; 「万」 keeps one decimal
- Ellipsis is `…`; UI element names go in 「」; a space between number and unit (14 MB); 「点」, not 「点击」
