import { create } from 'zustand';
import client from '../api/client';
import { parseApiErrors } from '../utils/validators';

async function requestTicket(eventId, rotate = false) {
  const paths = rotate
    ? [`/events/${eventId}/ticket/refresh`, `/eventus/events/${eventId}/ticket/refresh`]
    : [`/events/${eventId}/ticket`, `/eventus/events/${eventId}/ticket`];

  let lastError;
  for (const path of paths) {
    try {
      const { data } = rotate ? await client.post(path) : await client.get(path);
      const ticket = data?.ticket ?? data;
      if (ticket?.qrDataUrl) {
        return { ...data, ticket };
      }
      lastError = new Error('Respuesta sin QR');
    } catch (e) {
      lastError = e;
      const status = e.response?.status;
      const msg = e.response?.data?.error || '';
      if (status === 404 && msg.toLowerCase().includes('endpoint not found')) {
        continue;
      }
      if (status === 404) {
        continue;
      }
    }
  }

  if (!rotate) {
    try {
      const { data } = await client.post(`/events/register/${eventId}`);
      const ticket = data?.ticket;
      if (ticket?.qrDataUrl) {
        return { ...data, ticket, fromRegister: true };
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError;
}

export const useEventusStore = create((set, get) => ({
  wall: null,
  matchGroups: [],
  album: null,
  albumMeta: {
    canModerate: false,
    pendingCount: 0,
    myPendingCount: 0,
    moderationQueue: [],
  },
  metrics: null,
  metricsForbidden: false,
  badgeWall: null,
  whatsappInvite: null,
  ticketQR: null,
  isLoading: false,
  error: null,

  fetchWall: async (eventId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.get(`/eventus/events/${eventId}/wall`);
      set({ wall: data.wall, isLoading: false });
      return data.wall;
    } catch (e) {
      set({ isLoading: false, error: parseApiErrors(e) });
      throw e;
    }
  },

  postWall: async (eventId, content, type = 'general') => {
    try {
      const { data } = await client.post(`/eventus/events/${eventId}/wall`, { content, type });
      set({ wall: data.wall, error: null });
      return data;
    } catch (e) {
      set({ error: parseApiErrors(e) });
      throw e;
    }
  },

  fetchMatchGroups: async (eventId) => {
    try {
      const { data } = await client.get(`/eventus/events/${eventId}/groups`);
      set({ matchGroups: data.groups || [], error: null });
      return data.groups;
    } catch (e) {
      set({ matchGroups: [], error: parseApiErrors(e) });
      return [];
    }
  },

  joinMatchmaking: async (eventId, force = false) => {
    try {
      const { data } = await client.post(`/eventus/events/${eventId}/groups/join`, { force });
      await get().fetchMatchGroups(eventId);
      return data;
    } catch (e) {
      set({ error: parseApiErrors(e) });
      throw e;
    }
  },

  leaveMatchmaking: async (eventId) => {
    try {
      const { data } = await client.post(`/eventus/events/${eventId}/groups/leave`);
      await get().fetchMatchGroups(eventId);
      return data;
    } catch (e) {
      set({ error: parseApiErrors(e) });
      throw e;
    }
  },

  fetchAlbum: async (eventId) => {
    try {
      const { data } = await client.get(`/eventus/events/${eventId}/album`);
      set({
        album: data.album,
        albumMeta: {
          canModerate: !!data.canModerate,
          pendingCount: data.pendingCount || 0,
          myPendingCount: data.myPendingCount || 0,
          moderationQueue: data.moderationQueue || [],
        },
        error: null,
      });
      return data;
    } catch (e) {
      set({
        album: null,
        albumMeta: { canModerate: false, pendingCount: 0, myPendingCount: 0, moderationQueue: [] },
        error: parseApiErrors(e),
      });
      return null;
    }
  },

  postAlbumPhoto: async (eventId, url, caption = '') => {
    try {
      const { data } = await client.post(`/eventus/events/${eventId}/album`, { url, caption });
      set({
        album: data.album,
        albumMeta: {
          canModerate: !!data.canModerate,
          pendingCount: data.pendingCount || 0,
          myPendingCount: data.myPendingCount || 0,
          moderationQueue: data.moderationQueue || [],
        },
        error: null,
      });
      return data;
    } catch (e) {
      set({ error: parseApiErrors(e) });
      throw e;
    }
  },

  reviewAlbumPhoto: async (eventId, photoId, action, reason = '') => {
    try {
      const { data } = await client.patch(`/eventus/events/${eventId}/album/photos/${photoId}`, {
        action,
        reason,
      });
      set({
        album: data.album,
        albumMeta: {
          canModerate: !!data.canModerate,
          pendingCount: data.pendingCount || 0,
          myPendingCount: data.myPendingCount || 0,
          moderationQueue: data.moderationQueue || [],
        },
        error: null,
      });
      return data;
    } catch (e) {
      set({ error: parseApiErrors(e) });
      throw e;
    }
  },

  reactToPost: async (eventId, postId, emoji = '❤️') => {
    try {
      const { data } = await client.post(`/eventus/events/${eventId}/wall/${postId}/react`, { emoji });
      set({ wall: data.wall, error: null });
      return data;
    } catch (e) {
      set({ error: parseApiErrors(e) });
      throw e;
    }
  },

  checkInTicket: async (eventId, token) => {
    const { data } = await client.post(`/eventus/events/${eventId}/checkin`, { token });
    return data;
  },

  creatorDashboard: null,
  fetchCreatorDashboard: async () => {
    try {
      const { data } = await client.get('/eventus/creator/dashboard');
      set({ creatorDashboard: data, error: null });
      return data;
    } catch (e) {
      set({ creatorDashboard: null, error: parseApiErrors(e) });
      return null;
    }
  },

  fetchMetrics: async (eventId) => {
    set({ metricsForbidden: false, error: null });
    try {
      const { data } = await client.get(`/eventus/events/${eventId}/metrics`);
      set({ metrics: data.metrics, metricsForbidden: false });
      return data;
    } catch (e) {
      if (e.response?.status === 403) {
        set({ metrics: null, metricsForbidden: true });
        return null;
      }
      set({ error: parseApiErrors(e) });
      throw e;
    }
  },

  fetchMyTicket: async (eventId) => {
    try {
      const data = await requestTicket(eventId, false);
      set({ ticketQR: data.ticket, error: null });
      return data;
    } catch (e) {
      set({ ticketQR: null, error: parseApiErrors(e) });
      throw e;
    }
  },

  refreshTicketQR: async (eventId) => {
    try {
      const data = await requestTicket(eventId, true);
      set({ ticketQR: data.ticket, error: null });
      return data;
    } catch (e) {
      set({ error: parseApiErrors(e) });
      throw e;
    }
  },

  setTicketQR: (ticket) => set({ ticketQR: ticket }),

  fetchBadgeWall: async (userId) => {
    try {
      const path = userId ? `/eventus/badges/wall/${userId}` : '/eventus/badges/wall';
      const { data } = await client.get(path);
      set({ badgeWall: data, error: null });
      return data;
    } catch (e) {
      set({ badgeWall: null, error: parseApiErrors(e) });
      return null;
    }
  },

  createEvent: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.post('/eventus/events', payload);
      set({ isLoading: false });
      return data;
    } catch (e) {
      set({ isLoading: false, error: parseApiErrors(e) });
      throw e;
    }
  },

  getWhatsAppInvite: async (eventId) => {
    try {
      const paths = [
        `/eventus/events/${eventId}/invite/whatsapp`,
        `/events/${eventId}/invite/whatsapp`,
      ];
      let lastErr;
      for (const path of paths) {
        try {
          const { data } = await client.get(path);
          set({ whatsappInvite: data, error: null });
          return data;
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr;
    } catch (e) {
      set({ error: parseApiErrors(e) });
      throw e;
    }
  },

  clearEventus: () =>
    set({
      wall: null,
      matchGroups: [],
      album: null,
      albumMeta: { canModerate: false, pendingCount: 0, myPendingCount: 0, moderationQueue: [] },
      metrics: null,
      metricsForbidden: false,
      ticketQR: null,
      whatsappInvite: null,
      error: null,
    }),
}));
