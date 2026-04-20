import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme/tokens';
import { useEventStore } from '../store/eventStore';
import { useLanguageStore } from '../store/languageStore';
import LiveSalonsGallery from '../components/LiveSalonsGallery';
import CuratedFeed from '../components/CuratedFeed';

export default function FeedScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { events, liveEvents, fetchExplore, isLoading } = useEventStore();
  const { t } = useLanguageStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchExplore(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await fetchExplore(); setRefreshing(false);
  }, []);

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { eventId: event._id });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>{t.feed.headerLabel}</Text>
          <Text style={styles.headerTitle}>{t.feed.headerTitle}</Text>
        </View>
        <View style={styles.headerActions}>
          <Ionicons name="search-outline" size={22} color={colors.primary} />
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <LiveSalonsGallery liveEvents={liveEvents} onPress={handleEventPress} />
        <CuratedFeed events={events} onPress={handleEventPress} />
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  headerLabel: { ...typography.label_sm, color: colors.outline, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { ...typography.display_sm, color: colors.on_surface },
  headerActions: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface_container_high, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingTop: spacing.lg },
});
