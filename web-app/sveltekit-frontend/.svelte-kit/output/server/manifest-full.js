export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["fonts/README.md","theme.css","ui/README.md"]),
	mimeTypes: {".md":"text/markdown",".css":"text/css"},
	_: {
		client: {start:"_app/immutable/entry/start.oZuqMwlh.js",app:"_app/immutable/entry/app.BEUWgGXp.js",imports:["_app/immutable/entry/start.oZuqMwlh.js","_app/immutable/chunks/DY4wjaGN.js","_app/immutable/chunks/BYQKk6H6.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DR3-7Mjs.js","_app/immutable/chunks/CWcG5Nj1.js","_app/immutable/entry/app.BEUWgGXp.js","_app/immutable/chunks/BYQKk6H6.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/PiYpTS27.js","_app/immutable/chunks/D-1WSpRi.js","_app/immutable/chunks/B3dOcNhk.js","_app/immutable/chunks/CM1-X8bE.js","_app/immutable/chunks/NZTpNUN0.js","_app/immutable/chunks/CWcG5Nj1.js","_app/immutable/chunks/CLMhaNbx.js","_app/immutable/chunks/BHytdMEq.js","_app/immutable/chunks/B-8_dKVK.js","_app/immutable/chunks/DR3-7Mjs.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js')),
			__memo(() => import('./nodes/9.js')),
			__memo(() => import('./nodes/10.js')),
			__memo(() => import('./nodes/11.js')),
			__memo(() => import('./nodes/12.js')),
			__memo(() => import('./nodes/13.js')),
			__memo(() => import('./nodes/14.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/ai-assistant",
				pattern: /^\/ai-assistant\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/ai",
				pattern: /^\/ai\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/api/ai/prompt",
				pattern: /^\/api\/ai\/prompt\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/ai/prompt/_server.ts.js'))
			},
			{
				id: "/api/auth/login",
				pattern: /^\/api\/auth\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/login/_server.ts.js'))
			},
			{
				id: "/api/auth/logout",
				pattern: /^\/api\/auth\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/logout/_server.ts.js'))
			},
			{
				id: "/api/auth/register",
				pattern: /^\/api\/auth\/register\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/register/_server.ts.js'))
			},
			{
				id: "/api/cases",
				pattern: /^\/api\/cases\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/cases/_server.ts.js'))
			},
			{
				id: "/api/cases/recent",
				pattern: /^\/api\/cases\/recent\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/cases/recent/_server.ts.js'))
			},
			{
				id: "/api/cases/suggest-title",
				pattern: /^\/api\/cases\/suggest-title\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/cases/suggest-title/_server.ts.js'))
			},
			{
				id: "/api/evidence",
				pattern: /^\/api\/evidence\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/evidence/_server.ts.js'))
			},
			{
				id: "/api/llm/chat",
				pattern: /^\/api\/llm\/chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/llm/chat/_server.ts.js'))
			},
			{
				id: "/api/statutes",
				pattern: /^\/api\/statutes\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/statutes/_server.ts.js'))
			},
			{
				id: "/cases",
				pattern: /^\/cases\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/cases/new",
				pattern: /^\/cases\/new\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/cases/[id]",
				pattern: /^\/cases\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/evidence",
				pattern: /^\/evidence\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/law",
				pattern: /^\/law\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/logout",
				pattern: /^\/logout\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/profile",
				pattern: /^\/profile\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/register",
				pattern: /^\/register\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 14 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
