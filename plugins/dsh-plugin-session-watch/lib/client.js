window.__ModuleLoader__.load({
	id: "@local/dsh-plugin-session-watch",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region css
		const css = `
.sw-dock{box-sizing:border-box;width:calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset) - var(--dsh-composer-dock-inset));margin:0 auto}
.sw-bar{box-sizing:border-box;width:100%;max-width:calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);border-radius:12px;align-items:center;gap:8px;min-height:32px;margin:0 auto;padding:4px 10px 4px 10px;display:flex}
.sw-icon{flex:none;display:inline-flex;color:var(--dsw-alias-label-tertiary)}
.sw-text{min-width:0;color:var(--dsw-alias-label-primary-dimmed);font-size:13px;line-height:1.5;overflow-wrap:anywhere;white-space:nowrap}
.sw-metric{flex:none;white-space:nowrap;font-size:12px;font-variant-numeric:tabular-nums;margin-left:auto}
.sw-metric-label{color:var(--dsw-alias-label-tertiary)}
.sw-metric-value{color:var(--dsw-alias-label-secondary);min-width:52px;display:inline-block}
.sw-warn{border-color:var(--dsw-alias-state-business-primary)}
.sw-warn .sw-metric-value{color:var(--dsw-alias-state-business-primary)}
.sw-warn .sw-icon{color:var(--dsw-alias-state-business-primary)}
.sw-alert{border-color:var(--dsw-alias-state-error-primary);background:var(--dsw-specific-tip)}
.sw-alert .sw-icon{color:var(--dsw-alias-state-error-primary)}
.sw-alert .sw-text{color:var(--dsw-alias-label-primary)}
.sw-alert .sw-metric-value{color:var(--dsw-alias-state-error-primary)}`;
		const tagId = "@local/dsh-plugin-session-watch/session-watch.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@local/dsh-plugin-session-watch";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region thresholds & helpers
		/** Occupancy (per-turn projected / context window) above this switches to amber tone. */
		const OCCUPANCY_WARN = 0.20;
		/** Occupancy above this switches to red tone. Literature anchor: Chroma's
		 * Context Rot measures the first accuracy drop around ~28% fill, so 30%
		 * is the "quality now degrading" line. */
		const OCCUPANCY_ALERT = 0.30;
		/** Per-turn fallbacks when the model's context window is unknown. */
		const PER_TURN_WARN = 150_000;
		const PER_TURN_ALERT = 300_000;
		/** Credits per 1k BILLED tokens, billed = uncached + output + cache traffic / 10.
		 * Calibrated 2026-09-11 against this deployment's Token Plan: 16,032.05
		 * credits were consumed alongside 14.04M billed tokens (measured from the
		 * session logs), and 60,000 credits/month ↔ ~52.5M billed tokens matches
		 * the plan's published ~¥30/50M-token equivalence. Cache hit bills ~1/10. */
		const CREDITS_PER_1K_BILLED = 1.14;
		/** A next-turn re-read of unchanged context is a cache hit: only ~1/10 of T bills at input price. */
		const CACHE_HIT_FACTOR = 0.10;
		const WAN = 10_000;
		function fmtTok(n) {
			const v = Number.isFinite(n) ? Math.round(n) : 0;
			return v >= WAN ? `${(v / WAN).toFixed(1)}万` : String(v);
		}
		/** Resolve the tone thresholds for one pressure snapshot: window-relative
		 * when the projection knows the context window, absolute otherwise. */
		function thresholdsFor(pressure) {
			const window = pressure?.contextWindow;
			return Number.isFinite(window) && window > 0
				? { warn: window * OCCUPANCY_WARN, alert: window * OCCUPANCY_ALERT, window }
				: { warn: PER_TURN_WARN, alert: PER_TURN_ALERT, window: undefined };
		}
		//#endregion
		//#region component
		/** Composer dock strip: shows this session's cumulative burn + per-turn context cost,
		 * so you can *calculate* when continuing costs more than starting fresh.
		 * Tone: cheap / warm / expensive. */
		function SessionWatchDock({ useProjection, t }) {
			const activeGet = typeof useProjection === "function" ? useProjection : () => undefined;
			const usage = activeGet("tokenUsage");
			const pressure = activeGet("contextPressure");
			const tokens = usage === null || usage === undefined
				? 0
				: (usage.uncachedInputTokens ?? 0) + (usage.outputTokens ?? 0) + (usage.cacheReadTokens ?? 0) + (usage.cacheWriteTokens ?? 0);
			const perTurn = pressure?.projectedTokens;
			if (tokens === 0 || perTurn === undefined || perTurn === null) return null;
			const { warn, alert, window } = thresholdsFor(pressure);
			const tone = perTurn >= alert ? "alert" : perTurn >= warn ? "warn" : "";
			const occupancy = window === undefined ? null : Math.round((perTurn / window) * 100);
			const billed = (usage?.uncachedInputTokens ?? 0) + (usage?.outputTokens ?? 0)
				+ ((usage?.cacheReadTokens ?? 0) + (usage?.cacheWriteTokens ?? 0)) / 10;
			const cCredits = Math.round(billed * CREDITS_PER_1K_BILLED);
			const tCredits = Math.round(perTurn * CACHE_HIT_FACTOR * CREDITS_PER_1K_BILLED);
			const tokStr = `${fmtTok(tokens)} ≈${fmtTok(cCredits)}cr`;
			const turnStr = `${fmtTok(perTurn)}${occupancy === null ? "" : ` (${occupancy}%)`} ≈${fmtTok(tCredits)}cr`;
			return react.createElement("div", { className: "sw-dock", "data-session-watch": true, title: t("tip") },
				react.createElement("div", { className: "sw-bar sw-" + tone },
					react.createElement("span", { className: "sw-icon" },
						react.createElement(_deepseek_ai_dsh_client_ui_primitives.IconDataOutline16, { size: 14 })),
					react.createElement("span", { className: "sw-text" }, t("summary")),
					react.createElement("span", { className: "sw-metric" },
						react.createElement("span", { className: "sw-metric-label" }, "C:"),
						react.createElement("span", { className: "sw-metric-value" }, tokStr),
						"\u00A0\u00A0",
						react.createElement("span", { className: "sw-metric-label" }, "T:"),
						react.createElement("span", { className: "sw-metric-value" }, turnStr))));
		}
		//#endregion
		//#region locales
		const NS = "session-watch";
		const zh = {
			summary: "继续则每轮再付—遍此上下文",
			tip: "C:本会话累计消耗，≈x cr 为折算套餐 Credits · T:每轮重复的上下文成本，括号内为窗口占用，≈x cr 为下轮预计 Credits（按缓存命中 1/10 价折算）；黄≥20%、红≥30%"
		};
		const en = {
			summary: "Each turn re-pays this context cost",
			tip: "C: total tokens this session, ≈x cr = plan Credits equivalent · T: context cost per turn, (x%) = share of the context window, ≈x cr = estimated Credits for the next turn (at the 1/10 cache-hit rate); amber ≥20%, red ≥30%"
		};
		//#endregion
		//#region plugin body
		const inject = ["slots", "locale"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "session-watch: dictionaries");
			ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
				name: "conversation.input.dock",
				id: "session-watch",
				order: 20,
				locale: NS
			}, SessionWatchDock));
		}
		//#endregion
		exports.SessionWatchDock = SessionWatchDock;
		exports.fmtTok = fmtTok;
		exports.thresholdsFor = thresholdsFor;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});