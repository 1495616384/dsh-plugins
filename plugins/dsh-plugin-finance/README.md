# @local/dsh-client-ui-finance — 财务插件

DeepSeek Harness Web GUI 的浏览器端插件：侧边栏底部新增「财务」按钮，打开一个含四个工具页的弹窗。纯客户端计算，不新增任何 host 服务或工具。

## 功能

| 标签页 | 功能 | 说明 |
|---|---|---|
| 比价 | 单价比较 | 任意多条「价格 × 数量 × 单位」记录，自动按单价排序，标出最划算（绿）与最贵（红），给出省钱百分比 |
| 折扣 | 实际折扣验证 | 原价 × 到手价 → 真实折扣（x 折 / 降 x% / 立省），可再填标称折扣判断促销是否名不副实 |
| 折扣 | 满减 vs 折扣 | 同一商品按「仅满减 / 仅折扣 / 先折后减 / 先减后折」四条路径算到手价，自动标出最省路径，支持一次性与每满即减 |
| 订阅 | 订阅 vs 按量 | 订阅费、标称额度、**抵扣系数**（第三方模型常按 5× 扣额度）、按量单价、预计用量 → 有效额度、盈亏平衡点、两种付费的月成本对比与超额警告 |
| 订阅 | 订阅审计 | 列出所有定期订阅与月使用次数，算每次使用成本与年成本，标出「本月未用」的退订候选 |
| 规划 | 定投复利 | 本金 + 月定投 + 年利率 + 期限 → 终值 / 累计投入 / 收益，附逐年资产表 |
| 规划 | 储蓄目标 | 目标金额 → 需要多少个月（复利公式反解） |
| 规划 | 预算分配 | 50/30/20（可调）三账户拆分 |
| 规划 | 贷款月供 | 等额本息 vs 等额本金：月供、总利息、利息差 |

比价记录与订阅清单持久化在浏览器 `localStorage`（键前缀 `dsh-finance:`），不上传。

## 结构

```
dsh-plugin-finance/
├── package.json      # dsh.client 声明（platform: web）+ exports["./client"]
└── lib/
    ├── index.js      # node 半区：no-op，仅为让 Loader 条目可解析
    └── client.js     # 浏览器 bundle：window.__ModuleLoader__.load({id, factory})
```

浏览器半区手写为懒 CJS 工厂形式（与 `@deepseek-ai/dsh-client-ui-goal` 等内置插件的产物同构），
无需构建步骤。`require` 只使用平台种子模块（`react`、`react/jsx-runtime`、
`@deepseek-ai/dsh-client-ui-primitives`），因此 `dsh.client` 无需声明 `inject`/`external`。

UI 挂载点：`sidebar.footer.action` 槽位（`ctx.slots.inject` → `ctx.slots.register`）；
文案走 `ctx.locale.register("finance", { zh, en })`；样式注入带 `data-plugin` 标记的
`<style>`，配色全部引用 shell 的 `--dsw-*` 变量以适配明暗主题。

## 安装（当前部署）

1. profile 依赖（`G:\ds-h\.dsh\profiles\web\package.json`）：
   `"@local/dsh-client-ui-finance": "file:../../../dsh-plugin-finance"`
2. profile patch（`G:\ds-h\.dsh\profiles\web\cordis.patch.yml`）插入：
   `- insert: [- id: ui-finance, name: '@local/dsh-client-ui-finance']`
3. `pnpm --dir G:\ds-h\.dsh\profiles\web install`（pnpm 将源码复制进 profile 的
   node_modules —— **改源码后需要重新执行一次 install**）
4. 重启 `dsh web`（组合树在启动时定型，新行必须重启才生效）。

## 验证

- 语法：`node --check lib/client.js`
- 冒烟：`node G:\ds-h\scripts\smoke-finance.mjs`
  （stub window/react/primitives，加载 factory，断言 exports、双语词典键集一致、
  槽位注册、CSS 注入、组件可实例化）
- 组合：`node <dsh>\lib\bin.js --profile web --dump-config` 应在
  profile patch 层看到 ui-finance 行。
