# @local/dsh-tool-websearch — 免费联网搜索

给模型两个**零 API key、零收费**的联网工具：搜索网页与抓取网页正文。

## 两个工具

| 工具 | 做什么 |
|---|---|
| `web_search_free` | 搜索网页。中文查询优先走**百度 HTML**（用 `mu` 属性提取真实 URL，避开百度跳转链），失败时回退 **Bing RSS**。返回结构化列表（标题 / 链接 / 摘要） |
| `web_fetch_free` | 抓取指定 URL 的正文：去 HTML 标签后可读文本，返回前若干字符 |

## 为什么值得存在

多数 harness 自带的联网工具要么需要 API key，要么按次计费。这里的取舍是：**用免费公共端点，接受它的不稳定**——所以后端是「百度 →  Bing RSS」两级回退，两级都失败时返回明确错误，**绝不伪造结果**。

## 实现要点

- **走宿主 shell 抓取**（`pwsh` + `Invoke-WebRequest`），不引入任何 HTTP 客户端依赖；`-UseBasicParsing` 保证在 Windows PowerShell 与 pwsh 下行为一致。
- **UA 伪装**：百度对默认 UA 返回精简页，插件带一个常见浏览器 UA（`BAIDU_UA`）以提高解析成功率。
- **URL 解码**：百度结果链接是 `www.baidu.com/link?url=...` 跳转链，插件从 HTML 的 `mu` 属性取真实目标地址，而不是把跳转链丢给模型。
- **参数有界**：`max_results` 上限在工具内强制，防止一次调用把上下文灌满。

## 平台限制（重要）

抓取依赖宿主 shell 的 `Invoke-WebRequest`，**当前实现面向 Windows / pwsh**。在 Linux/macOS 部署上需要把 shell 调用换成 `curl`（改动集中在两处命令字符串构造，逻辑与解析部分是平台无关的）。

## 安装

```jsonc
// profiles/web/package.json
"@local/dsh-tool-websearch": "file:../../../dsh-plugins/plugins/dsh-plugin-websearch"
```

```yaml
# profiles/web/cordis.patch.yml
- insert:
    - id: tool-websearch
      name: '@local/dsh-tool-websearch'
```

## 已知边界

- 免费端点没有 SLA：可能限流、可能改版。插件本身不做重试队列（重试会放大限流），失败就是失败，让模型自己决定要不要换个查询词。
- 只返回摘要片段，不做全文索引；需要全文用 `web_fetch_free` 逐个抓。
