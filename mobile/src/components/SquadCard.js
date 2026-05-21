import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius } from '../theme/tokens';
import { getCommunityTheme } from '../theme/communityThemes';
import PressableScale from './ui/PressableScale';

export default function SquadCard({ squad, onPress, compact }) {
  const theme = getCommunityTheme(squad.communitySlug);
  const c = theme.colors;
  const active = squad.activeCount ?? squad.members?.filter((m) => m.status === 'active').length ?? 0;
  const max = squad.maxSize || 5;
  const open = squad.slotsOpen ?? Math.max(0, max - active);
  const eventTitle = squad.event?.metadata?.title || squad.event?.title || '';

  return (
    <PressableScale onPress={() => onPress?.(squad)} style={[styles.card, { backgroundColor: c.surface_container_high, borderColor: c.primary }, compact && styles.compact]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: c.primary_container }]}>
          <Ionicons name={squad.activityTag === 'pokemon_go' ? 'game-controller-outline' : theme.icon} size={18} color={c.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: c.on_surface }]} numberOfLines={1}>{squad.name}</Text>
          {!compact && <Text style={[styles.event, { color: c.outline }]} numberOfLines={1}>{eventTitle}</Text>}
        </View>
        <View style={[styles.slots, open === 1 && styles.slotsUrgent]}>
          <Text style={[styles.slotsText, { color: open === 1 ? c.accent || c.live : c.primary }]}>
            {active}/{max}
          </Text>
          {open > 0 && <Text style={styles.slotsHint}>+{open}</Text>}
        </View>
      </View>
      <Text style={[styles.plan, { color: c.secondary }]} numberOfLines={compact ? 1 : 2}>{squad.plan}</Text>
      <View style={styles.footer}>
        <View style={styles.avatars}>
          {(squad.membersPreview || squad.members || []).slice(0, 4).map((m, i) => {
            const u = m.user?.profile || m.user;
            const uri = u?.avatar;
            return uri ? (
              <Image key={i} source={{ uri }} style={[styles.avatar, { marginLeft: i ? -8 : 0, borderColor: c.surface_container_high }]} />
            ) : (
              <View key={i} style={[styles.avatarPh, { marginLeft: i ? -8 : 0, backgroundColor: c.primary_container }]} />
            );
          })}
        </View>
        {open === 1 ? (
          <Text style={[styles.cta, { color: c.accent || c.live }]}>¡Falta 1! Unirse</Text>
        ) : open > 0 ? (
          <Text style={[styles.cta, { color: c.primary }]}>Unirse a escuadra</Text>
        ) : (
          <Text style={[styles.cta, { color: c.outline }]}>Completo</Text>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, marginRight: spacing.md, width: 280 },
  compact: { width: 240, padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  name: { ...typography.title_md },
  event: { ...typography.body_sm },
  slots: { alignItems: 'flex-end' },
  slotsUrgent: { transform: [{ scale: 1.05 }] },
  slotsText: { ...typography.label_lg, fontWeight: '800' },
  slotsHint: { fontSize: 10, color: '#FFD93D' },
  plan: { ...typography.body_sm, marginBottom: spacing.md },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatars: { flexDirection: 'row' },
  avatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
  avatarPh: { width: 28, height: 28, borderRadius: 14 },
  cta: { ...typography.label_md, fontWeight: '700' },
});
