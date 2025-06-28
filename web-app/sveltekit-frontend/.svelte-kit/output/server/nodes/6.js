import * as server from '../entries/pages/cases/new/_page.server.ts.js';

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/cases/new/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/cases/new/+page.server.ts";
export const imports = ["_app/immutable/nodes/6.BjLNx28u.js","_app/immutable/chunks/NZTpNUN0.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BYQKk6H6.js","_app/immutable/chunks/PiYpTS27.js","_app/immutable/chunks/D-1WSpRi.js","_app/immutable/chunks/B3dOcNhk.js","_app/immutable/chunks/CM1-X8bE.js","_app/immutable/chunks/CLMhaNbx.js","_app/immutable/chunks/1Ch0Ejb8.js","_app/immutable/chunks/DY4wjaGN.js","_app/immutable/chunks/DR3-7Mjs.js","_app/immutable/chunks/CWcG5Nj1.js","_app/immutable/chunks/C9viQpdf.js","_app/immutable/chunks/DIVb6241.js","_app/immutable/chunks/BHytdMEq.js","_app/immutable/chunks/B-8_dKVK.js"];
export const stylesheets = ["_app/immutable/assets/6.DiitKOM5.css"];
export const fonts = [];
