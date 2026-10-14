/**
 * Pure helpers for `/handoff`: transcript rendering, secret redaction, the brief
 * prompt, and the deterministic fallback brief.
 *
 * Everything here is side-effect free so the verification script can exercise it
 * without a live harness.
 */

/** Hard cap on the transcript we are willing to send to the summarizer. */
export const TRANSCRIPT_MAX_CHARS = 120_000;

/** Assistant text kept per turn (the last text block only, reasoning excluded). */
const ASSISTANT_TEXT_MAX = 1_200;

/** User text kept per message. */
const USER_TEXT_MAX = 1_500;

/**
 * Redaction rules. Ordered; each entry replaces the match. Kept deliberately
 * narrow so ordinary code and prose survive intact.
 */
const REDACTIONS = [
	[/\b(sk|pk|rk)-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED_KEY]"],
	[/\bgh[pousr]_[A-Za-z0-9]{16,}\b/g, "[REDACTED_KEY]"],
	[/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, "[REDACTED_KEY]"],
	[/\bAKIA[0-9A-Z]{16}\b/g, "[REDACTED_KEY]"],
	[/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "[REDACTED_JWT]"],
	[/\b(api[_-]?key|apikey|secret|token|passwd|password|passphrase)\b(\s*[:=]\s*)["']?[^\s"',;]{6,}["']?/gi, "$1$2[REDACTED]"],
	[/\bAuthorization\s*:\s*Bearer\s+\S+/gi, "Authorization: Bearer [REDACTED]"],
	[/\bCookie\s*:\s*\S+/gi, "Cookie: [REDACTED]"],
	// 64+ hex only: a 40-character SHA-1 is exactly a git commit id, and a handoff
	// that redacts commit ids destroys the most useful anchors it could carry.
	[/\b[A-Fa-f0-9]{64,}\b/g, "[REDACTED_HEX]"],
	[/\b[A-Za-z0-9+/]{60,}={0,2}\b/g, "[REDACTED_BLOB]"]
];

/**
 * Strip credentials from text before it reaches a model or a new session.
 * @param text - candidate text.
 * @returns the same text with secrets replaced by placeholders.
 */
export function redact(text) {
	let out = String(text ?? "");
	for (const [pattern, replacement] of REDACTIONS) out = out.replace(pattern, replacement);
	return out;
}

/** Collect the plain text of one message's text-bearing blocks. */
function textOf(blocks) {
	if (!Array.isArray(blocks)) return "";
	return blocks
		.filter((block) => block !== null && typeof block === "object" && block.type === "text" && typeof block.text === "string")
		.map((block) => block.text)
		.join("")
		.trim();
}

/**
 * Render a session log into a compact transcript for the summarizer.
 *
 * Keeps every user message (they carry intent and are the first thing a summary
 * loses), keeps only the last assistant text block per turn, and replaces tool
 * traffic with one-line markers. Reasoning is never included: it is private and
 * would leak into the new session.
 * @param events - the raw, seq-ordered session log.
 * @returns the transcript, or an empty string when the log carries no dialogue.
 */
export function renderTranscript(events) {
	const lines = [];
	let lastAssistantTurn;
	for (const event of events ?? []) {
		// A turn boundary resets the "which line is this turn's assistant reply"
		// tracker; without it every turn but the last would be overwritten.
		if (event?.type === "turn/start") {
			lastAssistantTurn = undefined;
			continue;
		}
		if (event?.type === "user/message") {
			const text = textOf(event.data?.content ?? event.data?.message?.content);
			if (text !== "") lines.push(`[USER] ${text.slice(0, USER_TEXT_MAX)}`);
			continue;
		}
		if (event?.type === "assistant/message") {
			const text = textOf(event.data?.message?.content);
			// One line per turn: overwrite the previous assistant line of this turn.
			if (text !== "") {
				const line = `[ASSISTANT] ${text.slice(0, ASSISTANT_TEXT_MAX)}`;
				if (lastAssistantTurn !== undefined && lines[lastAssistantTurn]?.startsWith("[ASSISTANT]")) lines[lastAssistantTurn] = line;
				else lines.push(line);
				lastAssistantTurn = lines.length - 1;
			}
			continue;
		}
		if (event?.type === "tool/call") {
			const tool = event.data?.name ?? event.data?.toolName ?? "tool";
			lines.push(`[TOOL] ${String(tool)}`);
		}
	}
	let text = lines.join("\n");
	if (text.length > TRANSCRIPT_MAX_CHARS) text = `${text.slice(0, TRANSCRIPT_MAX_CHARS)}\n[... 更早的记录已截断 ...]`;
	return text;
}

