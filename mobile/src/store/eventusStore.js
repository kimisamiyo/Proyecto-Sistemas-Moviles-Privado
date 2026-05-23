import { create } from 'zustand';
import client from '../api/client';

export const useEventusStore = create((set, get) => ({
  wall: null,
  matchGroups: [],
  metrics: null,
  album: null,
  badges: [],
  impactPoints: 0,
  isLoading: false,
  error: null,

  fetchWall: async (eventId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.get(`/eventus/events/${eventId}/wall`);
      set({ wall: data.wall, isLoading: false });
      return data.wall;
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo cargar el muro';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  postToWall: async (eventId, content, type = 'general') => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.post(`/eventus/events/${eventId}/wall`, { content, type });
      set({ wall: data.wall, isLoading: false });
      return data.wall;
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo publicar en el muro';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  fetchMatchGroups: async (eventId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.get(`/eventus/events/${eventId}/groups`);
      set({ matchGroups: data.groups, isLoading: false });
      return data.groups;
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudieron cargar los grupos';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  joinMatchmaking: async (eventId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.post(`/eventus/events/${eventId}/groups/join`);
      // Update matchGroups with the newly joined group
      const currentGroups = get().matchGroups;
      const updatedGroups = currentGroups.some(g => g._id === data.group._id)
        ? currentGroups.map(g => g._id === data.group._id ? data.group : g)
        : [...currentGroups, data.group];
      set({ matchGroups: updatedGroups, isLoading: false });
      return data.group;
    } catch (err) {
      const msg = err.response?.data?.error || 'Matchmaking no disponible';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  fetchEventMetrics: async (eventId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.get(`/eventus/events/${eventId}/metrics`);
      set({ metrics: data.metrics, isLoading: false });
      return data.metrics;
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudieron cargar las métricas';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  fetchAlbum: async (eventId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.get(`/eventus/events/${eventId}/album`);
      set({ album: data.album, isLoading: false });
      return data.album;
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo cargar el álbum';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  addAlbumPhoto: async (eventId, url, caption = '') => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.post(`/eventus/events/${eventId}/album`, { url, caption });
      set({ album: data.album, isLoading: false });
      return data.album;
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo añadir la foto al álbum';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  refreshTicketQR: async (eventId) => {
    try {
      const { data } = await client.post(`/eventus/events/${eventId}/ticket/refresh`);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo refrescar el código QR';
      throw new Error(msg);
    }
  },

  fetchUserBadges: async (userId = '') => {
    set({ isLoading: true, error: null });
    try {
      const url = userId ? `/eventus/badges/wall/${userId}` : '/eventus/badges/wall';
      const { data } = await client.get(url);
      set({ badges: data.badges || [], impactPoints: data.impactPoints || 0, isLoading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudieron cargar las insignias';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  createEvent: async (eventData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.post('/eventus/events', eventData);
      set({ isLoading: false });
      return data.event;
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo crear el evento';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },
}));
