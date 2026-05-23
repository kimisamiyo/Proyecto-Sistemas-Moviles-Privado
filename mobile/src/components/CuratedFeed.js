import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme/tokens';
import { useLanguageStore } from '../store/languageStore';
import CommunityChip from './CommunityChip';
import { getCommunityTheme } from '../theme/communityThemes';
import { useLayout } from '../utils/responsive';
import { getEventCover } from '../utils/images';

export default function CuratedFeed({ events = [], onPress }) {
  const { t } = useLanguageStore();
  const { horizontalPad } = useLayout();
  if (events.length === 0) return null;

  return (
    <View style={[styles.container, { paddingHorizontal: horizontalPad }]}>
      <Text style={styles.sectionTitle}>{t.feed.curatedForYou}</Text>
      <View style={styles.cardList}>
        {events.map((event) => {
          const slug = event.metadata?.communitySlug;
          const theme = getCommunityTheme(slug);
          const typeColor = theme.colors.primary;
          const spotsLeft = Math.max(0, (event.capacity?.max || 0) - (event.capacity?.current || 0));
          const coverUri = getEventCover(event);
          return (
            <TouchableOpacity
              key={event._id}
              style={[styles.card, shadows.ambient]}
              onPress={() => onPress?.(event)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: coverUri }} style={styles.cover} resizeMode="cover" />
              {event.isLive ? (
                <View style={styles.liveOverlay}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveOverlayText}>EN VIVO</Text>
                </View>
              ) : null}
              <View style={styles.cardContent}>
                {slug ? <CommunityChip slug={slug} size="sm" style={{ alignSelf: 'flex-start' }} /> : null}
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {event.metadata?.title}
                </Text>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {event.metadata?.description}
                </Text>
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.outline} />
                    <Text style={styles.metaText}>
                      {new Date(event.schedule?.date).toLocaleDateString('es-PE', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.outline} />
                    <Text style={styles.metaText}>{event.schedule?.startTime}</Text>
                  </View>
                  {spotsLeft <= 20 ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="people-outline" size={14} color={colors.error} />
                      <Text style={[styles.metaText, { color: colors.error }]}>
                        {spotsLeft} {t.feed.spotsLeft}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.cta, { color: typeColor }]}>Ver detalle →</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.lg },
  cardList: { gap: spacing.lg },
  card: {
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surface_container_high,
  },
  cover: { width: '100%', height: 160, backgroundColor: colors.surface_container_high },
  liveOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.live,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveOverlayText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  cardContent: { padding: spacing.lg, gap: spacing.sm },
  cardTitle: { ...typography.headline_md, color: colors.on_surface },
  cardDescription: { ...typography.body_md, color: colors.on_surface_variant, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.label_md, color: colors.outline },
  cta: { ...typography.label_lg, fontWeight: '700', marginTop: spacing.xs },
});
