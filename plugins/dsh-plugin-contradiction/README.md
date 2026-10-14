# @local/dsh-tool-contradiction — 矛盾论分析台

宿主常驻工具插件：把「主要矛盾 / 所有制 / 实践检验」这套分析流程固定成 5 个模型可见的工具，并把案例档案持久化到工作区，让**下一轮分析能读到上一轮被实践证伪的结论**。

零依赖手写 `ToolDefinition`（`output { schema, render }` + `execute`），注册进宿主 tools 注册表的全局层——所有会话、所有 preset 都看得见，不需要任何服务发布。

## 五个工具

| 工具 | 做什么 |
|---|---|
| `contradiction_analyze` | **建档**：为目标对象枚举 ≥3 个候选矛盾、标注主次方面与「是否触及所有制」，填所有制矩阵（名义占有者 / 实际分配者 / 暴力背书 / 毁灭权），并写下**可回验的质变预言**。可开 `research` 联网补实时资料 |
| `contradiction_verify` | **回验**：回填实践结果（用了什么方案、是否发生全局性根本性质变）→ 自动判定 `confirmed`（质变已发生）或 `refuted` 并给出三选一归因：抓错矛盾 / 治标不治本 / 矛盾已转化 |
| `ownership_audit` | **所有制审计**：对任意实体做「名义占有 vs 实际支配」矩阵，逐项标暴力背书与毁灭权可行性，统计错位项数 |
| `contradiction_cases` | **档案库**：列出全部案例与状态统计（confirmed / refuted / open），或按 `case_id` 读单个案例完整档案 |
| `contradiction_summary` | **本质归纳**：对档案库做跨案例归纳——逐例回放「假设 → 实践方案 → 结果 → 归因」，统计「治本/治标」「是否触及所有制」与「是否质变」的相关性，输出证伪归因分布与一句话本质结论，可选写入 Markdown 报告 |

## 方法论的硬核在一处

`contradiction_verify` 不是让你自己填「成功/失败」，而是把**「解决后无根本变化即抓错矛盾」**变成机器的判定：`fundamental_change: false` 会被强制要求归因到三种失败模式之一。档案因此不会积累一堆无法反驳的结论。

## 档案落盘

工作区根目录 `contradiction-workbench.json`。它刻意放在工作区而不是插件目录：档案是**研究资料**，要和被研究的那个项目待在一起，也方便直接进 git。

## 安装

```jsonc
// profiles/web/package.json
"@local/dsh-tool-contradiction": "file:../../../dsh-plugins/plugins/dsh-plugin-contradiction"
```

```yaml
# profiles/web/cordis.patch.yml
- insert:
    - id: tool-contradiction
      name: '@local/dsh-tool-contradiction'
```

host 工具插件没有浏览器半区，重启后会话里就能看到 `contradiction_*` 五个工具。

## 已知边界

- `research` 走的是本仓库的 `web_search_free` 同款免费端点（百度 HTML，无 key），**解析失败时不会伪造结果**，只会在档案里记下补料失败。
- 归纳总结的「相关性」是档案内的**样本内**统计，样本少时只是线索，不是结论。
