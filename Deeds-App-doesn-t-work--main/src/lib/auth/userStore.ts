import { writable } from 'svelte/store';

interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    username?: string;
    role?: string;
    profile?: any; // Adjust this type based on your user profile schema
  } | null;
  expires: Date | null;
}

export const userSessionStore = writable<UserSession | null>(null);