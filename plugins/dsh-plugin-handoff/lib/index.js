import { randomUUID } from "node:crypto";
import { BRIEF_SECTIONS, buildBriefPrompt, extractBrief, fallbackBrief, redact, renderHandoffDocument, renderTranscript, stripAnalysis } from "./brief.js";
import { resolveAutoConfig, registerAutoTrigger } from "./auto.js";

/**
 * `@deepseek-ai/dsh-llm` is imported lazily inside {@link summarize} rather than
 * at module scope. It is an optional capability here — a deployment without a
 * summarizer falls back to the deterministic brief — and a module-scope import
 * would make `lib/index.js` unloadable outside an installed profile (the
 * checkout has no `node_modules`, which is where the verification script runs).
 */

/**
 * Host half of the session-handoff plugin: `/handoff` — move a long session's
 * task into a fresh session that carries a structured brief instead of the
 * whole transcript.
 *
 * Why this exists on top of the shipped `/compact`: compaction keeps the same
 * session and is lossy in a specific, predictable direction — decisions with
 * their reasons, early session-level instructions, style constraints and older
 * code snippets all tend to disappear, while the task and recent errors survive.
 * A handoff writes those at-risk items into a fixed nine-section document and
 * starts clean context beside them.
 *
 * Design points borrowed from the strongest community implementation
 * (`qingyou002/dsh-auto-handoff`), restricted to APIs this DSH line actually has:
 *
 * 1. the brief is model-written against a fixed, never-trimmed section list;
 * 2. it is redacted before it is written anywhere;
 * 3. the successor is attached to the source workspace, because a session the
 *    sidebar hides is indistinguishable from a failed handoff;
 * 4. inheritance is reported item by item ("已继承 / 回退 / 未继承（原因）") rather
 *    than silently guessed;
 * 5. every optional service is read lazily through `ctx.get`, because the Loader
 *    assembles same-layer rows concurrently and an `inject`ed row stays PENDING
 *    until its dependencies exist.
 */
export const name = "handoff";

/**
 * Injected services are only the ones whose absence makes the plugin
 * meaningless. `llm`, `workspace` and `agentPresets` are resolved per use, so a
 * thinner deployment degrades (falls back to a deterministic brief) instead of
 * failing to mount.
 */
export const inject = ["commands", "agents", "sessionQuery"];

/** Marker the browser half parses to open the new session (also readable by a human). */
const CHILD_MARKER = "（新会话 ";

/** Defaults; override through the row's `config` in the profile patch. */
const DEFAULTS = {
	/** Summarize with the session's own model; `false` forces the deterministic brief. */
	summarize: true,
	/** Provider generation cap for the one-shot summarization call. */
	summaryMaxTokens: 4096
};

/**
 * Automatic (threshold-driven) handoff IS available on this DSH line.
 *
 * This constant used to be `false`, with a comment claiming the line has no
 * `agent/pre-step` and no `session/event`. That was a guess, and it was wrong:
 * `dsh-agent-loop` dispatches `agent/pre-step` as a waterfall and `dsh-session`
 * emits `session/event`, which is exactly how `dsh-compaction-basic` and
 * `dsh-plan-mode` are wired. The measurement seam is `ctx.tokenMeter`, the same
 * one compaction prices against. See {@link ./auto.js}.
 */
export const AUTO_TRIGGER_AVAILABLE = true;

/** Compose the marker the browser half looks for. */
function childMarker(sessionId) {
	return `${CHILD_MARKER}${sessionId}）`;
}

/** Normalize the row config. */
function resolveConfig(config) {
	return { ...DEFAULTS, ...(config ?? {}) };
}

/**
 * Read one session's log through `ctx.sessionQuery`.
 *
 * `readSession()` answers `{ session, events }` — the cloned header lives under
 * `session`, which differs from the shape its published type alias suggests, so
 * the assumption has exactly one home.
 * @param ctx - host context carrying sessionQuery.
 * @param sessionId - session to read.
 * @returns the header and the raw, seq-contiguous event log.
 */
async function readLog(ctx, sessionId) {
	const snapshot = await ctx.sessionQuery.readSession(sessionId);
	return {
		header: snapshot?.session ?? {},
		events: Array.isArray(snapshot?.events) ? snapshot.events : []
	};
}

