# @local/dsh-plugin-handoff — 会话交接

把一条长会话的任务**结构化交接**给同工作区里的全新会话：上下文归零，但决策与理由、约束与偏好、未完成项与下一步被写进一份固定九段的简报，随新会话一起启动。

## 为什么不是 `/compact`

`/compact` 保留同一个会话，且丢失方向很确定：**决策及其理由、早期会话级指令、风格约束、较早的代码片段**先没，而当前任务与最近的报错留着（Claude Code 的实测结论）。交接则把这几类高危信息固化进文档，然后开一份干净的上下文。

两者互补，不是替代：`/compact` 省 token，`/handoff` 换轨道。

## 用法

```text
/handoff                        把当前任务交接到全新会话
/handoff 实现 phase one         同上，并告诉摘要模型「下一个会话要做什么」
```

命令不进模型可见历史。原会话保持不变，可随时返回。

返回结果会逐项报告继承情况，例如：

```
已把任务交接到全新会话，上下文归零（用途：实现 phase one）
简报：会话自身模型生成，9/9 节，3120 字符（已脱敏）
继承：preset: 已继承 kk；cwd: 已继承；model: 已继承（子会话沿用源会话的 provider/model，等同于部署默认）；工作区归属: 已继承
原会话保持不变，可随时返回继续。
（新会话 session-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）
```

最后一行是给浏览器半区解析的标记（同时也能人读）；浏览器半区先 `refresh()` 再 `open()`，否则新会话会因 `blank` 被侧边栏分组隐藏，表现为「交接了但看不到」。

## 简报的九段

| # | 段 | 为什么在这一段 |
|---|---|---|
| 1 | 总体目标 | 防止交接后偏离原始意图 |
| 2 | 约束与偏好 | 风格约束（如「禁用 emoji」）是摘要最常丢的一类 |
| 3 | 关键决策与理由 | 「为什么选 A 不选 B」是摘要最常丢的另一类 |
| 4 | 已完成 | 区分已完成与待办 |
| 5 | 当前进度 | 交接发生前正在做什么 |
| 6 | 已改文件 | 精确路径，便于新会话回读 |
| 7 | 已知问题 | 避免重复踩坑 |
| 8 | 未完成 | 被明确要求但未完成的 |
| 9 | 下一步 | 单一动作 |

空段写「（无）」，**绝不删段**——让新会话能区分「这里确实没有」和「简报漏了」。

## 实现要点

- **摘要用会话自己的模型**：一次性 `ctx.llm.stream()` 调用，无工具（三明治式 no-tools 前后文，因为一次被拒的工具调用会吃掉唯一的回合）。`purpose` 不传：本 DSH 线是封闭联合 `'compaction' | 'session-title'`，没有 `handoff`。
- **脱敏**在写盘前做：sk-/ghp_/xox/AKIA/JWT、`Bearer`、`Cookie`、`api_key/password/token` 赋值、长 base64 块。**40 位十六进制不脱敏**——那正好是 git commit id，交接里最该保留的锚点。
- **同名命令唯一所有者**：`/handoff` 原先由 `@local/dsh-plugin-mode-switch` 提供（计数式摘要）。该副本已移除，`/mode` 不受影响，两个插件的验证脚本都覆盖了这一点。
- **只在成功的路径上写**：会话创建失败即报错返回，不产生半成品会话；失败后闩锁释放，可直接重试。
- **单会话单动作**：同一会话并发调用只有一次生效。
- **可选服务惰性读取**：`llm` / `workspaceRegistry` / `agentPresets` 一律 `ctx.get` 按需取，不在 `apply()` 里快照。这不是风格问题：Loader **并发**装配同层条目，而 `dsh-workspace` 要先完成一次性历史引导才发布服务，所以 `apply()` 那一刻取到的 `undefined` 并不代表命令执行时也取不到——只有惰性读取才能既拿到晚发布的实例，又不把健康部署误报成缺服务。缺 `llm` 时降级为确定性兜底简报而不是失败。
- **工作区服务名是 `workspaceRegistry`**（`WorkspaceRegistry extends Service`，见 `@deepseek-ai/dsh-workspace` 的 `declare module '@deepseek-ai/cordis'`）。写成 `workspace` 会静默拿到 `undefined`，表现为「交接成功但侧边栏看不见新会话」——这个 bug 是首次重启后由启动日志里那行 `workspaceRegistry(apply 时): absent` 暴露出来的。

## 自动（阈值）触发

上下文占用越过阈值时，插件在 `agent/pre-step` 里给**模型**追加一条提醒消息（来源标成 `plugin`），让模型自己提示用户 `/handoff`。默认阈值 **85%**。

```yaml
- insert:
    - id: handoff
      name: '@local/dsh-plugin-handoff'
      config:
        auto:
          mode: notify        # off | notify
          thresholdRatio: 0.85
          contextWindowHint: 200000   # 会话日志里读不到窗口时用这个分母
```

