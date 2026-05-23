import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useEventStore } from '../store/eventStore';
import { useLanguageStore } from '../store/languageStore';
import LiveNowCarousel from '../components/LiveNowCarousel';
import CuratedFeed from '../components/CuratedFeed';
import CommunityFilterBar from '../components/CommunityFilterBar';
import { useCommunityStore } from '../store/communityStore';
import SquadsStrip from '../components/SquadsStrip';
import { useSquadStore } from '../store/squadStore';
import FadeInView from '../components/ui/FadeInView';
import NotificationBell from '../components/ui/NotificationBell';
import { useLayout } from '../utils/responsive';
import { filterSquadsForExplore } from '../utils/squadFilters';
import { canCreateEvent } from '../utils/eventPermissions';
import { useAuthStore } from '../store/authStore';

export default function FeedScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { horizontalPad, isCompact } = useLayout();
  const { events, liveEvents, communities, openSquads, fetchExplore, communityFilter, setCommunityFilter } =
    useEventStore();
  const { setFromExplore, joinSquad, mySquads, fetchMySquads } = useSquadStore();
  const { fetchCommunities } = useCommunityStore();
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const showCreateEvent = canCreateEvent(user);

  useEffect(() => {
    fetchExplore();
    fetchCommunities();
    fetchMySquads();
  }, []);

  useEffect(() => {
    fetchExplore();
  }, [communityFilter]);

  useEffect(() => {
    if (openSquads?.length) setFromExplore(openSquads);
  }, [openSquads]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchExplore();
    setRefreshing(false);
  }, [communityFilter]);

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { eventId: event._id });
  };

  const handleSquadPress = (squad) => {
    navigation.navigate('SquadDetail', { squadId: squad._id });
  };

  const exploreSquads = useMemo(
    () => filterSquadsForExplore(openSquads || [], mySquads || []),
    [openSquads, mySquads]
  );

  const handleSquadJoin = async (squad) => {
    try {
      await joinSquad(squad._id, 'Me apunto desde el feed');
      Alert.alert('¡Unido!', `Ahora eres parte de ${squad.name}`);
      fetchExplore();
    } catch (e) {
      Alert.alert('No se pudo unir', e?.response?.data?.error || 'Intenta de nuevo');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: horizontalPad }]}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerLabel}>{t.feed.headerLabel}</Text>
          <Text style={[styles.headerTitle, isCompact && styles.headerTitleCompact]}>
            {t.feed.headerTitle}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Ionicons name="search-outline" size={22} color={colors.primary} />
          <NotificationBell navigation={navigation} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 88 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <LiveNowCarousel liveEvents={liveEvents} onPress={handleEventPress} />

        <CommunityFilterBar
          communities={communities}
          selected={communityFilter}
          onSelect={setCommunityFilter}
        />

        <SquadsStrip
          squads={exploreSquads}
          title="Escuadras buscando gente"
          subtitle="Toca una tarjeta o únete al instante"
          onSquadPress={handleSquadPress}
          onSquadJoin={handleSquadJoin}
          onSeeAll={() => navigation.getParent()?.navigate('Squads')}
        />

        <FadeInView delay={100}>
          <CuratedFeed events={events} onPress={handleEventPress} />
        </FadeInView>
      </ScrollView>

      {showCreateEvent ? (
        <TouchableOpacity
          style={[styles.fab, { bottom: spacing.lg, right: horizontalPad }]}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  headerTextWrap: { flex: 1, minWidth: 0, marginRight: spacing.sm },
  headerLabel: { ...typography.label_sm, color: colors.outline, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.on_surface, letterSpacing: -0.5 },
  headerTitleCompact: { fontSize: 24 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface_container_low,
  },
  scrollContent: { paddingTop: spacing.sm },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 28, color: colors.on_primary, fontWeight: '300', marginTop: -2 },
});
