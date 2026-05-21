import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, spacing } from '../theme/tokens';
import { useSquadStore } from '../store/squadStore';
import SquadCard from './SquadCard';
import FadeInView from './ui/FadeInView';
import PressableScale from './ui/PressableScale';

export default function SquadsStrip({
  title = 'Escuadras disponibles',
  subtitle = 'Únete y no vayas solo',
  eventId,
  squads: squadsProp,
  compact,
  onSquadPress,
  onSeeAll,
  onCreate,
}) {
  const openSquads = useSquadStore((s) => s.openSquads);
  const eventSquads = useSquadStore((s) => s.eventSquads);
  const fetchOpenSquads = useSquadStore((s) => s.fetchOpenSquads);
  const fetchEventSquads = useSquadStore((s) => s.fetchEventSquads);
  const isLoading = useSquadStore((s) => s.isLoading);

  useEffect(() => {
    if (squadsProp) return;
    if (eventId) fetchEventSquads(eventId);
    else fetchOpenSquads();
  }, [eventId, squadsProp]);

  const squads = squadsProp || (eventId ? eventSquads : openSquads);

  if (!squads?.length && !isLoading) return null;

  return (
    <FadeInView style={styles.wrap}>
      <View style={styles.head}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{subtitle}</Text>
        </View>
        <View style={styles.actions}>
          {onCreate && (
            <PressableScale onPress={onCreate} style={styles.createBtn}>
              <Text style={styles.createText}>+ Hostear</Text>
            </PressableScale>
          )}
          {onSeeAll && (
            <PressableScale onPress={onSeeAll}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </PressableScale>
          )}
        </View>
      </View>
      {isLoading && !squads?.length ? (
        <ActivityIndicator color={colors.primary} style={{ padding: spacing.lg }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {squads.map((s) => (
            <SquadCard key={s._id} squad={s} onPress={onSquadPress} compact={compact} />
          ))}
        </ScrollView>
      )}
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  title: { ...typography.headline_md, color: colors.on_surface },
  sub: { ...typography.body_sm, color: colors.outline, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  createBtn: { backgroundColor: colors.primary_container, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 999 },
  createText: { ...typography.label_md, color: colors.primary, fontWeight: '700' },
  seeAll: { ...typography.label_md, color: colors.secondary },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
});
