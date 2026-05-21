import { create } from 'zustand';
import client from '../api/client';
import { parseApiErrors } from '../utils/validators';

export const useSquadStore = create((set, get) => ({
  openSquads: [],
  mySquads: [],
  eventSquads: [],
  currentSquad: null,
  isLoading: false,
  error: null,

  fetchOpenSquads: async (params = {}) => {
    try {
      const { data } = await client.get('/squads/open', { params });
      set({ openSquads: data.recruiting || data.squads, error: null });
      return data;
    } catch (e) {
      set({ error: parseApiErrors(e) });
      return { squads: [] };
    }
  },

  fetchMySquads: async () => {
    set({ isLoading: true });
    try {
      const { data } = await client.get('/squads/my');
      set({ mySquads: data.squads, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: parseApiErrors(e) });
    }
  },

  fetchEventSquads: async (eventId) => {
    try {
      const { data } = await client.get('/squads/open', { params: { eventId } });
      set({ eventSquads: data.squads });
      return data.squads;
    } catch {
      set({ eventSquads: [] });
      return [];
    }
  },

  createSquad: async (payload) => {
    const { data } = await client.post('/squads', payload);
    await get().fetchMySquads();
    return data;
  },

  joinSquad: async (squadId, planNote = '') => {
    const { data } = await client.post(`/squads/${squadId}/join`, { planNote });
    await get().fetchMySquads();
    return data;
  },

  leaveSquad: async (squadId) => {
    await client.post(`/squads/${squadId}/leave`);
    await get().fetchMySquads();
  },

  setFromExplore: (squads) => set({ openSquads: squads || [] }),
}));
