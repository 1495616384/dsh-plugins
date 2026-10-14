# @local/dsh-plugin-session-watch — 会话成本提醒

当当前会话的**累计 token 消耗**或**上下文占用比例**越过阈值时，在输入框上方（Composer Dock）出现一条提醒条，提示开新会话。

## 为什么需要它

Agent 模式下，一个会话跑久了，每次新轮次都要重读全部上下文，token 消耗呈**超线性增长**（你实测 ~110 万 token/会话时已经非常贵）。相同的工作量分到多个很短的会话里完成，总消耗比一个长会话低得多。

本插件无紫点、无常驻 UI、不会在低于阈值时显示任何东西——只在监控到"上下文已经太重"时出现，支持中英双语。

## 阈值

主维度是**每轮上下文成本 T**（`contextPressure.projectedTokens`：下一轮请求将重付的 prompt 侧 token 数 ≈ 当前上下文规模）。阈值按 **contextWindow 占比**取，跨窗口大小通用：

| 触发条件 | 提示色 |
|---|---|
| T ≥ 20% × contextWindow | 黄 |
| T ≥ 30% × contextWindow | 红 |
| 窗口未知时回退：T ≥ 15 万 | 黄 |
| 窗口未知时回退：T ≥ 30 万 | 红 |

条内 T 值附带占用百分比（如 `20.0万 (19%)`）。C（累计四项 token 之和）仅展示，不参与变色。`tokenUsage` 与 `contextPressure` 两个投影值均取自宿主提供的会话投影，实时更新。

> 为什么弃用绝对阈值：绝对值（150k/300k）只在 1M 窗口模型上凑效——在 128k 窗口模型上永远不会触发，在更大的窗口上又过松。占比阈值对任何模型一致。

## Credits 折算（真金白银）

成本条同时显示套餐 Credits 折算（`≈x cr`），按 2026-09-11 对 SCNet Token Plan（基础版 60,000 cr/月）的实测校准：

- **计费口径**：`billed = 未缓存输入 + 输出 + 缓存流量 / 10`（缓存命中按 1/10 价，DeepSeek 式规则）
- **汇率**：`1.14 credits / 千计费 token`（`CREDITS_PER_1K_BILLED` 常量）
- **实测**：当日 09:23–14:13 消耗 16,032.05 cr ↔ 会话日志实测 1,404 万计费 token；且 60,000 cr ↔ ~5,250 万计费 token 与「30 元跑 5000 万 token」的公开等价关系吻合
- **T 的折算**：下一轮重读未变上下文属缓存命中，`T × 1/10 × 1.14 ≈ 下轮 Credits`
- 汇率随套餐/模型定价变动，换套餐后改 `lib/client.js` 中的 `CREDITS_PER_1K_BILLED` 即可；实测工具：`node scripts/sum-usage-since.mjs`（统计任意截止时刻后的真实用量）

## 文献依据（选阈值的理由）

- **30% 红线**：Chroma《Context Rot: Evaluating LLM Performance Degradation with Increasing Input Tokens》(2025) 实测退化起点——上下文填充 ~28% 时长程任务准确率约 -6.3%，45% 时约 -10.8%，之后加速劣化。
- **20% 黄线**：在可测退化区之前预警；成本视角下每轮已重付窗口的 1/5。
- **质量退化的机理支撑**：Lost in the Middle（arXiv:2307.03172，中部信息检索显著变差）、RULER（arXiv:2404.06654，有效上下文远短于标称窗口）、NoLiMa（arXiv:2506.12731，少量无关噪声即可击穿长程召回）。
- **成本侧**：每轮重付全部上下文 ⇒ 累计消耗 ≈ O(n²)（README 首段）；缓解靠 prompt cache 定价（cache read 约为 uncached 的 1/10，见各家定价页）与尽早交接（Anthropic《Effective context engineering for AI agents》：上下文是注意力预算，交接/压缩优于无限累积）。
- 注：20%/30% 是把上述证据折算成的**工程阈值**，并非任何文献的原文数字。

## 结构

```
dsh-plugin-session-watch/
├── package.json     # main + exports["./client"] + dsh.client
└── lib/
    ├── index.js     # node 半区（no‑op）
    └── client.js    # 浏览器半区：Composer Dock 建议条
```

## 安装

1. profile 依赖 + patch 行
2. `pnpm --dir G:\ds-h\.dsh\profiles\web install`
3. 重启 `dsh web`

**坑**：pnpm file: 依赖是复制，改源码后必须重跑 `pnpm install`（或直接覆盖副本），否则加载的始终是旧副本。

**何时需要重启**：只改 `client.js`（浏览器半区）时**无需重启**——服务器按请求从磁盘读插件 bundle 且 `Cache-Control: no-cache`，覆盖副本后刷新页面即生效；改 `index.js`（宿主半区）或 `cordis.patch.yml`（组合树）才需要重启，组合树在启动时定型。

## 已知边界

- **只读型提示**：当前只是被动消息，没有"一键新建会话"的按钮——交互式控件需要新的兜侧 Remote，留给后续。
- **会话年龄未纳入**：理想情况下"跑了多久"也应参与提醒，但客户端无法可靠获得会话起始时间。实际代价已经由 token 累计与上下文占用充分表达。