# dsh-plugins

DeepSeek Harness（DSH）的自建插件集合。每个插件都是**独立可直接引用的 npm 包**：`lib/*.js` 就是产物，没有构建步骤，profile 用 `file:` 依赖挂上即可。

## 插件一览

| 目录 | 包名 | 面 | 一条命令 / 一个工具 | 作用 |
|---|---|---|---|---|
| [`plugins/dsh-plugin-handoff`](plugins/dsh-plugin-handoff) | `@local/dsh-plugin-handoff` | 双面（host + client） | `/handoff` | 把长会话的**任务**交接到全新会话：模型写九段结构化简报、脱敏、挂回原工作区、浏览器自动切换；上下文越阈值时自动提醒 |
| [`plugins/dsh-plugin-mode-switch`](plugins/dsh-plugin-mode-switch) | `@local/dsh-plugin-mode-switch` | 双面 | `/mode` | **开聊之后**切换 Agent 模式（preset）：按最后一个完整轮次切分历史，用目标模式组合出新会话 |
| [`plugins/dsh-plugin-session-watch`](plugins/dsh-plugin-session-watch) | `@local/dsh-plugin-session-watch` | 浏览器 | （无命令，自动） | 累计 token / 上下文占用越阈值时，在输入框上方提示开新会话 |
| [`plugins/dsh-plugin-finance`](plugins/dsh-plugin-finance) | `@local/dsh-client-ui-finance` | 浏览器 | （侧边栏按钮） | 比价 / 折扣验证 / 满减对比 / 订阅 vs 按量，纯客户端计算 |
| [`plugins/dsh-plugin-contradiction`](plugins/dsh-plugin-contradiction) | `@local/dsh-tool-contradiction` | host（工具） | `contradiction_*` × 5 | 矛盾论分析台：主要矛盾建档、实践回验判定、所有制审计、案例库、本质归纳 |
| [`plugins/dsh-plugin-websearch`](plugins/dsh-plugin-websearch) | `@local/dsh-tool-websearch` | host（工具） | `web_search_free`、`web_fetch_free` | 免费联网搜索与正文抓取，**零 API key、零收费**（百度 HTML 为主、Bing RSS 兜底） |

## 三个共同的设计取舍

1. **零构建、零依赖**：`lib/*.js` 直出 ESM，不引第三方运行时依赖（`@deepseek-ai/dsh-llm` 之类只在需要时惰性 `import`），所以源码在没装依赖的 checkout 里也能直接被验证脚本加载。
2. **可选服务一律惰性读取**：`llm` / `workspaceRegistry` / `tokenMeter` / `agentPresets` 都用 `ctx.get()` 按需取，**不在 `apply()` 里快照**。这不是风格问题——Loader 并发装配同层条目，`dsh-workspace` 还要先完成一次性历史引导才发布服务，`apply()` 时刻取到的 `undefined` 不代表命令执行时取不到。
3. **降级不报错**：缺摘要模型 → 确定性兜底简报；缺 tokenMeter → 关掉自动提醒；缺工作区注册表 → 交接照做，只是新会话落在未分组。

## 安装（把任意一个挂到 DSH profile）

以 `dsh-plugin-handoff` 为例，假设本仓库克隆在 `G:\ds-h\dsh-plugins`，profile 在 `G:\ds-h\.dsh\profiles\web`：

```jsonc
// profiles/web/package.json
{
  "dependencies": {
    "@local/dsh-plugin-handoff": "file:../../../dsh-plugins/plugins/dsh-plugin-handoff"
  }
}
```

```yaml
# profiles/web/cordis.patch.yml —— 组装行；host 面与 client 面由同一个包声明，patch 里只写一次
- insert:
    - id: handoff
      name: '@local/dsh-plugin-handoff'
```

```powershell
pnpm --dir G:\ds-h\.dsh\profiles\web install
# 组合树在启动时定型，必须重启 dsh web
```

**必须知道的坑**：pnpm 的 `file:` 依赖是**复制**而不是软链接，而且它会按自己的记录判断"是否需要重新复制"——改了插件源码后如果只跑 `pnpm install`，很可能看到 `Already up to date` 而**什么都没更新**。可靠的刷新方式是先删再装：

```powershell
Remove-Item -Recurse -Force G:\ds-h\.dsh\profiles\web\node_modules\@local\dsh-plugin-handoff
pnpm --dir G:\ds-h\.dsh\profiles\web install
```

启动日志里每个插件都会打印自己的一行（例如 `[handoff] /handoff registered (...)`）。**没有那行就是没激活**，先查 patch 行与依赖安装，别去猜别的。

## 验证

`handoff` 与 `mode-switch` 自带端到端验证脚本（stub cordis context 驱动 host 半区 + 真实加载 client 半区，不需要起 Web）：

```powershell
node scripts/verify-handoff.mjs     # 95 项断言
```

## 兼容性

在 `@deepseek-ai/dsh 0.1.0-rc.7`（web profile）上开发与验证。插件只使用 shipped 的公开契约（commands / agents / sessionQuery / workspaceRegistry / tokenMeter / `agent/pre-step` / `session/event` / `command/executed` / `sessions.open`），没有改动 harness 源码。

## 许可

MIT（见 [LICENSE](LICENSE)）。
