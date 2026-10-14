window.__ModuleLoader__.load({
	id: "@local/dsh-plugin-mode-switch",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		/**
		 * Watch settled `/mode` results and open the session they created.
		 *
		 * The host `/mode` command reports the child id inside its result text —
		 * the command result is the only channel a plugin-owned host action has
		 * back to the browser (the client Remote set is fixed at build time), so
		 * this half parses the one marker the host half formats and navigates.
		 * The marker is written to read naturally in the transcript.
		 *
		 * `/handoff` used to share this listener; it moved to
		 * `@local/dsh-plugin-handoff`, which keeps its own listener.
		 * @param text - the command result's verbatim text.
		 * @returns the child session id, or undefined when absent.
		 */
		function childSessionOf(text) {
			const match = /（新会话 (session-[0-9a-zA-Z-]+)）/.exec(String(text ?? ""));
			return match === null ? undefined : match[1];
		}

		/** Required client services: the session object layer that owns opening. */
		const inject = ["sessions"];

		/**
		 * Watch settled `/mode` and `/handoff` results and open the session
		 * they created. Both commands report the new session id inside their
		 * result text — the command result is the only channel a plugin-owned
		 * host action has back to the browser (the client Remote set is fixed at
		 * build time), so this half parses the marker the host half formats.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			ctx.on("command/executed", (sessionId, commandName, result) => {
				if (commandName !== "mode") return;
				if (result === undefined || result.kind !== "success") return;
				const childId = childSessionOf(result.text);
				if (childId === undefined) return;
				try {
					ctx.sessions.open(childId);
				} catch (error) {
					console.error(`[mode-switch] opening switched session "${childId}" failed:`, error);
				}
			});
		}

		exports.apply = apply;
		exports.inject = inject;
		exports.childSessionOf = childSessionOf;
		return module.exports;
	}
});
