import { create } from 'zustand';
import client from '../api/client';

export const useNetworkStore = create((set, get) => ({
  suggestions: [],
  discourseRooms: [],
  connections: [],
  conversations: [],
  isLoading: false,

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

  sendConnectionRequest: async (recipientId) => {
    try {
      await client.post('/network/connect', { recipientId });
      get().fetchSuggestions();
    } catch (error) {
      throw error.response?.data?.error || 'Failed to connect';
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
