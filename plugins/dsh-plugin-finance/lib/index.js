// Node half of a browser-only client plugin.
//
// The browser half (lib/client.js) owns all behavior; this face only needs to
// exist so the Loader entry resolves and the client-modules scan finds the
// package's `dsh.client` declaration. It registers nothing on the host.
export const name = "finance";
export const inject = [];
export function apply() {}
