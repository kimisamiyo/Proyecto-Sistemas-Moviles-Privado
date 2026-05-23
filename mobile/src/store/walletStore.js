import { create } from 'zustand';
import client from '../api/client';
import { normalizeWallet, normalizeWalletItem } from '../utils/wallet';

export const useWalletStore = create((set, get) => ({
  tickets: [],
  isLoading: false,

  fetchWallet: async () => {
    set({ isLoading: true });
    try {
      const { data } = await client.get('/users/wallet');
      set({ tickets: normalizeWallet(data.wallet), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  addTicket: (ticket) => {
    const normalized = normalizeWalletItem({
      ...ticket,
      eventTitle: ticket.eventTitle || ticket.event?.title,
      coverImage: ticket.coverImage,
    });
    if (!normalized) return;
    set((state) => {
      const exists = state.tickets.some((t) => t.eventId === normalized.eventId);
      const merged = {
        ...normalized,
        qrDataUrl: ticket.qrDataUrl || normalized.qrDataUrl,
        ttlSeconds: ticket.ttlSeconds || normalized.ttlSeconds,
        rawTicket: ticket,
      };
      if (exists) {
        return {
          tickets: state.tickets.map((t) =>
            t.eventId === normalized.eventId ? { ...t, ...merged } : t
          ),
        };
      }
      return { tickets: [...state.tickets, merged] };
    });
  },

  hasTicketForEvent: (eventId) =>
    get().tickets.some((t) => String(t.eventId) === String(eventId)),
}));
