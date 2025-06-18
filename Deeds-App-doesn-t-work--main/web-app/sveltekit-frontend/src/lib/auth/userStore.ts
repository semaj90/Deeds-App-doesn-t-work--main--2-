import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';

const SESSION_KEY = 'app_user_session'; // Made key more specific

interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    username: string;
    role: string;
    bio?: string;
}

export interface AppSession { // Exporting interface for potential external use
    user: User | null;
    expires: string | null; // Or Date, if you plan to handle expiry client-side
}

export function getSession() {
    if (browser) {
        const sessionData = localStorage.getItem(SESSION_KEY);
        try {
            return sessionData ? JSON.parse(sessionData) as AppSession : null;
        } catch (error) {
            console.error("Error parsing session data from localStorage:", error);
            // Optionally clear corrupted data if it's consistently an issue
            // localStorage.removeItem(SESSION_KEY);
            return null;
        }
    }
    return null;
}

export function setSession(session: AppSession | null) { // Typed the session parameter
    if (browser) {
        if (session === null || session === undefined) {
            localStorage.removeItem(SESSION_KEY);
        } else {
            try {
                localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            } catch (error) {
                console.error("Error stringifying session data for localStorage:", error);
                // Handle potential errors, e.g., storage quota exceeded
            }
        }
    }
}

export function clearSession() {
    if (browser) {
        localStorage.removeItem(SESSION_KEY);
    }
}

// Svelte store that wraps localStorage logic for reactivity
const initialSessionValue = getSession();
const browserSafeInitialValue: AppSession | null = browser ? initialSessionValue : null;

export const userSessionStore: Writable<AppSession | null> = writable(browserSafeInitialValue);

// Subscribe to store changes and update localStorage
if (browser) {
    userSessionStore.subscribe(value => {
        // This ensures that if the store is updated from anywhere, localStorage reflects it.
        // And if it's set to null, localStorage is cleared.
        setSession(value);
    });
}