# @local/dsh-plugin-mode-switch — 对话中切换模式

在**已经开聊之后**切换 Agent 模式（preset）。

## 为什么需要它

DSH 对"会话中换模式"有三道硬约束（都在 shipped 代码里，且各有其理由）：

| 约束 | 位置 | 行为 |
|---|---|---|
| `session.fork` 不接受 preset | `dsh-host-apiproxy` fork handler | 子会话**强制继承**父会话的组合（注释写明：种子历史由旧工具产出，换组合会让历史里的工具调用悬空） |
| 已产出会话禁止换 | `agentPreset.select` | 非空白会话返回 `agent-preset-locked` |
| 新 Remote 需构建产物 | `dsh-api-remotes` | 客户端 assembly 的 Remote 集合构建期固定，插件无法运行时新增浏览器可调方法 |

本插件不改 shipped 代码，而是提供等价通路：**按最后一个完整轮次切分当前历史 → 用目标模式组合出一个新会话 → 浏览器自动打开它**。原会话原样保留。

## 用法

```text
/mode            列出全部模式（* 标记当前模式）
/mode kk         把当前对话切到 kk 模式（历史带入，自动打开新会话）
```

切换后得到一个新会话：继承了原会话到最后一个完整轮次为止的全部历史、cwd、模型，但组合（persona / 技能 / 工具集）来自目标模式。原会话不变。

## 结构（单包双面，比照 `dsh-session-log-export`）

```text
dsh-plugin-mode-switch/
├── package.json     # main = node 半区；exports["./client"] + dsh.client = 浏览器半区
└── lib/
    ├── index.js     # node 半区：注册 /mode 命令（commands + agents + sessionQuery）
    └── client.js    # 浏览器半区：监听 command/executed，解析子会话 id 并 ctx.sessions.open()
```

**跨面通信**：命令结果是插件自有宿主动作回到浏览器唯一可用的通道，因此 node 半区在结果文本里写一个同时面向人和解析器的标记 `（新会话 session-xxx）`，浏览器半区解析它并导航。

## 已知边界

- **工具集差异**：历史里可能包含目标模式不提供的工具调用（例如从「标准」切到「极简模式」）。KK / 标准 / 创造 / 代码 四个模式工具集相同，互切无影响。
- **模型**：子会话沿用源会话的 provider/model；若不可得则用部署默认。
- **开放轮次**：切换点固定在最后一个 `turn/end`，正在进行的轮次不进入种子（由新会话重新开始）。
- **原会话不迁移**：切换是"带着历史开新会话"，不是原地改造；原会话可继续使用或归档。

## 安装（当前部署）

1. profile 依赖：`"@local/dsh-plugin-mode-switch": "file:../../../dsh-plugin-mode-switch"`
2. profile patch 插入行：`- id: mode-switch, name: '@local/dsh-plugin-mode-switch'`
3. `pnpm --dir G:\ds-h\.dsh\profiles\web install`
4. 重启 `dsh web`（组合树在启动时定型）

**坑（已踩过）**：pnpm 的 `file:` 依赖是**复制**而不是链接——改完源码必须重跑 `pnpm install`（必要时先删掉
`profiles\web\node_modules\@local\dsh-plugin-mode-switch`），否则加载的始终是旧副本，任何日志与改动都不会出现。
启动时控制台会打印 `[mode-switch] /mode command registered (...)`；**没有这行就说明插件没激活**，不必再猜。

## 验证

`node G:\ds-h\scripts\verify-mode-switch.mjs` — 校验命令半区的切分算法、标记往返、manifest 与包解析。
