import { userSessionStore } from './userStore.js';
import type { UserSession } from '../types/user.js';

// Helper functions for user authentication and session management

export function setUserSession(session: UserSession) {
  userSessionStore.set(session);
}

export function clearUserSession() {
  userSessionStore.set(null);
}

export function updateUserProfile(profile: Partial<UserSession['user']>) {
  userSessionStore.update(session => {
    if (session?.user) {
      return {
        ...session,
        user: {
          ...session.user,
          ...profile
        }
      };
    }
    return session;
  });
}

export function isAuthenticated(session: UserSession | null): boolean {
  return session?.user !== null && session?.user !== undefined;
}

export function hasRole(session: UserSession | null, role: string): boolean {
  return session?.user?.role === role;
}

export function hasAnyRole(session: UserSession | null, roles: string[]): boolean {
  return session?.user?.role ? roles.includes(session.user.role) : false;
}

export function isSessionExpired(session: UserSession | null): boolean {
  if (!session?.expires) return true;
  return new Date() > new Date(session.expires);
}

export function getUserDisplayName(session: UserSession | null): string {
  if (!session?.user) return 'Guest';
  
  return session.user.name || 
         `${session.user.profile?.firstName || ''} ${session.user.profile?.lastName || ''}`.trim() ||
         session.user.email ||
         'Unknown User';
}

export function getUserInitials(session: UserSession | null): string {
  if (!session?.user) return 'G';
  
  const name = getUserDisplayName(session);
  const parts = name.split(' ');
  
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  
  return name.substring(0, 2).toUpperCase();
}

export function getUserAvatar(session: UserSession | null): string | null {
  return session?.user?.image || session?.user?.profile?.avatarUrl || null;
}
