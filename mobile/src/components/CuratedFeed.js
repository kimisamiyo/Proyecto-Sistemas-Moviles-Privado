import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useLanguageStore } from '../store/languageStore';

export default function CuratedFeed({ events = [], onPress }) {
  const { t } = useLanguageStore();
  if (events.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t.feed.curatedForYou}</Text>
      <View style={styles.cardList}>
        {events.map((event, index) => {
          const isWide = index % 3 === 0;
          const typeColor = getTypeColor(event.metadata?.type);
          const spotsLeft = event.capacity?.max - event.capacity?.current;
          return (
            <TouchableOpacity key={event._id} style={[styles.card, isWide && styles.cardWide]} onPress={() => onPress?.(event)} activeOpacity={0.85}>
              {event.isFeatured && <View style={styles.featuredAccent} />}
              <View style={styles.cardContent}>
                {event.isLive ? (
                  <View style={styles.liveTag}>
                    <View style={styles.liveIndicator} />
                    <Text style={styles.liveText}>{t.feed.liveNow}</Text>
                  </View>
                ) : event.metadata?.type ? (
                  <Text style={[styles.typeTag, { color: typeColor }]}>{event.metadata.type.toUpperCase()}</Text>
                ) : null}
                <Text style={styles.cardTitle} numberOfLines={2}>{event.metadata?.title}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>{event.metadata?.description}</Text>
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={12} color={colors.outline} />
                    <Text style={styles.metaText}>
                      {new Date(event.schedule?.date).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={12} color={colors.outline} />
                    <Text style={styles.metaText}>{event.schedule?.startTime}</Text>
                  </View>
                  {spotsLeft <= 20 && (
                    <View style={styles.metaItem}>
                      <Ionicons name="people-outline" size={12} color={colors.error} />
                      <Text style={[styles.metaText, { color: colors.error }]}>{spotsLeft} {t.feed.spotsLeft}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function getTypeColor(type) {
  switch (type) {
    case 'Symposium': return '#8b9dc3';
    case 'Live Salon': return colors.live;
    case 'Hackathon': return '#d4a574';
    case 'In-Person Seminar': return '#a8c5da';
    case 'Workshop': return '#b8a9c9';
    case 'Lecture': return colors.secondary;
    default: return colors.secondary;
  }
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl },
  sectionTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.lg },
  cardList: { gap: spacing.lg },
  card: { backgroundColor: colors.surface_container_high, borderRadius: radius.lg, overflow: 'hidden', position: 'relative' },
  cardWide: { minHeight: 180 },
  featuredAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary },
  cardContent: { padding: spacing.xl, gap: spacing.sm },
  liveTag: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.live_bg, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full, gap: 6 },
  liveIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.live },
  liveText: { ...typography.label_sm, color: colors.live, fontSize: 9, letterSpacing: 1.5 },
  typeTag: { ...typography.label_sm, fontSize: 9, letterSpacing: 1.5 },
  cardTitle: { ...typography.headline_md, color: colors.on_surface, marginTop: spacing.xs },
  cardDescription: { ...typography.body_md, color: colors.outline, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.label_md, color: colors.outline },
});
