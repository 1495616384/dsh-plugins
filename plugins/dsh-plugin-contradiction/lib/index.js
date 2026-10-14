// 矛盾论分析台（宿主常驻版）
// 来源：动态插件 maodun-1（pkg-5，已全链路验证）转换而来。
// 零依赖手写 ToolDefinition（register() 契约：output { schema, render } + execute），
// 注册进宿主 tools 注册表的全局层 —— 所有会话、所有 preset 可见。
// 档案：工作区根 contradiction-workbench.json（与动态版同一文件，无缝续用）。
// 第五个工具 contradiction_summary：按"社会实践是检验真理的唯一标准"对档案库做
// 本质性归纳总结——区分已回验（实践检验过）与待验，归纳治本/治标、触及所有制与否
// 与质变的相关性，给出证伪归因分布与跨案例本质结论（可写 Markdown 报告）。

const STORE_FILE = 'contradiction-workbench.json'

const CHECKLIST = [
  '质变检验：针对假设的主要矛盾行动后，若未发生全局性、根本性的质变，则要么抓错了矛盾，要么手段治标不治本',
  '所有制检验：检查候选矛盾是否触及所有制、分配权与权力结构——未触及的大概率是次要矛盾',
  '主次方面检验：确认行动指向矛盾的主要方面而非次要方面',
  '转化检验：主要矛盾随发展阶段转化，旧矛盾解决后新矛盾上升为主，勿因暂时无变化而误判行动无用',
  '实操三步：看全局（哪个矛盾带动其余）→ 看趋势（谁在上升谁在下降）→ 看实践（行动后的质变是终极标准）'
]

function str(v) { return v === undefined || v === null ? '' : String(v) }

