import * as server from '../entries/pages/cases/_page.server.ts.js';

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/cases/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/cases/+page.server.ts";
export const imports = ["_app/immutable/nodes/5.CC1CfQys.js","_app/immutable/chunks/NZTpNUN0.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/CWcG5Nj1.js","_app/immutable/chunks/BYQKk6H6.js","_app/immutable/chunks/PiYpTS27.js","_app/immutable/chunks/D-1WSpRi.js","_app/immutable/chunks/B3dOcNhk.js","_app/immutable/chunks/CM1-X8bE.js","_app/immutable/chunks/CLMhaNbx.js","_app/immutable/chunks/Bxv1FR2S.js","_app/immutable/chunks/hvL4XB1e.js","_app/immutable/chunks/DIVb6241.js"];
export const stylesheets = [];
export const fonts = [];
