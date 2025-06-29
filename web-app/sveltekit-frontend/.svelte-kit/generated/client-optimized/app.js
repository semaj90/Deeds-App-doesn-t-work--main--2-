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
	() => import('./nodes/21')
];

export const server_loads = [0];

export const dictionary = {
		"/": [2],
		"/ai-assistant": [4],
		"/ai": [3],
		"/cases": [~5],
		"/cases/new": [6],
		"/cases/[id]": [~7],
		"/dashboard": [~8],
		"/demo": [9],
		"/evidence": [10],
		"/evidence/hash": [11],
		"/interactive-canvas": [~12],
		"/law": [13],
		"/login": [14],
		"/logout": [15],
		"/original-home": [16],
		"/profile": [~17],
		"/register": [18],
		"/report-builder": [19],
		"/reports": [20],
		"/ui-demo": [21]
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