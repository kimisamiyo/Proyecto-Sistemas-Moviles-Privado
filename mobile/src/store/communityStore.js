import { create } from 'zustand';
import client from '../api/client';
import { getCommunityTheme } from '../theme/communityThemes';

export const useCommunityStore = create((set, get) => ({
  communities: [],
  selectedSlug: null,
  isLoading: false,

  fetchCommunities: async () => {
    set({ isLoading: true });
    try {
      const { data } = await client.get('/communities');
      set({ communities: data.communities, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setSelectedCommunity: (slug) => set({ selectedSlug: slug }),

  getTheme: (slug) => {
    const fromApi = get().communities.find((c) => c.slug === slug);
    if (fromApi?.theme) {
      return {
        slug: fromApi.slug,
        name: fromApi.name,
        tagline: fromApi.tagline,
        icon: fromApi.icon,
        colors: fromApi.theme,
        gradient: fromApi.theme?.gradient,
      };
    }
    return getCommunityTheme(slug);
  },
}));