/** Plain text of one message event's text blocks. */
function messageText(event) {
	const blocks = event?.data?.content ?? event?.data?.message?.content;
	if (!Array.isArray(blocks)) return "";
	return blocks
		.filter((block) => block !== null && typeof block === "object" && block.type === "text" && typeof block.text === "string")
		.map((block) => block.text)
		.join("")
		.trim();
}

/**
 * Ask the session's own model for the nine-section brief.
 *
 * `GenerateOptions.purpose` is a closed union in this DSH line
 * (`'compaction' | 'session-title'`), so none is passed: claiming a purpose the
 * adapter does not know would be a lie told to code that switches on it.
 * @returns the brief text, or undefined when summarization is impossible.
 */
async function summarize(ctx, { provider, model, transcript, maxTokens, signal }) {
	const llm = ctx.get("llm");
	if (llm === undefined || provider === undefined || model === undefined) return undefined;
	let BlockAssembler;
	let createUserMessage;
	try {
		({ BlockAssembler, createUserMessage } = await import("@deepseek-ai/dsh-llm"));
	} catch (error) {
		console.error("[handoff] @deepseek-ai/dsh-llm is unavailable; falling back to the deterministic brief:", error);
		return undefined;
	}
	const assembler = new BlockAssembler();
	const message = createUserMessage({
		content: [{ type: "text", text: `${buildBriefPrompt("", transcript)}\n\n===== 会话记录开始 =====\n${transcript}\n===== 会话记录结束 =====` }],
		source: { kind: "plugin" }
	});
	for await (const chunk of llm.stream({ provider, model, messages: [message], maxTokens, signal })) assembler.push(chunk);
	const raw = assembler
		.blocks()
		.filter((block) => block?.type === "text" && typeof block.text === "string")
		.map((block) => block.text)
		.join("");
	const brief = extractBrief(raw);
	if (brief !== "") return brief;
	const salvaged = stripAnalysis(raw);
	return salvaged.includes("## 1.") ? salvaged : undefined;
}

/**
 * Create the successor session for one handoff.
 *
 * The child is created with the source's cwd and then attached to that
 * workspace explicitly: `ctx.agents.create` does not register workspace
 * membership, and the browser groups sessions strictly by it. Attachment is
 * best-effort — a real child the user can reach matters more than a tidy report,
 * so an attach failure is reported and never fails the handoff.
 * @returns the child id, the document handed over, and the inheritance report.
 */
async function migrate(ctx, { sourceId, sourceHeader, brief, sourceLabel }) {
	const cwd = sourceHeader.cwd;
	const preset = sourceHeader.agentPreset;
	const childId = `session-${randomUUID()}`;
	const document = renderHandoffDocument({
		brief,
		sessionId: sourceId,
		cwd,
		createdAt: new Date().toISOString(),
		source: sourceLabel
	});
	const seedEvent = {
		type: "user/message",
		seq: 0,
		time: Date.now(),
		// `user/message` is surface-eligible, so the seed validator requires an
		// explicit append marker; appending is exactly what a fresh context means.
		surfaceOp: "append",
		data: {
			id: `msg-${randomUUID()}`,
			role: "user",
			content: [{ type: "text", text: document }],
			source: { kind: "user" }
		}
	};
	const presets = ctx.get("agentPresets");
	await ctx.agents.create({
		sessionId: childId,
		seed: [seedEvent],
		meta: {
			...(cwd === undefined ? {} : { cwd }),
			parentSession: sourceId,
			seedLength: 1,
			...(preset === undefined ? {} : { agentPreset: preset })
		},
		setup: async (agentCtx) => {
			if (presets !== undefined && preset !== undefined) await presets.mount(agentCtx, preset);
		}
	});

	const inherited = [
		`preset: ${preset === undefined ? "未继承（源会话未记录 preset，使用部署默认）" : `已继承 ${preset}`}`,
		`cwd: ${cwd === undefined ? "未继承（源会话无 cwd）" : "已继承"}`,
		"model: 已继承（子会话沿用源会话的 provider/model，等同于部署默认）"
	];

	const workspace = ctx.get("workspaceRegistry");
	if (cwd === undefined || workspace === undefined) {
		inherited.push(`工作区归属: 未继承（${workspace === undefined ? "本部署无 workspaceRegistry 服务" : "源会话无 cwd"}）`);
	} else {
		try {
			const target = await workspace.resolveByPath(cwd);
			if (target === undefined) inherited.push("工作区归属: 未继承（该目录未注册为工作区，新会话会出现在未分组）");
			else {
				await target.attachSession(childId);
				inherited.push("工作区归属: 已继承");
			}
		} catch (error) {
			inherited.push(`工作区归属: 未继承（${String(error)}）`);
		}
	}

	return { childId, document, inherited };
}

