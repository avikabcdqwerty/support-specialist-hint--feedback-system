// frontend/src/utils/auth.ts

/**
 * Handles JWT authentication and user roles on the frontend.
 * Provides helpers for storing, retrieving, and decoding JWTs,
 * as well as determining authentication and role status.
 */

import jwtDecode from 'jwt-decode';

// Types for JWT payload and user
export interface JwtPayload {
  sub: string;
  role: string;
  exp: number;
  [key: string]: any;
}

export interface AuthUser {
  id: string;
  role: string;
  username?: string;
  email?: string;
}

// LocalStorage keys
const TOKEN_KEY = 'auth_token';

// Store JWT token securely in localStorage
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

// Retrieve JWT token from localStorage
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Remove JWT token from localStorage (logout)
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Decode JWT and return user info
export function getCurrentUser(): AuthUser | null {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return {
      id: decoded.sub,
      role: decoded.role,
      username: decoded.username,
      email: decoded.email,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to decode JWT:', err);
    return null;
  }
}

// Check if user is authenticated (token exists and not expired)
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp) return false;
    const now = Date.now() / 1000;
    return decoded.exp > now;
  } catch {
    return false;
  }
}

// Get current user's role
export function getUserRole(): string | null {
  const user = getCurrentUser();
  return user?.role || null;
}

// Utility: Check if user has a specific role
export function hasRole(role: string): boolean {
  return getUserRole() === role;
}