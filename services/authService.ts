import { User } from '../types';

const SESSION_KEY = 'savvy_current_session';
const envUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
const API_BASE = envUrl.endsWith('/') ? envUrl.slice(0, envUrl.length - 1) : envUrl;
console.log('Current API_BASE:', API_BASE);

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  return response.json() as Promise<T>;
};

export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    const user = await request<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  register: async (name: string, username: string, password: string): Promise<User> => {
    const user = await request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, username, password })
    });
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  changePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    await request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ userId, currentPassword, newPassword })
    });
  }
};
