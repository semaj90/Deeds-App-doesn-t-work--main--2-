import { writable } from 'svelte/store';
import type { UserSession } from '../types/user.js';

export const userSessionStore = writable<UserSession | null>(null);