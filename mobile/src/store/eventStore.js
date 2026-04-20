import { create } from 'zustand';
import client from '../api/client';

export const useEventStore = create((set, get) => ({
  events: [],
  liveEvents: [],
  currentEvent: null,
  isLoading: false,
  error: null,
  pagination: null,

  fetchExplore: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await client.get('/events/explore', { params });
      set({
        events: data.events,
        liveEvents: data.liveEvents,
        pagination: data.pagination,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  fetchAllEvents: async () => {
    set({ isLoading: true });
    try {
      const { data } = await client.get('/events/all');
      set({ events: data.events, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  fetchEvent: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await client.get(`/events/${id}`);
      set({ currentEvent: data.event, isLoading: false });
      return data.event;
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  registerForEvent: async (eventId) => {
    try {
      const { data } = await client.post(`/events/register/${eventId}`);
      const event = get().currentEvent;
      if (event && event._id === eventId) {
        set({
          currentEvent: {
            ...event,
            capacity: { ...event.capacity, current: event.capacity.current + 1 },
          },
        });
      }
      return data;
    } catch (error) {
      throw error.response?.data?.error || 'Registration failed';
    }
  },

  fetchRadar: async (longitude, latitude, radius = 2000) => {
    try {
      const { data } = await client.get('/events/radar', {
        params: { longitude, latitude, radius },
      });
      return data;
    } catch (error) {
      console.log('Radar error:', error);
      return { nearbyEvents: [], nearbyUsers: [] };
    }
  },

  clearCurrentEvent: () => set({ currentEvent: null }),
}));