/**
 * Register `/handoff`.
 * @param ctx - host context carrying commands, agents, sessionQuery.
 * @param config - row config overrides (see DEFAULTS).
 */
export function apply(ctx, config) {
	const settings = resolveConfig(config);
	const auto = resolveAutoConfig(config?.auto);
	/** One in-flight handoff per session, so a double invocation cannot race. */
	const pending = new Set();
	/** Threshold-driven reminder (no-op when `config.auto.mode === "off"`). */
	const trigger = registerAutoTrigger(ctx, auto);

	/** Shared by the command today and any future trigger. */
	async function runHandoff({ agent, goal, signal }) {
		const sourceId = agent.session.id;
		const sourceHeader = agent.session.header ?? {};
		const { provider, model } = agent.options ?? {};
		const source = await readLog(ctx, sourceId);
		if (source.events.length === 0) return { ok: false, text: "当前没有可迁移的活动会话（会话日志为空），未创建任何新会话。" };

		const transcript = renderTranscript(source.events);
		let brief;
		let sourceLabel = "会话自身模型生成";
		if (settings.summarize !== false && transcript !== "") {
			try {
				brief = await summarize(ctx, { provider, model, transcript, maxTokens: settings.summaryMaxTokens, signal });
			} catch (error) {
				console.error("[handoff] summarization failed:", error);
				brief = undefined;
			}
		}
		if (brief === undefined || brief.trim() === "") {
			brief = fallbackBrief(source.events, transcript === "" ? "会话无对话内容" : "摘要模型不可用或未产出简报");
			sourceLabel = "确定性兜底抽取（未调用摘要模型）";
		}

		const { childId, document, inherited } = await migrate(ctx, {
			sourceId,
			sourceHeader,
			brief: redact(brief),
			sourceLabel
		});
		const sections = brief.split(/^## /m).length - 1;
		return {
			ok: true,
			childId,
			text: [
				`已把任务交接到全新会话，上下文归零${goal === "" ? "" : `（用途：${goal}）`}`,
				`简报：${sourceLabel}，${String(sections)}/${String(BRIEF_SECTIONS.length)} 节，${String(document.length)} 字符（已脱敏）`,
				`继承：${inherited.join("；")}`,
				"原会话保持不变，可随时返回继续。"
			].join("\n")
		};
	}

	ctx.effect(
		() =>
			ctx.commands.register({
				name: "handoff",
				description: "把当前任务交接到一个全新会话：/handoff [下一个会话的用途]",
				handler: async (invocation) => {
					const sessionId = invocation.agent.session.id;
					if (pending.has(sessionId)) return { kind: "error", text: "本会话已有一项交接正在进行，请稍候。" };
					pending.add(sessionId);
					try {
						const result = await runHandoff({ agent: invocation.agent, goal: invocation.rawInput.trim() });
						if (!result.ok) return { kind: "error", text: result.text };
						return { kind: "success", text: `${result.text}\n${childMarker(result.childId)}` };
					} catch (error) {
						return { kind: "error", text: `交接失败，原会话保持不变，未产生半成品会话：${String(error)}` };
					} finally {
						pending.delete(sessionId);
					}
				}
			}),
		"handoff: /handoff command"
	);

	console.log(
		`[handoff] /handoff registered (summarize: ${settings.summarize === false ? "off" : "on"}; ` +
			`auto: ${auto.mode === "off" ? "off" : `${auto.mode} @ ${String(Math.round(auto.thresholdRatio * 100))}%（agent/pre-step + tokenMeter）`}; ` +
			// Availability is sampled at apply() time ONLY. The Loader assembles
			// same-layer rows concurrently, and `dsh-workspace` finishes a one-time
			// history bootstrap before publishing, so `absent` here does not mean
			// the service is missing when the command runs: every optional service
			// is re-read lazily at that moment.
			`llm(apply 时): ${ctx.get("llm") === undefined ? "absent" : "present"}; workspaceRegistry(apply 时): ${ctx.get("workspaceRegistry") === undefined ? "absent（晚发布属正常）" : "present"})`
	);
	return { trigger };
}

/** Exported for the verification script. */
export { CHILD_MARKER, DEFAULTS, childMarker, messageText, migrate };
