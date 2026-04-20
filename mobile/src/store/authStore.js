import { create } from 'zustand';
import client from '../api/client';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.post('/auth/login', { email, password });
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return data;
    } catch (error) {
      const msg = error.response?.data?.error || 'Login failed';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.post('/auth/register', userData);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return data;
    } catch (error) {
      const msg = error.response?.data?.error || 'Registration failed';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  fetchMe: async () => {
    try {
      const { data } = await client.get('/auth/me');
      set({ user: data.user });
    } catch (error) {
      console.log('fetchMe error:', error);
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
