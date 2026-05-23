import { create } from 'zustand';
import client from '../api/client';
import { parseApiErrors } from '../utils/validators';

export const useNetworkStore = create((set, get) => ({
  suggestions: [],
  discourseRooms: [],
  connections: [],
  conversations: [],
  hub: {
    accepted: [],
    pendingIncoming: [],
    pendingOutgoing: [],
    suggestions: [],
  },
  isLoading: false,

  fetchNetworkHub: async () => {
    set({ isLoading: true });
    try {
      const { data } = await client.get('/network/hub');
      set({
        hub: {
          accepted: data.accepted || [],
          pendingIncoming: data.pendingIncoming || [],
          pendingOutgoing: data.pendingOutgoing || [],
          suggestions: data.suggestions || [],
        },
        isLoading: false,
      });
      return data;
    } catch (e) {
      set({ isLoading: false });
      return get().hub;
    }
  },

  fetchSuggestions: async () => {
    try {
      const { data } = await client.get('/network/suggested-nodes');
      set({ suggestions: data.suggestions });
    } catch (error) {
      console.log('Suggestions error:', error);
    }
  },

  fetchDiscourseRooms: async () => {
    try {
      const { data } = await client.get('/network/discourse-rooms');
      set({ discourseRooms: data.rooms });
    } catch (error) {
      console.log('Discourse rooms error:', error);
    }
  },

  fetchConnections: async () => {
    try {
      const { data } = await client.get('/network/connections');
      set({ connections: data.connections });
    } catch (error) {
      console.log('Connections error:', error);
    }
  },

  fetchConnectionStatus: async (userId) => {
    try {
      const { data } = await client.get(`/network/status/${userId}`);
      return data;
    } catch {
      return { status: 'none' };
    }
  },

  sendConnectionRequest: async (recipientId) => {
    try {
      await client.post('/network/connect', { recipientId });
      await get().fetchNetworkHub();
    } catch (error) {
      throw new Error(parseApiErrors(error));
    }
  },

  acceptConnection: async (connectionId) => {
    try {
      await client.put(`/network/connect/${connectionId}/accept`);
      await get().fetchNetworkHub();
    } catch (error) {
      throw new Error(parseApiErrors(error));
    }
  },

  declineConnection: async (connectionId) => {
    try {
      await client.put(`/network/connect/${connectionId}/decline`);
      await get().fetchNetworkHub();
    } catch (error) {
      throw new Error(parseApiErrors(error));
    }
  },

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const { data } = await client.get('/messages');
      set({ conversations: data.conversations, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));
