import { create } from 'zustand';
import client from '../api/client';
import { parseApiErrors } from '../utils/validators';
import { useAuthStore } from './authStore';

export const useEventStore = create((set, get) => ({
  events: [],
  liveEvents: [],
  openSquads: [],
  pastAttendedEvents: [],
  communities: [],
  currentEvent: null,
  currentCommunity: null,
  eventSquads: [],
  myEventSquad: null,
  attendeeSquads: {},
  isLoading: false,
  error: null,
  pagination: null,
  communityFilter: null,

  fetchExplore: async (params = {}) => {
    const filter = get().communityFilter;
    set({ isLoading: true });
    try {
      const { data } = await client.get('/events/explore', {
        params: { ...params, ...(filter ? { community: filter } : {}) },
      });
      set({
        events: data.events,
        liveEvents: data.liveEvents,
        communities: data.communities || [],
        openSquads: data.openSquads || [],
        pagination: data.pagination,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  fetchPastAttended: async () => {
    try {
      const { data } = await client.get('/events/attended/past');
      set({ pastAttendedEvents: data.events || [] });
      return data.events;
    } catch {
      set({ pastAttendedEvents: [] });
      return [];
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
      set({
        currentEvent: data.event,
        currentCommunity: data.community,
        eventSquads: data.squads || [],
        myEventSquad: data.mySquad || null,
        attendeeSquads: data.attendeeSquads || {},
        isLoading: false,
      });
      return data.event;
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  registerForEvent: async (eventId) => {
    try {
      const { data } = await client.post(`/events/register/${eventId}`);
      const event = get().currentEvent;
      const user = useAuthStore.getState().user;
      if (event && String(event._id) === String(eventId) && user) {
        const attendees = [...(event.attendees || [])];
        const uid = String(user._id);
        if (!attendees.some((a) => String(a._id || a) === uid)) {
          attendees.push({
            _id: user._id,
            profile: user.profile,
          });
        }
        set({
          currentEvent: {
            ...event,
            attendees,
            capacity: data.alreadyRegistered
              ? event.capacity
              : {
                  ...event.capacity,
                  current: (event.capacity?.current || 0) + 1,
                },
          },
        });
      }
      return data;
    } catch (error) {
      throw parseApiErrors(error);
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

  setCommunityFilter: (slug) => set({ communityFilter: slug }),

  clearCurrentEvent: () =>
    set({
      currentEvent: null,
      currentCommunity: null,
      eventSquads: [],
      myEventSquad: null,
      attendeeSquads: {},
    }),
}));
