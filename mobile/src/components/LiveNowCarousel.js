import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme/tokens';
import { useLayout } from '../utils/responsive';
import { getEventCover } from '../utils/images';
import CommunityChip from './CommunityChip';

function LivePulse() {
  return (
    <View style={styles.liveRow}>
      <View style={styles.liveDot} />
      <Text style={styles.liveLabel}>EN VIVO AHORA</Text>
    </View>
  );
}

export default function LiveNowCarousel({ liveEvents = [], onPress }) {
  const { liveCardWidth, horizontalPad, bottomInset } = useLayout();

  if (!liveEvents?.length) {
    return (
      <View style={[styles.empty, { marginHorizontal: horizontalPad }]}>
        <Ionicons name="radio-outline" size={28} color={colors.outline} />
        <Text style={styles.emptyText}>No hay eventos en vivo en este momento</Text>
        <Text style={styles.emptySub}>Vuelve más tarde o explora el feed</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.head, { paddingHorizontal: horizontalPad }]}>
        <LivePulse />
        <Text style={styles.headCount}>{liveEvents.length} activo{liveEvents.length > 1 ? 's' : ''}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: horizontalPad, paddingBottom: 4 }]}
        decelerationRate="fast"
        snapToInterval={liveCardWidth + spacing.md}
      >
        {liveEvents.map((event) => {
          const cover = getEventCover(event);
          const venue = event.location?.venue || 'Ubicación por confirmar';
          return (
            <TouchableOpacity
              key={event._id}
              style={[styles.card, { width: liveCardWidth }, shadows.float]}
              onPress={() => onPress?.(event)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
              <View style={styles.coverOverlay} />
              <View style={styles.liveBadge}>
                <View style={styles.liveBadgeDot} />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
              <View style={styles.cardBody}>
                <CommunityChip slug={event.metadata?.communitySlug} size="sm" />
                <Text style={styles.title} numberOfLines={2}>
                  {event.metadata?.title}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={colors.on_primary} />
                  <Text style={styles.meta} numberOfLines={1}>
                    {venue}
                  </Text>
                </View>
                <View style={styles.cta}>
                  <Text style={styles.ctaText}>Entrar al evento</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.on_primary} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={{ height: bottomInset > 0 ? 0 : spacing.sm }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.live,
  },
  liveLabel: { ...typography.label_lg, color: colors.live, letterSpacing: 1 },
  headCount: { ...typography.label_md, color: colors.outline },
  scroll: { gap: spacing.md },
  card: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    backgroundColor: colors.surface_container_lowest,
    borderWidth: 1,
    borderColor: colors.primary_container,
  },
  cover: { width: '100%', height: 160, backgroundColor: colors.surface_container_high },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  liveBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.live,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  liveBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  cardBody: {
    padding: spacing.lg,
    gap: spacing.xs,
    backgroundColor: colors.primary,
  },
  title: { ...typography.title_lg, color: colors.on_primary, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  meta: { ...typography.body_sm, color: 'rgba(255,255,255,0.9)', flex: 1 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  ctaText: { ...typography.label_lg, color: colors.on_primary, fontWeight: '600' },
  empty: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: { ...typography.body_md, color: colors.on_surface_variant, textAlign: 'center' },
  emptySub: { ...typography.body_sm, color: colors.outline, textAlign: 'center' },
});
