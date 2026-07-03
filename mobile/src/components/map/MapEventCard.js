import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../theme/tokens';
import { getCommunityTheme } from '../../theme/communityThemes';
import { getEventCover } from '../../utils/images';
import CommunityChip from '../CommunityChip';

export default function MapEventCard({ event, onClose, onOpen, t, compact }) {
  if (!event) return null;
  const theme = getCommunityTheme(event.metadata?.communitySlug);
  const spotsLeft = Math.max(0, (event.capacity?.max || 0) - (event.capacity?.current || 0));
  const cover = getEventCover(event);

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {!compact && cover ? (
        <Image source={{ uri: cover }} style={styles.cover} />
      ) : null}
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <CommunityChip slug={event.metadata?.communitySlug} size="sm" />
            {event.isLive || event.schedulePhase === 'live' ? (
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>EN VIVO</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={colors.outline} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title} numberOfLines={2}>{event.metadata?.title}</Text>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text style={styles.venue} numberOfLines={1}>{event.location?.venue}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.outline} />
          <Text style={styles.meta}>
            {new Date(event.schedule?.date).toLocaleDateString('es-PE', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
            {' · '}
            {event.schedule?.startTime} — {event.schedule?.endTime}
          </Text>
        </View>
        <Text style={[styles.spots, { color: theme?.colors?.primary || colors.primary }]}>
          {spotsLeft} {t?.map?.seatsAvailable || 'cupos disponibles'}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
            <Text style={styles.secondaryBtnText}>Cerrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme?.colors?.primary || colors.primary }]}
            onPress={onOpen}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Ver evento</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outline_variant,
    shadowColor: '#1a1c1b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardCompact: { borderRadius: radius.xl },
  cover: { width: '100%', height: 100 },
  body: { padding: spacing.lg, gap: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.live_bg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.live },
  liveText: { ...typography.label_sm, color: colors.live, letterSpacing: 1 },
  title: { ...typography.headline_md, color: colors.on_surface, marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  venue: { ...typography.body_md, color: colors.on_surface_variant, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  meta: { ...typography.body_sm, color: colors.outline },
  spots: { ...typography.label_lg, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  secondaryBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outline_variant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { ...typography.label_lg, color: colors.on_surface_variant },
  primaryBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  primaryBtnText: { ...typography.label_lg, color: '#fff', fontWeight: '700' },
});
