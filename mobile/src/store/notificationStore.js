import { create } from 'zustand';
import client from '../api/client';
import { parseApiErrors } from '../utils/validators';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await client.get('/notifications');
      set({
        notifications: data.notifications || [],
        unreadCount: data.unread ?? 0,
        isLoading: false,
      });
      return data;
    } catch (e) {
      set({ isLoading: false, error: parseApiErrors(e) });
      return { notifications: [], unread: 0 };
    }
  },

  markAllRead: async () => {
    const unreadIds = get()
      .notifications.filter((n) => !n.read)
      .map((n) => n._id);
    if (!unreadIds.length) {
      set({ unreadCount: 0 });
      return;
    }
    try {
      await client.patch('/notifications/read', { ids: unreadIds });
      set({
        notifications: get().notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
        error: null,
      });
    } catch (e) {
      set({ error: parseApiErrors(e) });
      throw e;
    }
  },
}));
