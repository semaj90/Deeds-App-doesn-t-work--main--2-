import * as server from '../entries/pages/profile/_page.server.ts.js';

export const index = 13;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/profile/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/profile/+page.server.ts";
export const imports = ["_app/immutable/nodes/13.hVewixdA.js","_app/immutable/chunks/NZTpNUN0.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BYQKk6H6.js","_app/immutable/chunks/D-1WSpRi.js","_app/immutable/chunks/B3dOcNhk.js","_app/immutable/chunks/CM1-X8bE.js","_app/immutable/chunks/CLMhaNbx.js","_app/immutable/chunks/hvL4XB1e.js","_app/immutable/chunks/DIVb6241.js","_app/immutable/chunks/B-8_dKVK.js","_app/immutable/chunks/DR3-7Mjs.js","_app/immutable/chunks/BKty5eCY.js","_app/immutable/chunks/DwDGgwRq.js","_app/immutable/chunks/CWcG5Nj1.js"];
export const stylesheets = [];
export const fonts = [];
