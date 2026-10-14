/**
 * Threshold-driven half of the handoff plugin: context pressure → a reminder the
 * agent sees at its next step, so a long session hands its own task off.
 *
 * What this half deliberately does NOT do is migrate behind the user's back: the
 * reminder tells the agent to tell the *user*, who keeps the decision. Unattended
 * session migration is a different product (it needs a spend policy, a loop
 * guard, and a way to say no), and `dsh-auto-handoff`'s own design keeps a human
 * in that loop too.
 *
 * Background: an earlier revision of this plugin claimed this DSH line has no
 * `agent/pre-step` and no `session/event`, so automatic handoff was impossible.
 * That claim was wrong — `dsh-agent-loop` dispatches `agent/pre-step` as a
 * waterfall and `dsh-session` emits `session/event`; `dsh-compaction-basic`
 * already rides both. This module is the correction, and it composes with
 * compaction rather than fighting it:
 *
 * - compaction saves the *session* (it shadows old surface nodes so the request
 *   fits the window);
 * - handoff saves the *task* (it moves the task into a clean session and leaves
 *   the long log behind).
 *
 * Both read the same number — `ctx.tokenMeter.measure(session).totalTokens` —
 * so a deployment that already trusts one threshold trusts the other.
 *
 * @module @local/dsh-plugin-handoff/lib/auto
 */

/** Default ratios; override through the row `config` in the profile patch. */
export const AUTO_DEFAULTS = {
	/**
	 * `"off"` — no automatic behaviour.
	 * `"notify"` — at the threshold, tell the agent to hand its own task off.
	 *
	 * The user-facing "consider a new session" reminder is deliberately NOT this
	 * plugin's job: `dsh-plugin-session-watch` already renders that composer-dock
	 * hint, and two reminders firing on the same number is noise. This half is the
	 * part only a handoff plugin can do — put the *task* somewhere clean.
	 */
	mode: "notify",
	/** Occupancy ratio at which the agent is told to hand off. */
	thresholdRatio: 0.85,
	/** Denominator used when the session log carries no context window of its own. */
	contextWindowHint: 200000
};

/** Marker that keeps a reminder recognisable inside the transcript. */
export const REMINDER_MARKER = "[成本提醒]";

/** Normalize the auto-trigger config against {@link AUTO_DEFAULTS}. */
export function resolveAutoConfig(config) {
	const resolved = { ...AUTO_DEFAULTS, ...(config ?? {}) };
	if (!["off", "notify"].includes(resolved.mode)) resolved.mode = AUTO_DEFAULTS.mode;
	for (const key of ["thresholdRatio"]) {
		const value = resolved[key];
		if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) resolved[key] = AUTO_DEFAULTS[key];
	}
	if (!Number.isFinite(resolved.contextWindowHint) || resolved.contextWindowHint <= 0) resolved.contextWindowHint = AUTO_DEFAULTS.contextWindowHint;
	return resolved;
}

/**
 * The denominator: how many prompt tokens this model's window holds.
 *
 * Read from the session's own durable request header (`session.requestHeader()`,
 * the same accessor `dsh-compaction-basic` uses to find `config.model`), then
 * from the row config. The log's `request/context` events are also consulted,
 * but only as a last resort: the field is written by the model layer and is not
 * guaranteed to exist.
 * @param session - the session whose window is wanted.
 * @param header - the durable request header, when the session exposes one.
 * @param fallback - configured hint, used when nothing else answers.
 * @returns a positive token capacity.
 */
export function resolveContextWindow(session, header, fallback) {
	const candidates = [header?.config?.contextWindow, session?.header?.contextWindow];
	const events = Array.isArray(session?.events) ? session.events : [];
	for (let index = events.length - 1; index >= 0; index--) {
		const event = events[index];
		if (event?.type !== "request/context") continue;
		candidates.push(event.data?.contextWindow);
		break;
	}
	candidates.push(fallback);
	for (const candidate of candidates) if (typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0) return candidate;
	return AUTO_DEFAULTS.contextWindowHint;
}

/**
 * Current context pressure for one session.
 *
 * Deliberately dependency-tolerant: every service is read through `ctx.get`, so
 * a deployment without a token meter degrades to `undefined` (no reminder)
 * instead of failing to load the plugin.
 * @param ctx - host context.
 * @param session - the session to measure.
 * @param config - resolved auto config.
 * @returns `{ tokens, window, ratio, level }`, or undefined when unmeasurable.
 */
export function measurePressure(ctx, session, config) {
	if (session === undefined || session === null) return undefined;
	let tokens;
	try {
		const meter = ctx.get?.("tokenMeter");
		if (meter?.measure !== undefined) tokens = meter.measure(session)?.totalTokens;
	} catch {
		tokens = undefined;
	}
	if (!Number.isFinite(tokens)) return undefined;
	let header;
	try {
		header = session.requestHeader?.();
	} catch {
		header = undefined;
	}
	const window = resolveContextWindow(session, header, config.contextWindowHint);
	const ratio = window > 0 ? tokens / window : 0;
	const level = ratio >= config.thresholdRatio ? "over" : "ok";
	return { tokens, window, ratio, level };
}

