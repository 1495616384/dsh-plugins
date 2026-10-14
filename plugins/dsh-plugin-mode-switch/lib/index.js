import { randomUUID } from "node:crypto";

/**
 * Host half of the mode-switch plugin: `/mode` — switch the Agent preset of an
 * in-progress conversation by composing a new session on the target preset.
 *
 * DSH deliberately refuses to recompose a session that has produced anything
 * (`agentPreset.select` answers `agent-preset-locked`) and `session.fork`
 * hard-codes the parent's preset, so "switch mode mid-conversation" has no
 * shipped path. The equivalent route is: cut the history at the last completed
 * turn, compose a new session on the target preset, and let the browser open it.
 * The source session is left untouched.
 *
 * `/handoff` used to live here as a stopgap; it now belongs to
 * `@local/dsh-plugin-handoff`, which writes a model-authored nine-section brief
 * instead of a count-based paragraph. Registering it in both places would put two
 * handlers on one command name.
 */
export const name = "mode-switch";
export const inject = ["commands", "agents", "sessionQuery"];

/** Marker the browser half parses to open the new session (also readable by a human). */
const CHILD_MARKER = /（新会话 (session-[0-9a-zA-Z-]+)）/;

/**
 * The seed cut: one past the last `turn/end`, extended through trailing
 * out-of-band appends up to the next `turn/start` so the child inherits the
 * title written right after the boundary turn and the seed stays balanced.
 * @param events - the source session's raw log, seq-contiguous from zero.
 * @returns the seed length, or undefined when no turn has completed.
 */
function seedCut(events) {
	const boundary = events.findLast((event) => event.type === "turn/end");
	if (boundary === undefined) return undefined;
	let cut = boundary.seq + 1;
	while (cut < events.length && events[cut]?.type !== "turn/start") cut++;
	return cut;
}

/**
 * Read one session's log through `ctx.sessionQuery`.
 *
 * `readSession()` answers `{ session, events }` — the cloned header lives under
 * `session` (verified in dsh-session-query's implementation, which differs from
 * the shape its published type alias suggests). The command reads it through
 * here so the shape assumption has exactly one home.
 * @param ctx - host context carrying sessionQuery.
 * @param sessionId - session to read.
 * @returns the header and raw event log.
 */
async function readLog(ctx, sessionId) {
	const snapshot = await ctx.sessionQuery.readSession(sessionId);
	return {
		header: snapshot?.session ?? {},
		events: Array.isArray(snapshot?.events) ? snapshot.events : []
	};
}

function presetLabel(preset) {
	return preset.name === undefined ? preset.id : `${preset.name}（${preset.id}）`;
}

/**
 * Register `/mode`.
 * @param ctx - host context carrying commands, agents, sessionQuery.
 */
export function apply(ctx) {
	ctx.effect(() => ctx.commands.register({
		name: "mode",
		description: "切换本对话的 Agent 模式：/mode <id> 切换，/mode 列出全部模式",
		handler: async (invocation) => {
			const presets = ctx.get("agentPresets");
			if (presets === undefined) {
				return { kind: "error", text: "本部署没有挂载 Agent 模式名册（agentPresets），无法切换模式。" };
			}
			const sourceId = invocation.agent.session.id;
			const current = invocation.agent.session.header.agentPreset;
			const requested = invocation.rawInput.trim();
			let roster;
			try { roster = await presets.list(); } catch (error) { return { kind: "error", text: `读取模式名册失败：${String(error)}` }; }
			if (roster.length === 0) return { kind: "error", text: "模式名册为空：没有任何可供切换的 preset。" };
			if (requested === "") {
				const lines = roster.map((p) => `${p.id === current ? "*" : " "} ${p.id.padEnd(20)} ${presetLabel(p)}${p.broken ? `  不可用：${p.broken}` : ""}`);
				return { kind: "success", text: `可用模式（* 为当前）：\n${lines.join("\n")}\n\n切换用法：/mode <id>` };
			}
			const targetId = requested.split(/\s+/)[0];
			if (targetId === current) return { kind: "success", text: `当前已经是「${targetId}」模式，无需切换。` };
			let target;
			try { target = await presets.resolve(targetId); } catch { return { kind: "error", text: `没有这个模式：${targetId}。可用：${roster.map((p) => p.id).join("、")}` }; }
			if (target.broken) return { kind: "error", text: `模式「${target.id}」不可用：${target.broken}` };

			let source;
			try { source = await readLog(ctx, sourceId); } catch (error) { return { kind: "error", text: `读取当前会话历史失败：${String(error)}` }; }
			const cut = seedCut(source.events);
			if (cut === undefined || cut === 0) return { kind: "error", text: "本对话还没有完成的轮次，没有历史可带入新模式；请直接新建会话并选择模式。" };

			const childId = `session-${randomUUID()}`;
			const { provider, model } = invocation.agent.options ?? {};
			try {
				await ctx.agents.create({
					sessionId: childId,
					seed: source.events.slice(0, cut),
					meta: {
						...(source.header.cwd === undefined ? {} : { cwd: source.header.cwd }),
						parentSession: sourceId,
						seedLength: cut,
						agentPreset: target.id
					},
					...(provider === undefined && model === undefined ? {} : { agentOptions: { ...(provider === undefined ? {} : { provider }), ...(model === undefined ? {} : { model }) } }),
					setup: async (agentCtx) => { await presets.mount(agentCtx, target.id); }
				});
			} catch (error) {
				return { kind: "error", text: `切换模式失败：${String(error)}` };
			}
			return {
				kind: "success",
				text: `已切换到「${presetLabel(target)}」模式，已带入 ${String(cut)} 条历史事件（新会话 ${childId}）\n（原会话保持不变，可随时返回继续）`
			};
		}
	}), "mode-switch: /mode command");

	console.log(`[mode-switch] /mode registered (agentPresets: ${ctx.get("agentPresets") === undefined ? "absent" : "present"})`);
}

/** Exported for the verification script. */
export { seedCut, CHILD_MARKER };
