import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AvatarImage from '../ui/AvatarImage';
import ParticipantSheet from './ParticipantSheet';
import { colors, typography, spacing, radius } from '../../theme/tokens';

export default function EventAttendeesRow({
  attendees = [],
  attendeeSquads = {},
  mySquad,
  currentUserId,
  navigation,
}) {
  const [selected, setSelected] = useState(null);

  if (!attendees?.length) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Participantes</Text>
        <Text style={styles.empty}>Aún no hay inscritos. ¡Sé el primero!</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Participantes ({attendees.length})</Text>
      <Text style={styles.hint}>Toca un perfil para ver escuadra, conectar o escribir</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {attendees.map((a) => {
          const id = String(a._id || a);
          const p = a.profile || a;
          const squad = attendeeSquads[id];
          const isMe = currentUserId && id === String(currentUserId);
          return (
            <TouchableOpacity
              key={id}
              style={styles.chip}
              onPress={() => setSelected({ user: a, squad, isMe })}
              activeOpacity={0.85}
            >
              <View style={squad ? styles.avatarRing : null}>
                <AvatarImage
                  uri={p.avatar}
                  size={48}
                  initials={`${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`}
                />
              </View>
              {squad ? (
                <View style={styles.squadDot}>
                  <Text style={styles.squadDotText}>⚑</Text>
                </View>
              ) : null}
              <Text style={styles.name} numberOfLines={1}>
                {isMe ? 'Tú' : p.firstName || 'Usuario'}
              </Text>
              {squad ? (
                <Text style={styles.squadName} numberOfLines={1}>
                  {squad.name}
                </Text>
              ) : (
                <Text style={styles.noSquad}>Sin escuadra</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ParticipantSheet
        visible={!!selected}
        participant={selected?.user}
        squad={selected?.squad}
        isMe={selected?.isMe}
        mySquad={mySquad}
        onClose={() => setSelected(null)}
        navigation={navigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginTop: spacing.md },
  title: { ...typography.title_lg, color: colors.on_surface },
  hint: { ...typography.body_sm, color: colors.outline },
  empty: { ...typography.body_md, color: colors.on_surface_variant },
  scroll: { marginTop: spacing.sm },
  chip: {
    alignItems: 'center',
    width: 76,
    marginRight: spacing.md,
    position: 'relative',
  },
  avatarRing: {
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 2,
  },
  squadDot: {
    position: 'absolute',
    top: 0,
    right: 4,
    backgroundColor: colors.primary_container,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squadDotText: { fontSize: 10 },
  name: { ...typography.label_sm, color: colors.on_surface, marginTop: spacing.xs },
  squadName: { ...typography.label_sm, color: colors.primary, fontSize: 10 },
  noSquad: { ...typography.label_sm, color: colors.outline, fontSize: 10 },
});
