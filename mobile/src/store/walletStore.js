import { create } from 'zustand';
import client from '../api/client';

export const useWalletStore = create((set, get) => ({
  tickets: [],
  isLoading: false,

  fetchWallet: async () => {
    set({ isLoading: true });
    try {
      const { data } = await client.get('/users/wallet');
      set({ tickets: data.wallet, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  addTicket: (ticket) => {
    set((state) => ({
      tickets: [...state.tickets, ticket],
    }));
  },
}));