/**
 * The nine sections, in order. Section names double as the fixed headings of
 * the brief; a missing section is written as `（无）` rather than dropped, so the
 * next session can tell "nothing here" from "the brief forgot".
 */
export const BRIEF_SECTIONS = [
	"总体目标",
	"约束与偏好",
	"关键决策与理由",
	"已完成",
	"当前进度",
	"已改文件",
	"已知问题",
	"未完成",
	"下一步"
];

/**
 * Build the one-shot summarization prompt.
 *
 * Shape follows the compaction prompts of Claude Code / Cline / OpenHands: a
 * no-tools preamble (a denied tool call would consume the only turn), a fixed
 * section list that must not be trimmed, and an explicit ban on paraphrasing
 * identifiers. `goal` tailors what gets extracted, which is the whole point of
 * a handoff over a plain compaction.
 * @param goal - what the next session will be used for; empty for a generic handoff.
 * @param transcript - rendered transcript.
 * @returns the prompt text.
 */
export function buildBriefPrompt(goal, transcript) {
	const goalLine = goal === "" ? "（未指定：为「继续当前工作」做通用交接）" : goal;
	return [
		"CRITICAL: Respond with TEXT ONLY. Do NOT call any tools.",
		"- You already have all the context you need in the conversation above.",
		"- Tool calls will be REJECTED and will waste your only turn.",
		"- Your entire response must be plain text: an <analysis> block followed by a <brief> block.",
		"",
		"你在为一次会话交接撰写简报：新会话会拿到你的 <brief>，从零上下文接手这项工作。",
		`下一个会话的用途：${goalLine}`,
		"按这个用途决定抽取什么：只保留服务于它的信息，其余可以省略。",
		"",
		"先在 <analysis> 里按时间顺序梳理：用户的显式请求、采取的做法、关键决策及其理由、",
		"技术概念、涉及文件的确切路径、错误与修复、用户的纠正（原话引用）、任务演化的过程。",
		"",
		"然后输出 <brief>，必须且只能包含以下九节，标题逐字照抄，顺序不变；",
		"某一节没有内容就写「（无）」，绝不删节：",
		"",
		...BRIEF_SECTIONS.map((title, index) => `## ${String(index + 1)}. ${title}`),
		"",
		"规则：",
		"- 用简练的中文工程语言，条目式，不要散文段落。",
		"- 保留确切的文件路径、命令、错误串、标识符、数值、函数签名与语法片段。",
		"- 不要转述代码：点名它，让新会话自己去读。",
		"- 用户的原话与风格约束（例如禁用 emoji）必须原样引用，不要改写。",
		"- 「关键决策与理由」要写清为什么选 A 而不选 B——这是摘要最容易丢的东西。",
		"- 不要提及本次交接请求，也不要提到上下文被压缩过。",
		"- 只输出 <analysis> 与 <brief>，不要有任何其他内容。"
	].join("\n");
}

/** Extract the `<brief>` block from a model response, dropping the analysis. */
export function extractBrief(raw) {
	const text = String(raw ?? "");
	const match = /<brief>([\s\S]*?)<\/brief>/i.exec(text);
	if (match !== null) return match[1].trim();
	// Tolerate a response that omitted the wrapper but kept the headings.
	if (text.includes("## 1.")) return text.replace(/<analysis>[\s\S]*?<\/analysis>/i, "").trim();
	return "";
}

