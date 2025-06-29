export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28')
];

export const server_loads = [0];

export const dictionary = {
		"/": [2],
		"/ai-assistant": [4],
		"/ai": [3],
		"/bits-uno-demo": [5],
		"/cases": [~6],
		"/cases/new": [~7],
		"/cases/[id]": [~8],
		"/dashboard": [~9],
		"/demo": [10],
		"/editor": [11],
		"/evidence": [12],
		"/evidence/hash": [13],
		"/frameworks-demo": [14],
		"/interactive-canvas": [~15],
		"/law": [16],
		"/local-ai-demo": [17],
		"/login": [18],
		"/logout": [19],
		"/original-home": [20],
		"/profile": [~21],
		"/rag-demo": [22],
		"/register": [~23],
		"/report-builder": [24],
		"/reports": [25],
		"/test-ai-ask": [26],
		"/test-gemma3": [27],
		"/ui-demo": [28]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';