- **测量口径与 compaction 一致**：`ctx.tokenMeter.measure(session).totalTokens`，即 `dsh-compaction-basic` 定价用的同一个数。两套阈值因此可以互相解释。
- **只提醒，不擅自迁移**：无人值守地新建会话需要支出策略、循环闩与「拒绝」通道，那是另一个产品；`dsh-auto-handoff` 也把人类留在环里。
- **每会话只提醒一次**：反复提醒等于噪音，模型会学会忽略。`trigger.reset(sessionId)` 是运维/测试用的重新武装开关。
- **用户侧的成本条不由本插件负责**：`dsh-plugin-session-watch` 已经渲染那条 composer dock 提示，两个提醒打同一个数只会互相稀释。
- **降级**：没有 `tokenMeter`（无分母）→ 不提醒；宿主没有 `ctx.on` → 关闭自动提醒并打日志，`/handoff` 命令不受影响。

### 一段历史：那个「本版本没有 agent/pre-step」的说法是错的

本插件早先导出了 `AUTO_TRIGGER_AVAILABLE = false`，理由写的是「`agent/pre-step` 与 `session/event` 属 0.1.5+，本版本没有」。这是**没有核实就写下的猜测**，而且是错的：

```
dsh-agent-loop/lib/index.js:501      this.dispatch.waterfall("agent/pre-step", {...})
dsh-compaction-basic/lib/index.js:780 ctx.on("agent/pre-step", ...)
dsh-plan-mode/lib/index.js:125        ctx.on("agent/pre-step", ...)
dsh-token-meter/lib/index.js:424      ctx.on("session/event", ...)
```

两个钩子都在，`0.1.5+` 只存在于猜测里。教训写进文档而不是悄悄改掉：**「本版本不支持」必须用 grep 证明，不能用印象断言**。

## 已知边界

- **权限预设与 Plan 模式不继承**。两者挂在各 preset 的 `isolate` realm 内，宿主平面的 `ctx.get` 取不到；本版本没有 `agentPresets.serviceFor` 这类按 agent 解析的入口。`/mode` 与 Plan 状态需要在新会话里重新设置。
- **不删原会话日志**：日志只追加，交接是「另开一份」，不是原地改造。
- **简体中文硬编码**：简报标题与提示词为中文。
- **`/handoff` 在接近满窗时跑摘要会更慢**：摘要用的是会话自己的模型，输入是整份 transcript。窗口越满，这一跳越贵——但这正是要交接的时刻，降级路径（确定性兜底简报）仍然可用。

## 构建与接入

无构建步骤：`lib/*.js` 为直出产物，改完必须重装（pnpm 的 `file:` 依赖是**复制**，不是链接）。

```powershell
# 1) profile 依赖：profiles/web/package.json 里加
#    "@local/dsh-plugin-handoff": "file:../../../dsh-plugin-handoff"
# 2) profile 装配行：profiles/web/cordis.patch.yml 里加
#    - insert:
#        - id: handoff
#          name: '@local/dsh-plugin-handoff'
# 3) 重装（pnpm 需要 git 在 PATH 上，因为 profile 有 github: 依赖）
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
pnpm --dir G:\ds-h\.dsh\profiles\web install --no-frozen-lockfile
# 4) 重启 dsh web（组合树在启动时定型）
```

启动时应看到：

```
[handoff] /handoff registered (summarize: on; auto: notify @ 85%（agent/pre-step + tokenMeter）; llm(apply 时): present; workspaceRegistry(apply 时): absent（晚发布属正常）)
```

**没有这行就说明插件没激活**，不必再猜。括号里的 `(apply 时)` 是刻意标注的：它采样的只是模块装配那一刻的服务可见性，`dsh-workspace` 晚发布属正常，不代表交接时取不到。命令执行时是否真的拿到服务，看结果里那行「工作区归属」——「已继承」才是证据。

**改完源码必须强制重装**：pnpm 对 `file:` 依赖按源码目录的记录做增量判断，源码改了但它认为「已经最新」时会**跳过复制**（`Already up to date`），于是部署里跑的还是旧副本。删掉目标目录再装是唯一可靠的刷新方式：

```powershell
Remove-Item -Recurse -Force G:\ds-h\.dsh\profiles\web\node_modules\@local\dsh-plugin-handoff
pnpm --dir G:\ds-h\.dsh\profiles\web install
```

## 验证

```powershell
node G:\ds-h\scripts\verify-handoff.mjs
```

覆盖：脱敏规则（含「commit id 不被脱敏」）、transcript 渲染（保留全部用户消息、每轮只留最后一条助手文本、排除 reasoning、多轮不互相覆盖）、提示词九段、`<brief>` 解析、兜底简报、命令全路径（成功/竞争/空日志/创建失败/工作区三种降级）、自动触发（阈值内不注入、越阈值注入一条 plugin 消息且原 waterfall 消息保留、同会话不重复、跨会话独立、`reset` 重新武装、`mode: off` 不注册钩子、无 tokenMeter 与 abort 时不注入）、客户端往返与 `refresh → open` 顺序。

**未覆盖**：真实的摘要模型调用（需要活体 harness 与可达的 provider）。脚本只证明提示词与解析逻辑，以及「没有摘要器时降级而非失败」。