/** Drop an analysis block and collapse blank runs, mirroring the compaction formatter. */
export function stripAnalysis(raw) {
	return String(raw ?? "")
		.replace(/<analysis>[\s\S]*?<\/analysis>/gi, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

/**
 * Deterministic fallback brief, used when no summarizer is available or the
 * model response carries no usable brief. Never returns an empty document: a
 * thin handoff beats a failed one.
 * @param events - the session log.
 * @param reason - why the fallback ran, recorded in the document header.
 * @returns a brief in the same nine-section shape.
 */
export function fallbackBrief(events, reason) {
	const users = (events ?? []).filter((event) => event?.type === "user/message");
	const assistants = (events ?? []).filter((event) => event?.type === "assistant/message");
	const tools = (events ?? []).filter((event) => event?.type === "tool/call");
	const turns = new Set((events ?? []).filter((event) => event?.type === "turn/end" || event?.type === "turn/start").map((event) => event.data?.turn).filter(Boolean));
	const firstUser = textOf(users[0]?.data?.content ?? users[0]?.data?.message?.content).slice(0, 600);
	const lastUser = textOf(users[users.length - 1]?.data?.content ?? users[users.length - 1]?.data?.message?.content).slice(0, 800);
	const lastAssistant = textOf(assistants[assistants.length - 1]?.data?.message?.content).slice(0, 800);
	const section = (title, body) => `## ${title}\n${body === "" ? "（无）" : body}`;
	return [
		`> 自动兜底简报（${reason}）：未能调用摘要模型生成结构化九段，以下为确定性抽取。`,
		"",
		`节 1 目标语：${firstUser === "" ? "（无）" : firstUser}`,
		"",
		`## 1. 总体目标\n${firstUser === "" ? "（无）" : firstUser}`,
		"",
		section("2. 约束与偏好", ""),
		section("3. 关键决策与理由", "（无法自动重建：需要模型参与，请人工补充）"),
		section("4. 已完成", `本会话共 ${String(turns.size)} 轮，${String(users.length)} 次用户输入，${String(assistants.length)} 次模型回答，${String(tools.length)} 次工具调用。`),
		section("5. 当前进度", lastUser === "" ? "" : `最近一次用户输入：${lastUser}`),
		section("6. 已改文件", "（无法自动重建：请查看工作区 git status）"),
		section("7. 已知问题", ""),
		section("8. 未完成", ""),
		section("9. 下一步", lastAssistant === "" ? "" : `模型最后回答的结尾：${lastAssistant.slice(-400)}`)
	].join("\n");
}

/** Render the document handed to the new session. */
export function renderHandoffDocument({ brief, sessionId, cwd, createdAt, goal, source }) {
	const lines = [
		"# 会话交接简报",
		"",
		`- 来源会话：${sessionId}`,
		`- 生成时间：${createdAt}`,
		...(cwd === undefined || cwd === "" ? [] : [`- 工作目录：${cwd}`]),
		...(goal === undefined || goal === "" ? [] : [`- 下一个会话的用途：${goal}`]),
		`- 生成方式：${source}`,
		"",
		"> 这是一份交接简报，不是对话。直接接着做，不要复述本简报，不要问「要我继续吗」。",
		"",
		brief.trim()
	];
	return lines.join("\n");
}

/**
 * Rename a session title, mirroring what the arriving session should be called.
 * Purely cosmetic; failure must never fail the handoff.
 * @param title - raw title.
 * @returns a bounded single-line title.
 */
export function handoffTitle(title) {
	const clean = String(title ?? "").replace(/\s+/g, " ").trim();
	return clean === "" ? "交接会话" : `交接 · ${clean}`.slice(0, 60);
}
