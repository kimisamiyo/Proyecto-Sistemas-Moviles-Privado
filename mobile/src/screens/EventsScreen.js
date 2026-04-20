import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useEventStore } from '../store/eventStore';
import { useLanguageStore } from '../store/languageStore';
import { useAuthStore } from '../store/authStore';

export default function EventsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { events, fetchAllEvents, isLoading } = useEventStore();
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'myEvents'
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const FILTERS = [
    { key: 'All', label: t.events.all },
    { key: 'Symposium', label: t.events.symposium },
    { key: 'Live Salon', label: t.events.liveSalon },
    { key: 'Hackathon', label: t.events.hackathon },
    { key: 'In-Person Seminar', label: t.events.seminar },
    { key: 'Workshop', label: t.events.workshop },
  ];

  useEffect(() => { fetchAllEvents(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await fetchAllEvents(); setRefreshing(false);
  }, []);

  const uniqueDates = Array.from(new Set(events.map(e => {
    if (!e.schedule?.date) return null;
    return new Date(e.schedule.date).toISOString().split('T')[0];
  }))).filter(Boolean).sort();

  let filteredEvents = events;

  // Filter by Tab (Explore vs My Events)
  if (activeTab === 'myEvents' && user) {
    filteredEvents = filteredEvents.filter(e => e.attendees?.includes(user._id));
  }

  // Filter by Topic
  if (activeFilter !== 'All') {
    filteredEvents = filteredEvents.filter(e => e.metadata?.type === activeFilter);
  }

  // Filter by Calendar Date
  if (selectedDate) {
    filteredEvents = filteredEvents.filter(e => {
      const eDate = new Date(e.schedule?.date).toISOString().split('T')[0];
      return eDate === selectedDate;
    });
  }

  const renderEvent = ({ item }) => {
    const spotsLeft = item.capacity?.max - item.capacity?.current;
    const eventDate = new Date(item.schedule?.date);
    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: item._id })}
        activeOpacity={0.85}
      >
        {item.isFeatured && <View style={styles.featuredAccent} />}
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.typeTag}>{item.metadata?.type?.toUpperCase()}</Text>
            {item.isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveText}>{t.feed.liveNow}</Text>
              </View>
            )}
          </View>
          <Text style={styles.eventTitle} numberOfLines={2}>{item.metadata?.title}</Text>
          <Text style={styles.eventDesc} numberOfLines={2}>{item.metadata?.description}</Text>
          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="calendar-outline" size={13} color={colors.outline} />
              <Text style={styles.footerText}>
                {eventDate.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={13} color={colors.outline} />
              <Text style={styles.footerText}>{item.schedule?.startTime}</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="people-outline" size={13} color={spotsLeft <= 10 ? colors.error : colors.outline} />
              <Text style={[styles.footerText, spotsLeft <= 10 && { color: colors.error }]}>
                {spotsLeft} {t.events.seatsLeft}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>{t.events.headerLabel}</Text>
        <Text style={styles.headerTitle}>{t.events.headerTitle}</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'explore' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('explore')}
        >
          <Text style={[styles.tabText, activeTab === 'explore' && styles.tabTextActive]}>
            {t.events.exploreTab}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'myEvents' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('myEvents')}
        >
          <Text style={[styles.tabText, activeTab === 'myEvents' && styles.tabTextActive]}>
            {t.events.myEventsTab}
          </Text>
        </TouchableOpacity>
      </View>

      {uniqueDates.length > 0 && (
        <View style={styles.calendarContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={uniqueDates}
            keyExtractor={item => item}
            contentContainerStyle={styles.calendarScroll}
            renderItem={({ item }) => {
              const dateObj = new Date(item + 'T12:00:00Z');
              const dayStr = dateObj.toLocaleDateString('es-PE', { weekday: 'short' }).substring(0, 3).toUpperCase();
              const numStr = dateObj.getDate();
              const isSelected = selectedDate === item;
              return (
                <TouchableOpacity 
                  style={[styles.dateCard, isSelected && styles.dateCardActive]}
                  onPress={() => setSelectedDate(isSelected ? null : item)}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateDayActive]}>{dayStr}</Text>
                  <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>{numStr}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
      <View style={styles.filterRow}>
        <FlatList
          horizontal data={FILTERS} showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll} keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item.key && styles.filterActive]}
              onPress={() => setActiveFilter(item.key)}
            >
              <Text style={[styles.filterText, activeFilter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <FlatList
        data={filteredEvents} keyExtractor={(item) => item._id} renderItem={renderEvent}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>{t.events.noEvents}</Text></View>}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  headerLabel: { ...typography.label_sm, color: colors.outline, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { ...typography.display_sm, color: colors.on_surface },
  tabsContainer: { 
    flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg,
    alignItems: 'center', gap: spacing.md
  },
  tabBtn: { paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: colors.primary },
  tabText: { ...typography.title_md, color: colors.outline },
  tabTextActive: { color: colors.on_surface, fontWeight: '700' },
  calendarContainer: { marginBottom: spacing.lg },
  calendarScroll: { paddingHorizontal: spacing.xl, gap: spacing.md },
  dateCard: { 
    width: 50, height: 70, borderRadius: radius.md, backgroundColor: colors.surface_container_high, 
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent'
  },
  dateCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateDay: { ...typography.label_sm, color: colors.secondary },
  dateDayActive: { color: colors.on_primary },
  dateNum: { ...typography.headline_md, color: colors.on_surface, marginTop: 4 },
  dateNumActive: { color: colors.on_primary },
  filterRow: { marginBottom: spacing.lg },
  filterScroll: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  filterChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.surface_container_high },
  filterActive: { backgroundColor: colors.primary },
  filterText: { ...typography.label_md, color: colors.secondary },
  filterTextActive: { color: colors.on_primary, fontWeight: '600' },
  list: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  eventCard: { backgroundColor: colors.surface_container_high, borderRadius: radius.lg, overflow: 'hidden' },
  featuredAccent: { height: 2, backgroundColor: colors.primary },
  cardBody: { padding: spacing.xl, gap: spacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeTag: { ...typography.label_sm, color: colors.secondary, fontSize: 9, letterSpacing: 1.5 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.live_bg, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  liveIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.live },
  liveText: { ...typography.label_sm, color: colors.live, fontSize: 8 },
  eventTitle: { ...typography.headline_md, color: colors.on_surface },
  eventDesc: { ...typography.body_md, color: colors.outline },
  cardFooter: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { ...typography.label_md, color: colors.outline },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...typography.body_md, color: colors.outline },
});
