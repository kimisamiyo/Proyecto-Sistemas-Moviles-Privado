import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventusStore } from '../../../store/eventusStore';
import { useAuthStore } from '../../../store/authStore';
import AppButton from '../../ui/AppButton';
import AvatarImage from '../../ui/AvatarImage';
import { colors, typography, spacing, radius } from '../../../theme/tokens';
import { parseApiErrors } from '../../../utils/validators';

export default function EventGroupsTab({ eventId }) {
  const { matchGroups, fetchMatchGroups, joinMatchmaking, isLoading, error } = useEventusStore();
  const myId = useAuthStore((s) => s.user?._id || s.user?.id);

  useEffect(() => {
    fetchMatchGroups(eventId);
  }, [eventId]);

  const myGroup = useMemo(
    () => matchGroups.find((g) => g.members?.some((m) => String(m.user?._id || m.user) === String(myId))),
    [matchGroups, myId]
  );

  const handleJoin = async (force = false) => {
    try {
      const result = await joinMatchmaking(eventId, force);
      await fetchMatchGroups(eventId);
      const groupName = result?.group?.name || result?.name || 'tu nuevo grupo';
      Alert.alert(
        '¡Grupo asignado!',
        `Te uniste a "${groupName}". Revisa los miembros y conéctate antes del evento.`
      );
    } catch (e) {
      const data = e?.response?.data;
      if (data?.canSwitch) {
        Alert.alert(
          'Ya estás en un grupo',
          '¿Deseas cambiar de grupo? Esto te sacará de tu grupo actual y te asignará uno nuevo por afinidad.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Cambiar de grupo', style: 'destructive', onPress: () => handleJoin(true) },
          ]
        );
      } else {
        Alert.alert('No se pudo unir', parseApiErrors(e));
      }
    }
  };

  const handleLeave = () => {
    Alert.alert(
      'Salir del grupo',
      '¿Seguro que quieres salir de tu grupo actual? Podrás unirte a otro después.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { leaveMatchmaking } = useEventusStore.getState();
              await leaveMatchmaking(eventId);
              await fetchMatchGroups(eventId);
              Alert.alert('Listo', 'Saliste del grupo. Puedes unirte a otro cuando quieras.');
            } catch (e) {
              Alert.alert('Error', parseApiErrors(e));
            }
          },
        },
      ]
    );
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

      {matchGroups.map((g) => {
        const isMine = myGroup?._id === g._id;
        return (
          <View key={g._id} style={[styles.card, isMine && styles.cardMine]}>
            {isMine ? (
              <View style={styles.myBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={styles.myBadgeText}>Tu grupo</Text>
              </View>
            ) : null}
            <Text style={styles.name}>{g.name}</Text>
            <Text style={styles.meta}>
              {g.members?.length || 0}/{g.maxSize} miembros · {g.status === 'forming' ? 'Formando' : g.status === 'ready' ? 'Listo' : g.status}
            </Text>
            {g.members?.length > 0 ? (
              <View style={styles.membersRow}>
                {g.members.slice(0, 5).map((m, i) => {
                  const user = m.user || {};
                  const initials = `${user.profile?.firstName?.[0] || ''}${user.profile?.lastName?.[0] || ''}`;
                  return (
                    <View key={String(user._id || i)} style={[styles.avatarWrap, { marginLeft: i > 0 ? -8 : 0 }]}>
                      <AvatarImage uri={user.profile?.avatar} initials={initials || '?'} size={30} />
                    </View>
                  );
                })}
                {g.members.length > 5 ? (
                  <Text style={styles.moreMembers}>+{g.members.length - 5}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}

      {error ? <Text style={styles.err}>{error}</Text> : null}

      {myGroup ? (
        <View style={styles.actionRow}>
          <AppButton
            title="Cambiar de grupo"
            onPress={() => handleJoin(false)}
            style={{ flex: 1 }}
          />
          <AppButton
            title="Salir"
            variant="outline"
            onPress={handleLeave}
            style={{ marginLeft: spacing.sm }}
          />
        </View>
      ) : (
        <AppButton title="Unirme a un grupo" onPress={() => handleJoin(false)} style={{ marginTop: spacing.lg }} />
      )}
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
  cardMine: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: 'rgba(63, 100, 108, 0.04)',
  },
  myBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  myBadgeText: { ...typography.label_sm, color: colors.primary, fontWeight: '700' },
  name: { ...typography.title_lg, color: colors.on_surface },
  meta: { ...typography.body_sm, color: colors.outline, marginTop: spacing.xs },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  avatarWrap: {
    borderWidth: 2,
    borderColor: colors.surface_container_lowest,
    borderRadius: 16,
  },
  moreMembers: { ...typography.label_sm, color: colors.outline, marginLeft: spacing.sm },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  err: { ...typography.body_sm, color: colors.error, marginTop: spacing.sm },
});
