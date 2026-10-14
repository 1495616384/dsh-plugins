// Node half of a browser-only plugin.
//
// Everything the user sees lives in lib/client.js.
// `inject: ["tools"]` is present only because the loader has been observed
// to leave a plugin with an empty inject list unactivated; "tools" is a
// known-present host service and is never used inside apply().
export const name = "session-watch";
export const inject = ["tools"];
export function apply() {
	console.log("[session-watch] loaded (composer dock reminder)");
}
