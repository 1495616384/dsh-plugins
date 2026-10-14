// 免费联网搜索（宿主常驻版）
// 来源：动态插件 wbsr-2（pkg-4，已实测：百度后端中文结果质量最佳）转换而来。
// 零依赖手写 ToolDefinition；免费通道 = 本地 shell（PowerShell Invoke-WebRequest）
// → 百度 HTML 解析（mu 属性提取真实 URL），Bing RSS 兜底。全程零 API key、零收费。

function requireText(v, field) {
  if (typeof v !== 'string' || v.trim().length === 0) throw new Error('免费联网搜索：缺少必填参数 ' + field)
  return v.trim()
}

function encodeQuery(q) {
  return encodeURIComponent(q).replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

function htmlDecode(s) {
  if (!s) return ''
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, function (m, d) { return String.fromCharCode(parseInt(d, 10)) })
    .replace(/&#x([0-9a-fA-F]+);/g, function (m, h) { return String.fromCharCode(parseInt(h, 16)) })
}

function stripTags(s) { return s ? s.replace(/<[^>]*>/g, '') : '' }

function grab(s, open, close) {
  const m = s.match(new RegExp(open + '([^]*?)' + close))
  return m ? m[1] : ''
}

function cleanText(s) {
  return htmlDecode(stripTags(s)).split(/\s+/).join(' ').trim()
}

function parseBaidu(html, max) {
  const out = []
  const re = new RegExp('<div[^>]*class="[^"]*result[^"]*c-container[^"]*"[^>]*>', 'g')
  let m
  while ((m = re.exec(String(html))) !== null && out.length < max) {
    const seg = String(html).slice(m.index, m.index + 5000)
    const a = seg.match(new RegExp('<a[^>]*href="([^"]+)"[^>]*>([^]*)</a>'))
    if (!a || !a[2]) continue
    const title = cleanText(a[2])
    if (!title) continue
    const muM = seg.match(new RegExp('mu="([^"]+)"'))
    const mu = muM ? muM[1] : ''
    const url = mu.length > 0 ? mu : a[1]
    let snippet = ''
    const sr = seg.match(new RegExp('<span[^>]*class="[^"]*(content-right|abstract)[^"]*"[^>]*>([^]*)</span>'))
    if (sr) snippet = cleanText(sr[2])
    if (!snippet) {
      const cr = seg.match(new RegExp('<div[^>]*class="[^"]*c-abstract[^"]*"[^>]*>([^]*)</div>'))
      if (cr) snippet = cleanText(cr[1])
    }
    if (snippet.length > 160) snippet = snippet.slice(0, 160)
    out.push({ index: out.length + 1, title: title, url: url, snippet: snippet })
  }
  return out
}

function parseBingRss(xml, max) {
  const out = []
  const parts = String(xml).split('<item>')
  for (let i = 1; i < parts.length && out.length < max; i++) {
    const p = parts[i]
    const title = grab(p, '<title>', '</title>')
    const link = grab(p, '<link>', '</link>')
    const desc = grab(p, '<description>', '</description>')
    if (!link) continue
    out.push({
      index: out.length + 1,
      title: cleanText(title),
      url: htmlDecode(link).trim(),
      snippet: cleanText(desc)
    })
  }
  return out
}

function htmlToText(html) {
  let s = String(html)
  s = s.replace(new RegExp('<script[^>]*>([^]*)</script>', 'gi'), ' ')
  s = s.replace(new RegExp('<style[^>]*>([^]*)</style>', 'gi'), ' ')
  s = s.replace(/<[^>]+>/g, ' ')
  s = htmlDecode(s)
  s = s.split(/\s+/).join(' ').trim()
  return s
}

async function resolveSpec(ctx, shell, command, exec) {
  const base = { command: command, timeoutMs: 30000, stdoutMaxBytes: 500000 }
  if (exec && exec.signal) base.signal = exec.signal
  const sp = ctx.get('sandboxPolicy')
  let policy
  try {
    if (sp && exec && exec.agent) policy = sp.resolve({ session: exec.agent.session })
  } catch (e) { policy = undefined }
  if (policy !== undefined) base.sandboxPolicy = policy
  return shell.resolve(base)
}

async function runShell(ctx, shell, command, exec) {
  let outcome
  try {
    const spec = await resolveSpec(ctx, shell, command, exec)
    outcome = await shell.run(spec)
  } catch (e) {
    return { error: '命令执行失败: ' + String(e && e.message ? e.message : e) }
  }
  if (outcome.timedOut) return { error: '执行超时' }
  if (outcome.aborted) return { error: '已取消' }
  if (outcome.exitCode !== 0) {
    return { error: '命令退出码 ' + String(outcome.exitCode) + '：' + String(outcome.stderr && outcome.stderr.text ? outcome.stderr.text : '') }
  }
  return { stdout: outcome.stdout && outcome.stdout.text ? outcome.stdout.text : '' }
}

const BAIDU_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36'

const name = 'websearch-free'
const inject = ['tools', 'shell']

function apply(ctx) {
  const searchTool = {
    name: 'web_search_free',
    description: '免费联网搜索：通过免费公共端点搜索网页，无需任何 API key、零收费。中文查询优先走百度 HTML（免费无 key），失败时回退 Bing RSS。返回结构化结果列表（标题/链接/摘要）。当需要查证时事、找资料、补全对话里提到的概念时使用。',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词，支持中文' },
        max_results: { type: 'integer', description: '返回结果条数（1-10，默认 5）' }
      },
      required: ['query'],
      additionalProperties: true
    },
    output: {
      schema: { description: '搜索结果列表：标题/链接/摘要' },
      render(a, v) {
        if (v && v.ok) {
          const lines = ['[搜索] ' + String(a && a.query) + '（后端 ' + String(v.backend) + '，免费，共 ' + String(v.result_count) + ' 条）：']
          const results = Array.isArray(v.results) ? v.results : []
          for (const r of results) {
            lines.push(String(r.index) + '. ' + String(r.title || '无标题'))
            lines.push('   ' + String(r.url))
            if (r.snippet) lines.push('   ' + String(r.snippet))
          }
          return [{ type: 'text', text: lines.join('\n') }]
        }
        return [{ type: 'text', text: '[搜索失败] ' + String(v && v.error) }]
      }
    },
    async execute(args, exec) {
      const query = requireText(args && args.query, 'query')
      let max = 5
      if (args && typeof args.max_results === 'number') max = Math.max(1, Math.min(10, Math.floor(args.max_results)))
      const shell = ctx.get('shell')
      if (shell === undefined) return { ok: false, error: 'shell 服务不可用——无法执行免费搜索', backend: 'none' }
      const enc = encodeQuery(query)
      const baiduCmd = "(Invoke-WebRequest -Uri 'https://www.baidu.com/s?wd=" + enc + "' -UseBasicParsing -TimeoutSec 20 -Headers @{ 'User-Agent' = '" + BAIDU_UA + "' }).Content"
      const baidu = await runShell(ctx, shell, baiduCmd, exec)
      if (!baidu.error) {
        const results = parseBaidu(baidu.stdout, max)
        if (results.length > 0) return { ok: true, backend: 'baidu-html', query: query, result_count: results.length, results: results }
      }
      const bingCmd = "(Invoke-WebRequest -Uri 'https://www.bing.com/search?q=" + enc + "&format=rss' -UseBasicParsing -TimeoutSec 20 -Headers @{ 'User-Agent' = 'Mozilla/5.0' }).Content"
      const bing = await runShell(ctx, shell, bingCmd, exec)
      if (!bing.error) {
        const results = parseBingRss(bing.stdout, max)
        if (results.length > 0) return { ok: true, backend: 'bing-rss', query: query, result_count: results.length, results: results }
      }
      return { ok: false, error: '免费搜索后端均失败：百度 ' + String(baidu.error || '无结果') + '；Bing ' + String(bing.error || '无结果'), backend: 'none' }
    }
  }

  const fetchTool = {
    name: 'web_fetch_free',
    description: '免费抓取网页：用本地 shell 抓取指定 URL 的正文文本（去除 HTML 标签，免费无 key）。返回前若干字符供阅读。配合 web_search_free 使用，用于读搜索结果里的具体页面。',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '要抓取的完整 URL（http/https）' },
        max_chars: { type: 'integer', description: '返回的最大字符数（500-20000，默认 4000）' }
      },
      required: ['url'],
      additionalProperties: true
    },
    output: {
      schema: { description: '网页正文文本' },
      render(a, v) {
        if (v && v.ok) {
          const text = '[抓取 ' + String(a && a.url) + '（' + String(v.content_length) + ' 字' + (v.truncated ? '，已截断' : '') + '）]\n' + String(v.content)
          return [{ type: 'text', text: text }]
        }
        return [{ type: 'text', text: '[抓取失败] ' + String(v && v.error) }]
      }
    },
    async execute(args, exec) {
      const rawUrl = requireText(args && args.url, 'url')
      const maxChars = args && typeof args.max_chars === 'number' ? Math.max(500, Math.min(20000, Math.floor(args.max_chars))) : 4000
      if (rawUrl.length > 2048 || !/^https?:\/\/[^\s'"]+$/i.test(rawUrl)) {
        return { ok: false, error: 'URL 无效或含非法字符（仅允许 http/https，不含空白与引号）', backend: 'none' }
      }
      const shell = ctx.get('shell')
      if (shell === undefined) return { ok: false, error: 'shell 服务不可用——无法抓取', backend: 'none' }
      const command = "try { (Invoke-WebRequest -Uri '" + rawUrl + "' -UseBasicParsing -TimeoutSec 25 -Headers @{ 'User-Agent' = 'Mozilla/5.0' } -SkipHttpErrorCheck).Content } catch { 'FETCH_ERROR: ' + $_.Exception.Message }"
      const res = await runShell(ctx, shell, command, exec)
      if (res.error) return { ok: false, error: res.error, backend: 'shell-http' }
      const html = res.stdout
      if (html.indexOf('FETCH_ERROR:') === 0) return { ok: false, error: html.slice(12), backend: 'shell-http' }
      const text = htmlToText(html)
      const truncated = text.length > maxChars
      return { ok: true, backend: 'shell-http', url: rawUrl, content_length: text.length, content: truncated ? text.slice(0, maxChars) : text, truncated: truncated }
    }
  }

  ctx.tools.register(searchTool)
  ctx.tools.register(fetchTool)
  console.log('[websearch-free] 2 tools registered (host-resident, no API key)')
}

export { name, apply, inject }