/** Rank levels so a session is notified at most once per threshold crossing. */
const LEVEL_RANK = { ok: 0, over: 1 };

/**
 * Build the reminder the model will see at its next step.
 *
 * It is framed as a plugin-source user message so the model treats it as an
 * out-of-band notice rather than as the user's instruction, and it names the
 * exact command, because a model merely told "context is long" cannot act on it.
 * @param pressure - the measurement that tripped the threshold.
 * @param mode - resolved auto mode, which decides how firm the wording is.
 * @returns plain reminder text.
 */
export function reminderText(pressure, mode) {
	const percent = `${String(Math.round(pressure.ratio * 100))}%`;
	const numbers = `约 ${String(pressure.tokens)} / ${String(pressure.window)} tokens（${percent}）`;
	const action =
		"请先向用户用两三句话说明本任务的目标、当前进度与下一步，然后提示用户输入 /handoff 交接任务；" +
		"不要中断当前任务，也不要擅自新建会话。交接后原会话保持不变。";
	return mode === "notify"
		? `${REMINDER_MARKER} 当前会话上下文已占用 ${numbers}，已达交接阈值。${action}`
		: `${REMINDER_MARKER} 当前会话上下文已占用 ${numbers}。上下文越长，回答质量越容易下降、成本越高。${action}`;
}

/**
 * Build the plugin-source user message carriers accept.
 *
 * `createUserMessage` lives in `@deepseek-ai/dsh-llm`, which is only reachable
 * inside an installed harness — the verification script runs from the checkout,
 * where it is absent, so the import is lazy and its absence degrades to a
 * hand-built message instead of breaking the plugin.
 * @param text - reminder body.
 * @returns one user-role message with a plugin source.
 */
async function reminderMessage(text) {
	try {
		const { createUserMessage } = await import("@deepseek-ai/dsh-llm");
		return createUserMessage({ content: [{ type: "text", text }], source: { kind: "plugin" } });
	} catch {
		return {
			id: `msg-${globalThis.crypto?.randomUUID?.() ?? String(Date.now())}`,
			role: "user",
			content: [{ type: "text", text }],
			source: { kind: "plugin" }
		};
	}
}

/**
 * Register the threshold-driven half.
 *
 * One hook: `agent/pre-step` is the only place a plugin can add a message to the
 * next request, so it carries the reminder. It fires at most once per session,
 * because a reminder that repeats every step is noise the model learns to skip.
 *
 * `agent/pre-step` is a waterfall: this handler MUST call `next()`. Returning a
 * hand-built decision would drop every other pre-step contribution — compaction
 * pressure, plan mode, skills, session references. The reminder is therefore
 * appended to whatever `next()` decided, never composed from scratch.
 * @param ctx - host context carrying tokenMeter (optional) and event hooks.
 * @param config - resolved auto config.
 * @returns the trigger handle, or undefined when the mode is `"off"`.
 */
export function registerAutoTrigger(ctx, config) {
	if (config.mode === "off") return undefined;
	if (typeof ctx.on !== "function") {
		// A context that cannot carry event hooks (a thin host, or a fixture) loses
		// the reminder but must never lose the plugin.
		console.warn("[handoff] auto: 当前宿主没有事件 hook（ctx.on 不可用），自动提醒已关闭；/handoff 命令不受影响。");
		return undefined;
	}

	/** session-id → this session has already been told to hand off. */
	const notified = new Set();

	ctx.on("agent/pre-step", async ({ agent, signal }, next) => {
		const decision = await next();
		try {
			if (signal?.aborted === true) return decision;
			if (decision?.kind !== "enter") return decision;
			const session = agent?.session;
			const sessionId = session?.id;
			if (sessionId === undefined || notified.has(sessionId)) return decision;
			const pressure = measurePressure(ctx, session, config);
			if (pressure === undefined || pressure.level !== "over") return decision;
			notified.add(sessionId);
			const message = await reminderMessage(reminderText(pressure, config.mode));
			console.log(`[handoff] auto: 已向 ${sessionId} 注入交接提醒（${String(Math.round(pressure.ratio * 100))}%，约 ${String(pressure.tokens)} tokens）`);
			return { kind: "enter", messages: [...decision.messages, message] };
		} catch (error) {
			// A reminder is an optimization; it may never break a turn.
			console.error("[handoff] auto reminder failed; continuing the step:", error);
			return decision;
		}
	});

	return {
		/** Read-only view for verification and for the registration log line. */
		state: () => ({ notified: new Set(notified) }),
		/** Test/ops seam: forget one session so its reminder can fire again. */
		reset: (sessionId) => notified.delete(sessionId)
	};
}
