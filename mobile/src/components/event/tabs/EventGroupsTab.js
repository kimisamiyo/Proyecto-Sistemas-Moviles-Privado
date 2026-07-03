import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useEventusStore } from '../../../store/eventusStore';
import AppButton from '../../ui/AppButton';
import { colors, typography, spacing, radius } from '../../../theme/tokens';
import { parseApiErrors } from '../../../utils/validators';

export default function EventGroupsTab({ eventId }) {
  const { matchGroups, fetchMatchGroups, joinMatchmaking, isLoading, error } = useEventusStore();

  useEffect(() => {
    fetchMatchGroups(eventId);
  }, [eventId]);

  const handleJoin = async () => {
    try {
      const result = await joinMatchmaking(eventId);
      await fetchMatchGroups(eventId);
      const groupName = result?.group?.name || result?.name || 'tu nuevo grupo';
      Alert.alert(
        '¡Grupo asignado!',
        `Te uniste a "${groupName}". Revisa los miembros y conéctate antes del evento.`
      );
    } catch (e) {
      Alert.alert('No se pudo unir', parseApiErrors(e));
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.intro}>
        Te asignamos un grupo según afinidad para que no vayas solo al evento.
      </Text>
      {isLoading && !matchGroups.length ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : null}
      {matchGroups.length === 0 && !isLoading ? (
        <Text style={styles.empty}>Aún no hay grupos formados. Sé el primero en unirte.</Text>
      ) : null}
      {matchGroups.map((g) => (
        <View key={g._id} style={styles.card}>
          <Text style={styles.name}>{g.name}</Text>
          <Text style={styles.meta}>
            {g.members?.length || 0}/{g.maxSize} miembros · {g.status}
          </Text>
          {g.affinityScore != null ? (
            <Text style={styles.affinity}>Afinidad: {Math.round(g.affinityScore * 100)}%</Text>
          ) : null}
        </View>
      ))}
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <AppButton title="Unirme a un grupo" onPress={handleJoin} style={{ marginTop: spacing.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.xl, paddingBottom: spacing.lg },
  intro: { ...typography.body_md, color: colors.on_surface_variant, marginBottom: spacing.lg },
  empty: { ...typography.body_md, color: colors.outline, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outline_variant,
  },
  name: { ...typography.title_lg, color: colors.on_surface },
  meta: { ...typography.body_sm, color: colors.outline, marginTop: spacing.xs },
  affinity: { ...typography.label_sm, color: colors.primary, marginTop: spacing.xs },
  err: { ...typography.body_sm, color: colors.error, marginTop: spacing.sm },
});
