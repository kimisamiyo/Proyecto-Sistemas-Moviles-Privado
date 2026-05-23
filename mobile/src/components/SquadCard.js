import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme/tokens';
import { getCommunityTheme } from '../theme/communityThemes';
import { useLayout } from '../utils/responsive';
import { getSquadCover } from '../utils/images';
import AvatarImage from './ui/AvatarImage';
import PressableScale from './ui/PressableScale';
import AppButton from './ui/AppButton';

export default function SquadCard({
  squad,
  onPress,
  onJoin,
  compact,
  fullWidth,
  planNote = '',
  isJoined = false,
}) {
  const { squadCardWidth, horizontalPad } = useLayout();
  const theme = getCommunityTheme(squad.communitySlug || squad.event?.metadata?.communitySlug);
  const c = theme.colors;
  const active = squad.activeCount ?? squad.members?.filter((m) => m.status === 'active').length ?? 0;
  const max = squad.maxSize || 5;
  const open = squad.slotsOpen ?? Math.max(0, max - active);
  const eventTitle = squad.event?.metadata?.title || squad.event?.title || 'Evento vinculado';
  const cover = getSquadCover(squad);
  const cardWidth = fullWidth ? undefined : compact ? squadCardWidth * 0.92 : squadCardWidth;

  const handleJoin = () => {
    if (open <= 0) return;
    if (onJoin) onJoin(squad, planNote);
    else onPress?.(squad);
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface_container_lowest, borderColor: colors.surface_container_high },
        cardWidth != null && { width: cardWidth },
        fullWidth && styles.fullWidth,
        shadows.ambient,
      ]}
    >
      <PressableScale onPress={() => onPress?.(squad)}>
        <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
      </PressableScale>
      <PressableScale onPress={() => onPress?.(squad)} style={styles.body}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: c.primary_container }]}>
            <Ionicons
              name={squad.activityTag === 'pokemon_go' ? 'game-controller-outline' : theme.icon || 'people-outline'}
              size={18}
              color={c.primary}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>
              {squad.name}
            </Text>
            <Text style={styles.event} numberOfLines={1}>
              {eventTitle}
            </Text>
          </View>
          <View style={[styles.slots, open === 1 && styles.slotsUrgent]}>
            <Text style={[styles.slotsText, { color: open === 1 ? colors.live : colors.primary }]}>
              {active}/{max}
            </Text>
            {open > 0 ? <Text style={styles.slotsHint}>+{open} cupo{open > 1 ? 's' : ''}</Text> : null}
          </View>
        </View>

        <Text style={styles.plan} numberOfLines={fullWidth ? 3 : 2}>
          {squad.plan}
        </Text>

        <View style={styles.footer}>
          <View style={styles.avatars}>
            {(squad.membersPreview || squad.members || []).slice(0, 4).map((m, i) => {
              const u = m.user?.profile || m.user;
              return (
                <View key={m._id || i} style={{ marginLeft: i ? -10 : 0 }}>
                  <AvatarImage
                    uri={u?.avatar}
                    size={32}
                    initials={`${u?.firstName?.[0] || ''}${u?.lastName?.[0] || ''}`}
                    borderColor={colors.surface_container_lowest}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </PressableScale>

      {isJoined ? (
        <View style={styles.joinWrap}>
          <AppButton title="Ya unido" variant="outline" onPress={() => onPress?.(squad)} />
        </View>
      ) : open > 0 ? (
        <View style={styles.joinWrap}>
          <AppButton
            title={open === 1 ? '¡Último cupo! Unirme' : 'Unirme a la escuadra'}
            onPress={handleJoin}
          />
        </View>
      ) : (
        <Text style={styles.fullText}>Escuadra completa</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginRight: spacing.md,
    marginBottom: spacing.md,
  },
  fullWidth: { width: '100%', marginRight: 0 },
  cover: { width: '100%', height: 120, backgroundColor: colors.surface_container_high },
  body: { padding: spacing.lg, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, minWidth: 0 },
  name: { ...typography.title_lg, color: colors.on_surface, fontWeight: '700' },
  event: { ...typography.body_sm, color: colors.on_surface_variant },
  slots: { alignItems: 'flex-end' },
  slotsUrgent: {},
  slotsText: { ...typography.label_lg, fontWeight: '800' },
  slotsHint: { fontSize: 10, color: colors.live, fontWeight: '600' },
  plan: { ...typography.body_md, color: colors.on_surface_variant, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center' },
  avatars: { flexDirection: 'row', alignItems: 'center' },
  joinWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  fullText: {
    ...typography.label_md,
    color: colors.outline,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
