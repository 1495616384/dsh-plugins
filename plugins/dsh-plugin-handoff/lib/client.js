window.__ModuleLoader__.load({
	id: "@local/dsh-plugin-handoff",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		/**
		 * Browser half: open the session the host half created.
		 *
		 * The command result is the only channel a plugin-owned host action has
		 * back to the browser (the client Remote set is fixed at build time), so
		 * this half parses the one marker the host half formats. The marker is
		 * written to read naturally in the transcript.
		 * @param text - the command result's verbatim text.
		 * @returns the child session id, or undefined when absent.
		 */
		function childSessionOf(text) {
			const match = /（新会话 (session-[0-9a-zA-Z-]+)）/.exec(String(text ?? ""));
			return match === null ? undefined : match[1];
		}

		/** Required client service: the session object layer that owns opening. */
		const inject = ["sessions"];

		/**
		 * Open the newly created session after a settled `/handoff` result.
		 *
		 * Order matters and is the whole reason this listens rather than simply
		 * opening: a freshly created session is broadcast as `blank`, and the
		 * client's workspace grouping hides `blank` rows other than the current
		 * one. `refresh()` is the only way to make the host recompute that flag,
		 * so it runs first; opening without it lands the user on a session the
		 * sidebar still refuses to list. `refresh()` is optional — a client build
		 * without it still gets the plain open.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			ctx.on("command/executed", (sessionId, commandName, result) => {
				if (commandName !== "handoff") return;
				if (result === undefined || result.kind !== "success") return;
				const childId = childSessionOf(result.text);
				if (childId === undefined) return;
				void (async () => {
					try {
						const sessions = ctx.sessions;
						if (typeof sessions.refresh === "function") {
							try { await sessions.refresh(); } catch (error) { console.error("[handoff] session list refresh failed:", error); }
						}
						sessions.open(childId);
					} catch (error) {
						console.error(`[handoff] opening handed-off session "${childId}" failed:`, error);
					}
				})();
			});
		}

		exports.apply = apply;
		exports.inject = inject;
		exports.childSessionOf = childSessionOf;
		return module.exports;
	}
});
