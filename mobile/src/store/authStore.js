import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const SESSION_KEY = '@eventus/session';

const persistSession = async (user, token) => {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
  } catch (e) {
    // Storage no disponible: la sesión será solo en memoria
  }
};

const clearSession = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (e) {}
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  isHydrating: true,
  error: null,

  // Restaura la sesión guardada al abrir la app y la revalida contra la API.
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) {
        set({ isHydrating: false });
        return;
      }
      const { user, token } = JSON.parse(raw);
      if (!token) {
        set({ isHydrating: false });
        return;
      }
      set({ user, token, isAuthenticated: true, isHydrating: false });
      // Revalidar en segundo plano; si el token expiró, el interceptor hará logout.
      client
        .get('/auth/me')
        .then(({ data }) => {
          set({ user: data.user });
          persistSession(data.user, token);
        })
        .catch(() => {});
    } catch (e) {
      set({ isHydrating: false });
    }
  },

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
      persistSession(data.user, data.token);
      return data;
    } catch (error) {
      let msg = error.response?.data?.error;
      if (!msg) {
        if (!error.response) {
          msg =
            'No se puede conectar al servidor. Crea mobile/.env con EXPO_PUBLIC_API_URL (ngrok) o la IP de tu PC en la misma WiFi, y reinicia Expo con --clear.';
        } else {
          msg = 'Login failed';
        }
      }
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
      persistSession(data.user, data.token);
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
      const token = get().token;
      if (token) persistSession(data.user, token);
    } catch (error) {
      console.log('fetchMe error:', error);
    }
  },

  logout: () => {
    clearSession();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