function requireText(v, field) {
  if (typeof v !== 'string' || v.trim().length === 0) throw new Error('矛盾论分析台：缺少必填字段 ' + field)
  return v
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

async function researchWeb(ctx, query, exec) {
  const shell = ctx.get('shell')
  if (shell === undefined) return { research: [], error: 'shell 服务不可用，无法联网补料' }
  try {
    const enc = encodeQuery(query)
    const cmd = "(Invoke-WebRequest -Uri 'https://www.baidu.com/s?wd=" + enc + "' -UseBasicParsing -TimeoutSec 20 -Headers @{ 'User-Agent' = '" + BAIDU_UA + "' }).Content"
    const res = await runShell(ctx, shell, cmd, exec)
    if (res.error) return { research: [], error: res.error }
    const research = parseBaidu(res.stdout, 5)
    if (research.length === 0) return { research: [], error: '未获取到联网结果' }
    return { research: research, error: '' }
  } catch (e) {
    return { research: [], error: String(e && e.message ? e.message : e) }
  }
}

function normalizeStore(parsed) {
  const store = parsed && typeof parsed === 'object' && Array.isArray(parsed.cases) && Array.isArray(parsed.audits)
    ? parsed
    : { cases: [], audits: [] }
  for (const c of store.cases) {
    if (!Array.isArray(c.verifications)) c.verifications = []
    if (!Array.isArray(c.research)) c.research = []
  }
  return store
}

function nextId(prefix, list) {
  const taken = {}
  for (const item of list) taken[item.id] = true
  let n = list.length + 1
  while (taken[prefix + String(n).padStart(3, '0')]) n = n + 1
  return prefix + String(n).padStart(3, '0')
}

const name = 'contradiction-workbench'
const inject = ['tools', 'fs']

function apply(ctx) {
  const fs = ctx.get('fs')
  if (fs === undefined) {
    console.error('[contradiction-workbench] fs service unavailable; tools not registered')
    return
  }
  const sp = ctx.get('sandboxPolicy')
  const root = sp && sp.workspaceRoot ? String(sp.workspaceRoot) : undefined
  const resolveOpts = root ? { cwd: root } : undefined

  async function loadStore() {
    try {
      const target = await fs.resolve(STORE_FILE, resolveOpts)
      const text = await fs.readText(target)
      return normalizeStore(JSON.parse(text))
    } catch (e) {
      return { cases: [], audits: [] }
    }
  }

  async function saveStore(store) {
    const target = await fs.resolve(STORE_FILE, resolveOpts)
    await fs.writeText(target, JSON.stringify(store, null, 2))
  }

  const analyzeTool = {
    name: 'contradiction_analyze',
    description: '矛盾论分析台·建档：为一个对象（家族、国家、危机、组织、项目）建立主要矛盾分析档案。必须枚举多个候选矛盾并标注主次方面与是否触及所有制，填写所有制矩阵（名义占有者/实际分配者/暴力背书/毁灭权），并写下可回验的质变预言。可开启 research 联网补实时资料（免费百度搜索，无需 API key），资料存入档案。档案持久化到工作区，之后用 contradiction_verify 回填实践结果。',
    parameters: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: '分析对象，如“贾府衰落”“欧债危机”“某项目反复延期”' },
        background: { type: 'string', description: '一句话背景：当前阶段的客观条件与主要表象' },
        research: { type: 'boolean', description: '是否联网补实时资料（免费百度搜索，无需 key；分析时事、组织、项目时建议开启）' },
        research_query: { type: 'string', description: '联网搜索关键词（默认用 subject 作为关键词）' },
        candidates: {
          type: 'array',
          description: '候选矛盾清单（建议 3 个以上，主要矛盾应从比较中得出）',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '矛盾名称' },
              principal_side: { type: 'string', description: '主要方面（占支配地位的一方）' },
              secondary_side: { type: 'string', description: '次要方面（从属的一方）' },
              touches_ownership: { type: 'boolean', description: '该矛盾是否触及所有制/分配权/权力结构' }
            },
            additionalProperties: true
          }
        },
        hypothesized_principal: { type: 'string', description: '假设的主要矛盾（一句话）' },
        ownership_map: {
          type: 'object',
          description: '所有制矩阵：谁名义占有、谁实际分配、暴力背书是谁、毁灭权是否可行',
          properties: {
            nominal_owner: { type: 'string', description: '名义占有者' },
            real_distributor: { type: 'string', description: '实际掌握分配权者' },
            violence_backing: { type: 'string', description: '暴力/权力背书' },
            destroy_right: { type: 'string', description: '占有者能否以“毁灭”夺回分配权？为什么' }
          },
          additionalProperties: true
        },
        predicted_qualitative_change: { type: 'string', description: '质变预言：若假设正确且对该矛盾行动，预期发生什么全局性、根本性的变化（回验的唯一判据）' },
        strategies: {
          type: 'array',
          description: '战略选项清单',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '方案名称' },
              kind: { type: 'string', enum: ['治本', '治标'], description: '治本=触动所有制/分配权；治标=缓解症状' },
              touches_ownership: { type: 'boolean', description: '是否触及所有制' }
            },
            additionalProperties: true
          }
        }
      },
      required: ['subject', 'candidates', 'hypothesized_principal', 'predicted_qualitative_change'],
      additionalProperties: true
    },
    output: {
      schema: { description: '建档结果：案例编号、状态、检验清单与联网补料' },
      render(a, v) {
        if (v && v.ok) {
          const lines = ['[建档 ' + str(v.case_id) + '] ' + str(a && a.subject) + ' ｜ 假设主要矛盾：' + str(a && a.hypothesized_principal) + ' ｜ 状态：待实践回验']
          if (Array.isArray(v.research) && v.research.length > 0) {
            lines.push('【联网补料 ' + str(v.research.length) + ' 条】')
            for (const r of v.research) {
              lines.push('• ' + str(r.title))
              lines.push('  ' + str(r.url))
              if (r.snippet) lines.push('  ' + str(r.snippet))
            }
          }
          if (v.research_error) lines.push('（联网补料失败：' + str(v.research_error) + '）')
          return [{ type: 'text', text: lines.join('\n') }]
        }
        return [{ type: 'text', text: '[建档失败] ' + str(v && v.error) }]
      }
    },
    async execute(args, exec) {
      const subject = requireText(args && args.subject, 'subject')
      const hypo = requireText(args && args.hypothesized_principal, 'hypothesized_principal')
      const pred = requireText(args && args.predicted_qualitative_change, 'predicted_qualitative_change')
      const candidates = Array.isArray(args && args.candidates) ? args.candidates : []
      if (candidates.length === 0) throw new Error('矛盾论分析台：candidates 不能为空——主要矛盾必须从多个候选中“用全力找出”')
      let research = []
      let researchError = ''
      if ((args && args.research) === true) {
        const rq = args && typeof args.research_query === 'string' && args.research_query.trim().length > 0 ? args.research_query.trim() : subject
        const rr = await researchWeb(ctx, rq, exec)
        research = rr.research
        researchError = rr.error
      }
      const store = await loadStore()
      const caseId = nextId('C-', store.cases)
      const om = (args && args.ownership_map) || {}
      const record = {
        id: caseId,
        created_at: new Date().toISOString(),
        subject: subject,
        background: str(args && args.background),
        research: research,
        research_error: researchError,
        candidates: candidates.map(function (c) {
          return {
            name: str(c && c.name),
            principal_side: str(c && c.principal_side),
            secondary_side: str(c && c.secondary_side),
            touches_ownership: (c && c.touches_ownership) === true
          }
        }),
        hypothesized_principal: hypo,
        ownership_map: {
          nominal_owner: str(om.nominal_owner),
          real_distributor: str(om.real_distributor),
          violence_backing: str(om.violence_backing),
          destroy_right: str(om.destroy_right)
        },
        predicted_qualitative_change: pred,
        strategies: (Array.isArray(args && args.strategies) ? args.strategies : []).map(function (s) {
          return {
            name: str(s && s.name),
            kind: str(s && s.kind),
            touches_ownership: (s && s.touches_ownership) === true
          }
        }),
        status: 'open',
        verifications: []
      }
      store.cases.push(record)
      await saveStore(store)
      return {
        ok: true,
        case_id: caseId,
        status: 'open',
        store_path: STORE_FILE,
        checklist: CHECKLIST,
        research: research,
        research_error: researchError,
        warning: candidates.length < 3 ? '候选矛盾少于 3 个——主要矛盾应从多个候选的比较中得出，建议补齐后再行动' : '',
        reminder: '质变预言是回验的唯一判据：没有可证伪的预言，就没有可回验的档案。行动落地后用 contradiction_verify 回填结果。'
      }
    }
  }

  const verifyTool = {
    name: 'contradiction_verify',
    description: '矛盾论分析台·回验：对已建档案例记录实践结果——实际采用了什么方案、是否发生全局性根本性质变。返回自动判定：质变已发生→假设成立(confirmed)；未发生→给出三选一归因（抓错矛盾/治标不治本/矛盾已转化）。这是“解决后无根本变化即抓错矛盾”检验标准的落地，实践的终极标准由此闭环。',
    parameters: {
      type: 'object',
      properties: {
        case_id: { type: 'string', description: 'contradiction_analyze 返回的案例编号，如 C-001' },
        solution_applied: { type: 'string', description: '实际采用的方案（开的药）' },
        fundamental_change: { type: 'boolean', description: '是否发生了全局性、根本性的质变（建档时的预言是否兑现）' },
        notes: { type: 'string', description: '观察与归因：为什么变/为什么没变' }
      },
      required: ['case_id', 'solution_applied', 'fundamental_change'],
      additionalProperties: true
    },
    output: {
      schema: { description: '回验判定：案例状态与三选一归因' },
      render(a, v) {
        let text
        if (v && v.ok) {
          text = '[回验 ' + str(v.case_id) + '] 质变' + (v.status === 'confirmed' ? '已发生 → 假设成立' : '未发生 → 假设证伪/存疑') + '（第 ' + str(v.verifications) + ' 次回验）'
        } else {
          text = '[回验失败] ' + str(v && v.error)
        }
        return [{ type: 'text', text: text }]
      }
    },
    async execute(args) {
      const caseId = requireText(args && args.case_id, 'case_id')
      const solution = requireText(args && args.solution_applied, 'solution_applied')
      const store = await loadStore()
      const record = store.cases.find(function (c) { return c.id === caseId })
      if (!record) {
        return { ok: false, error: '未找到案例 ' + caseId, available: store.cases.map(function (c) { return c.id }), store_path: STORE_FILE }
      }
      const entry = {
        at: new Date().toISOString(),
        solution_applied: solution,
        fundamental_change: (args && args.fundamental_change) === true,
        notes: str(args && args.notes)
      }
      record.verifications.push(entry)
      record.status = entry.fundamental_change ? 'confirmed' : 'refuted'
      await saveStore(store)
      let verdict
      if (entry.fundamental_change) {
        verdict = '实践验证：假设的主要矛盾成立——质变已发生。“捉住了这个主要矛盾，一切问题就迎刃而解了。”'
      } else {
        verdict = '回验警示：未发生根本性变化。三选一归因：(a) 抓错了矛盾——它只是次要矛盾；(b) 药太轻——“' + solution + '”是治标手段，未触及所有制/分配权/权力结构；(c) 主要矛盾已转化——旧矛盾之后新矛盾上升为主。必要时用 ownership_audit 检查分配权结构，或重新建档。'
      }
      return {
        ok: true,
        case_id: record.id,
        subject: record.subject,
        status: record.status,
        verdict: verdict,
        verifications: record.verifications.length,
        store_path: STORE_FILE
      }
    }
  }

  const auditTool = {
    name: 'ownership_audit',
    description: '矛盾论分析台·所有制审计：对任意实体（家族/国家/联盟/公司/平台）建立“名义占有 vs 实际支配”矩阵。每项资产标注名义占有者、实际分配者、暴力背书、毁灭权可行性，并统计错位项数。核心命题：分配权才是所有制的实质，名义所有若无分配权与暴力背书即名存实亡。',
    parameters: {
      type: 'object',
      properties: {
        entity: { type: 'string', description: '被审计实体' },
        holdings: {
          type: 'array',
          description: '资产清单，每项做“名义 vs 实际”对照',
          items: {
            type: 'object',
            properties: {
              asset: { type: 'string', description: '资产/生产资料' },
              nominal_owner: { type: 'string', description: '法律/名义上的所有者' },
              real_distributor: { type: 'string', description: '实际决定收益分配者' },
              violence_backing: { type: 'string', description: '背后的暴力/权力背书' },
              destroy_right: { type: 'string', description: '名义占有者能否以毁灭夺回分配权？' }
            },
            additionalProperties: true
          }
        },
        notes: { type: 'string', description: '结论或备注' }
      },
      required: ['entity', 'holdings'],
      additionalProperties: true
    },
    output: {
      schema: { description: '审计结果：资产矩阵与错位统计' },
      render(a, v) {
        let text
        if (v && v.ok) {
          text = '[审计 ' + str(v.audit_id) + '] ' + str(a && a.entity) + '：' + str(v.row_count) + ' 项资产 ｜ 名义占有与实际分配错位 ' + str(v.misaligned) + ' 项'
        } else {
          text = '[审计失败] ' + str(v && v.error)
        }
        return [{ type: 'text', text: text }]
      }
    },
    async execute(args) {
      const entity = requireText(args && args.entity, 'entity')
      const holdings = Array.isArray(args && args.holdings) ? args.holdings : []
      if (holdings.length === 0) throw new Error('矛盾论分析台：holdings 不能为空——至少列出一项资产做名义/实际对照')
      const store = await loadStore()
      const auditId = nextId('A-', store.audits)
      const rows = holdings.map(function (h) {
        return {
          asset: str(h && h.asset),
          nominal_owner: str(h && h.nominal_owner),
          real_distributor: str(h && h.real_distributor),
          violence_backing: str(h && h.violence_backing),
          destroy_right: str(h && h.destroy_right)
        }
      })
      let misaligned = 0
      for (const row of rows) {
        if (row.nominal_owner && row.real_distributor && row.nominal_owner !== row.real_distributor) misaligned = misaligned + 1
      }
      store.audits.push({
        id: auditId,
        created_at: new Date().toISOString(),
        entity: entity,
        holdings: rows,
        misaligned: misaligned,
        notes: str(args && args.notes)
      })
      await saveStore(store)
      return {
        ok: true,
        audit_id: auditId,
        entity: entity,
        row_count: rows.length,
        misaligned: misaligned,
        rows: rows,
        principle: '分配权才是所有制的实质：名义占有若无分配权与暴力背书即名存实亡；“毁灭权”面对更高层级的国家暴力工具无效。',
        store_path: STORE_FILE
      }
    }
  }

  const casesTool = {
    name: 'contradiction_cases',
    description: '矛盾论分析台·档案库：列出全部案例与审计及状态统计（confirmed 确认 / refuted 证伪 / open 待验），或按 case_id 读取单个案例完整档案。用于回顾哪些矛盾假设被实践证伪、避免重复犯错。',
    parameters: {
      type: 'object',
      properties: {
        case_id: { type: 'string', description: '要读取的案例编号（如 C-001）；省略则列出全部档案摘要与状态统计' }
      },
      additionalProperties: true
    },
    output: {
      schema: { description: '档案库列表或单个案例详情' },
      render(a, v) {
        let text
        if (v && v.ok && v.case) {
          text = '[档案 ' + str(v.case.id) + '] ' + str(v.case.subject) + ' ｜ 状态：' + str(v.case.status) + ' ｜ 回验 ' + str((v.case.verifications && v.case.verifications.length) || 0) + ' 次 ｜ 联网资料 ' + str((v.case.research && v.case.research.length) || 0) + ' 条'
        } else if (v && v.ok) {
          text = '[档案库] 共 ' + str(v.count) + ' 例：确认 ' + str(v.stats.confirmed) + ' / 证伪 ' + str(v.stats.refuted) + ' / 待验 ' + str(v.stats.open) + ' ｜ 审计 ' + str(v.audit_count) + ' 份'
        } else {
          text = '[查询失败] ' + str(v && v.error)
        }
        return [{ type: 'text', text: text }]
      }
    },
    async execute(args) {
      const store = await loadStore()
      if (args && typeof args.case_id === 'string' && args.case_id.trim().length > 0) {
        const record = store.cases.find(function (c) { return c.id === args.case_id })
        if (!record) {
          return { ok: false, error: '未找到案例 ' + args.case_id, available: store.cases.map(function (c) { return c.id }), store_path: STORE_FILE }
        }
        return { ok: true, case: record, store_path: STORE_FILE }
      }
      let confirmed = 0
      let refuted = 0
      let open = 0
      for (const c of store.cases) {
        if (c.status === 'confirmed') confirmed = confirmed + 1
        else if (c.status === 'refuted') refuted = refuted + 1
        else open = open + 1
      }
      return {
        ok: true,
        count: store.cases.length,
        stats: { confirmed: confirmed, refuted: refuted, open: open },
        cases: store.cases.map(function (c) {
          return {
            id: c.id,
            subject: c.subject,
            status: c.status,
            hypothesized_principal: c.hypothesized_principal,
            verifications: (Array.isArray(c.verifications) ? c.verifications : []).length,
            research: (Array.isArray(c.research) ? c.research : []).length,
            created_at: c.created_at
          }
        }),
        audit_count: store.audits.length,
        audits: store.audits.map(function (a) { return { id: a.id, entity: a.entity, holdings: a.holdings.length, misaligned: a.misaligned, created_at: a.created_at } }),
        store_path: STORE_FILE
      }
    }
  }

  const OWN_ZHIBEN_TERMS = ['所有制', '产权', '土改', '分家', '联邦化', '国有化', '拆分', '公共银行', '开源', '开放', '消灭地主', '集体所有', '分配权']
  const BIAO_TERMS = ['印子钱', '高利贷', '量化宽松', '降息', '救助', '补贴', '压缩', '蒸馏', '剪枝', '举债', '兜底', 'QE', '放水', '续命', '承包', '扩张范式内优化']

  function splitCore(name) {
    const out = []
    const parts = str(name).split(/[：:，,。、；;（）()\/\-\—\s]+/)
    for (const p of parts) {
      const t = p.trim()
      if (t.length >= 2) out.push(t)
    }
    return out
  }

  function classifySolution(record, text) {
    const t = str(text)
    // 显式标签优先：方案文本自己说了治本/治标、或明说未触及所有制、
    // 或治本路线"停留在论文/未上主流基准"（即并未真正落地为实践）。
    const explicitZhiBen = /治本/.test(t)
    const explicitZhiBiao = /治标/.test(t)
    const negatedOwnership = /未触及所有制|未触动财政所有制|未触动所有制|未敢触碰所有制/.test(t)
    const notAppliedZhiBen = /停留在学术|未在主流基准|未规模化落地|未形成新SOTA|未产生新SOTA/.test(t)
    if (explicitZhiBen || explicitZhiBiao || negatedOwnership || notAppliedZhiBen) {
      let kind = '未知'
      if (explicitZhiBen && explicitZhiBiao) kind = '混合'
      else if (explicitZhiBen) kind = '治本'
      else kind = '治标'
      const touches = explicitZhiBen && !negatedOwnership && !notAppliedZhiBen
      return { kind: kind, touches_ownership: touches, matched: '' }
    }
    const strategies = Array.isArray(record && record.strategies) ? record.strategies : []
    for (const s of strategies) {
      const cores = splitCore(s && s.name)
      for (const c of cores) {
        if (c.length >= 2 && t.indexOf(c) !== -1) {
          return {
            kind: str(s && s.kind) || '未知',
            touches_ownership: (s && s.touches_ownership) === true,
            matched: str(s && s.name)
          }
        }
      }
    }
    let zhiben = false
    let biao = false
    for (const k of OWN_ZHIBEN_TERMS) if (t.indexOf(k) !== -1) zhiben = true
    for (const k of BIAO_TERMS) if (t.indexOf(k) !== -1) biao = true
    if (zhiben && biao) return { kind: '混合', touches_ownership: true, matched: '' }
    if (zhiben) return { kind: '治本', touches_ownership: true, matched: '' }
    if (biao) return { kind: '治标', touches_ownership: false, matched: '' }
    return { kind: '未知', touches_ownership: false, matched: '' }
  }

  function classifyAttribution(notes) {
    const t = str(notes)
    if (/量变阶段|矛盾已转化|转化检验|保留待验/.test(t)) return '矛盾转化（量变阶段，待质变）'
    if (/药太轻|治标不治本/.test(t)) return '治标不治本（药太轻）'
    if (/剂量不足|被回撤/.test(t)) return '治本剂量不足/被回撤'
    if (/抓错矛盾/.test(t) && !/非抓错矛盾/.test(t)) return '抓错矛盾'
    return '未明确标注'
  }

  const summaryTool = {
    name: 'contradiction_summary',
    description: '矛盾论分析台·本质归纳总结：按照"社会实践是检验真理的唯一标准"，对档案库全部案例（或指定案例）做本质性归纳总结——区分已回验（实践检验过的假设）与待验（未经检验的假设），统计 confirmed/refuted/open，逐例回放"假设→实践方案→结果→归因"，归纳"治本/治标""是否触及所有制"与"是否质变"的相关性，输出跨案例的本质规律、证伪归因分布与待验清单，并给出一句话本质结论。可选把报告写入工作区 Markdown。',
    parameters: {
      type: 'object',
      properties: {
        case_id: { type: 'string', description: '只归纳单个案例（如 C-001）；省略则归纳全部档案' },
        write_report: { type: 'boolean', description: '是否把归纳报告写入工作区 Markdown 文件（默认 false，仅返回结构化文本）' }
      },
      additionalProperties: true
    },
    output: {
      schema: { description: '本质性归纳总结：统计、逐例判定、相关性、本质规律、结论' },
      render(a, v) {
        let text
        if (v && v.ok) {
          const lines = ['[本质归纳] ' + str(v.essence)]
          if (Array.isArray(v.inductions)) {
            for (const i of v.inductions) lines.push('• ' + str(i.title) + '：' + str(i.body))
          }
          if (v.report_path) lines.push('报告已写入：' + str(v.report_path))
          text = lines.join('\n')
        } else {
          text = '[归纳失败] ' + str(v && v.error)
        }
        return [{ type: 'text', text: text }]
      }
    },
    async execute(args) {
      const store = await loadStore()
      const want = args && typeof args.case_id === 'string' && args.case_id.trim().length > 0 ? args.case_id.trim() : ''
      const cases = want
        ? store.cases.filter(function (c) { return c.id === want })
        : store.cases
      if (want && cases.length === 0) {
        return { ok: false, error: '未找到案例 ' + want, available: store.cases.map(function (c) { return c.id }), store_path: STORE_FILE }
      }
      let confirmed = 0
      let refuted = 0
      let open = 0
      for (const c of cases) {
        if (c.status === 'confirmed') confirmed = confirmed + 1
        else if (c.status === 'refuted') refuted = refuted + 1
        else open = open + 1
      }
      const rows = []
      for (const c of cases) {
        const vlist = Array.isArray(c.verifications) ? c.verifications : []
        const last = vlist.length > 0 ? vlist[vlist.length - 1] : null
        let applied = ''
        let fundamental = null
        let attribution = ''
        let solKind = '未知'
        let solTouches = false
        let solMatched = ''
        if (last) {
          applied = str(last.solution_applied)
          fundamental = last.fundamental_change === true
          attribution = classifyAttribution(last.notes)
          const cls = classifySolution(c, applied)
          solKind = cls.kind
          solTouches = cls.touches_ownership
          solMatched = cls.matched
        }
        rows.push({
          case_id: c.id,
          subject: str(c.subject),
          status: str(c.status),
          hypothesis: str(c.hypothesized_principal),
          prediction: str(c.predicted_qualitative_change),
          applied: applied,
          fundamental_change: fundamental,
          attribution: attribution,
          solution_kind: solKind,
          touches_ownership: solTouches,
          matched_strategy: solMatched,
          verifications: vlist.length
        })
      }
      const byKind = { '治本': { changed: 0, unchanged: 0 }, '治标': { changed: 0, unchanged: 0 }, '混合': { changed: 0, unchanged: 0 }, '未知': { changed: 0, unchanged: 0 } }
      const byOwnership = { touched: { changed: 0, unchanged: 0 }, untouched: { changed: 0, unchanged: 0 } }
      for (const r of rows) {
        if (r.status === 'open' || r.fundamental_change === null) continue
        const kind = byKind[r.solution_kind] ? r.solution_kind : '未知'
        if (r.fundamental_change) byKind[kind].changed = byKind[kind].changed + 1
        else byKind[kind].unchanged = byKind[kind].unchanged + 1
        if (r.touches_ownership) {
          if (r.fundamental_change) byOwnership.touched.changed = byOwnership.touched.changed + 1
          else byOwnership.touched.unchanged = byOwnership.touched.unchanged + 1
        } else {
          if (r.fundamental_change) byOwnership.untouched.changed = byOwnership.untouched.changed + 1
          else byOwnership.untouched.unchanged = byOwnership.untouched.unchanged + 1
        }
      }
      const inductions = []
      const verified = confirmed + refuted
      inductions.push({
        title: '实践检验覆盖',
        body: '已回验 ' + verified + ' / ' + cases.length + ' 例（确认 ' + confirmed + '、证伪 ' + refuted + '），待验 ' + open + ' 例未进入真理判定——社会实践是检验真理的唯一标准，未经实践回验的假设不构成结论。'
      })
      if (verified > 0) {
        const t = byOwnership.touched
        const u = byOwnership.untouched
        let rule
        if (u.changed === 0 && t.changed > 0) {
          rule = '未触及所有制/分配权的方案 ' + (u.changed + u.unchanged) + ' 例无一质变；触及者 ' + t.changed + '/' + (t.changed + t.unchanged) + ' 例发生质变——实践检验支持"触动所有制/分配权是质变的必要条件"，且非充分（' + t.unchanged + ' 例触及而未质变，如治本被稀释/回撤）。'
        } else if (t.changed === 0 && u.changed === 0) {
          rule = '已回验样本中无一质变——所有制假设仍待实践检验。'
        } else if (u.changed > 0 && t.changed === 0) {
          rule = '未触及所有制的方案发生质变 ' + u.changed + ' 例——"所有制是唯一门槛"的假设被实践弱化，需重新检验主次方面。'
        } else {
          rule = '触及与未触及所有制均有质变案例——所有制不是唯一变量，质变条件需按案例细分。'
        }
        inductions.push({ title: '质变与所有制', body: rule })
        inductions.push({
          title: '治本 vs 治标',
          body: '治本方案：质变 ' + byKind['治本'].changed + ' / 未质变 ' + byKind['治本'].unchanged + '；治标方案：质变 ' + byKind['治标'].changed + ' / 未质变 ' + byKind['治标'].unchanged + '；混合方案：质变 ' + byKind['混合'].changed + ' / 未质变 ' + byKind['混合'].unchanged + '。'
        })
      }
      const attrCount = {}
      for (const r of rows) {
        if (r.status === 'refuted') attrCount[r.attribution] = (attrCount[r.attribution] || 0) + 1
      }
      const attrKeys = Object.keys(attrCount)
      inductions.push({
        title: '证伪归因分布',
        body: attrKeys.length > 0
          ? attrKeys.map(function (k) { return k + ' ' + attrCount[k] + ' 例' }).join('；')
          : '（无证伪案例或归因未标注）'
      })
      const pending = rows.filter(function (r) { return r.status === 'open' }).map(function (r) {
        return { case_id: r.case_id, subject: r.subject, prediction: r.prediction }
      })
      let essence
      if (cases.length === 0) {
        essence = '档案库为空——先使用 contradiction_analyze 建档，行动后回验，才能归纳。'
      } else if (verified === 0) {
        essence = '共 ' + cases.length + ' 例档案全部待验：假设已建档但未经实践检验，按"实践是检验真理的唯一标准"尚无真理可归纳；先行动并用 contradiction_verify 回验。'
      } else {
        const t = byOwnership.touched
        const u = byOwnership.untouched
        const ownRule = u.changed === 0 && t.changed > 0
          ? '未触及所有制者无一质变（0/' + (u.changed + u.unchanged) + '），触及者 ' + t.changed + '/' + (t.changed + t.unchanged) + ' 质变——触动所有制是质变的必要条件'
          : '所有制相关性未获一致支持'
        essence = '档案 ' + cases.length + ' 例（确认 ' + confirmed + ' / 证伪 ' + refuted + ' / 待验 ' + open + '）：实践检验 ' + verified + ' 例，本质规律为"' + ownRule + '"；证伪主因 ' + (attrKeys[0] || '无') + '；待验 ' + open + ' 例待行动回验。'
      }
      const result = {
        ok: true,
        mode: want ? 'single' : 'all',
        generated_at: new Date().toISOString(),
        stats: { total: cases.length, confirmed: confirmed, refuted: refuted, open: open, verified: verified, audits: store.audits.length },
        rows: rows,
        correlation: { by_kind: byKind, by_ownership: byOwnership },
        inductions: inductions,
        pending: pending,
        essence: essence,
        store_path: STORE_FILE
      }
      if (want) result.case_id = want
      if (args && args.write_report === true) {
        const md = renderReport(result, store)
        const target = await fs.resolve('矛盾论·社会实践检验归纳.md', resolveOpts)
        await fs.writeText(target, md)
        result.report_path = '矛盾论·社会实践检验归纳.md'
      }
      return result
    }
  }

  function renderReport(res, store) {
    const L = []
    L.push('# 矛盾论分析台 · 社会实践检验本质性归纳')
    L.push('')
    L.push('> 检验标准：社会实践是检验真理的唯一标准。以下结论仅来自已回验（实践检验过）的案例；待验案例仅列为假设。')
    L.push('> 生成时间：' + str(res.generated_at) + ' ｜ 档案：contradiction-workbench.json（' + str(store.cases.length) + ' 例案例、' + str(store.audits.length) + ' 份审计）')
    L.push('')
    L.push('## 一、统计')
    L.push('')
    L.push('- 案例总数：' + str(res.stats.total))
    L.push('- 已回验（实践检验过）：' + str(res.stats.verified) + '（确认 ' + str(res.stats.confirmed) + ' / 证伪 ' + str(res.stats.refuted) + '）')
    L.push('- 待验（未经实践检验）：' + str(res.stats.open))
    L.push('')
    L.push('## 二、逐例判定')
    L.push('')
    L.push('| 案例 | 对象 | 状态 | 实践方案 | 质变 | 归因 | 方案性质 | 触及所有制 |')
    L.push('|------|------|------|----------|------|------|----------|------------|')
    for (const r of res.rows) {
      L.push('| ' + str(r.case_id) + ' | ' + str(r.subject) + ' | ' + str(r.status) + ' | ' + str(r.applied) + ' | ' + (r.fundamental_change === null ? '—' : (r.fundamental_change ? '已发生' : '未发生')) + ' | ' + str(r.attribution) + ' | ' + str(r.solution_kind) + ' | ' + (r.touches_ownership ? '是' : '否') + ' |')
    }
    L.push('')
    L.push('## 三、本质规律（归纳）')
    L.push('')
    for (const i of res.inductions) {
      L.push('**' + str(i.title) + '**：' + str(i.body))
      L.push('')
    }
    L.push('## 四、待验清单（未经实践检验，仅为假设）')
    L.push('')
    if (res.pending.length > 0) {
      for (const p of res.pending) {
        L.push('- **' + str(p.case_id) + '** ' + str(p.subject) + '：质变预言——' + str(p.prediction))
      }
    } else {
      L.push('（无）')
    }
    L.push('')
    L.push('## 五、结论')
    L.push('')
    L.push(str(res.essence))
    L.push('')
    return L.join('\n')
  }

  ctx.tools.register(analyzeTool)
  ctx.tools.register(verifyTool)
  ctx.tools.register(auditTool)
  ctx.tools.register(casesTool)
  ctx.tools.register(summaryTool)
  console.log('[contradiction-workbench] 5 tools registered (host-resident); store: ' + STORE_FILE)
}

export { name, apply, inject }
