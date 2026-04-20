import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useLanguageStore } from '../store/languageStore';

export default function ActiveSymposia({ rooms = [], onPress, t: tProp }) {
  const { t: tStore } = useLanguageStore();
  const t = tProp || tStore;
  if (rooms.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t.messages.eventGroups}</Text>
      <View style={styles.list}>
        {rooms.map((room) => (
          <TouchableOpacity key={room._id} style={styles.roomCard} onPress={() => onPress?.(room)} activeOpacity={0.85}>
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubbles" size={18} color={colors.primary} />
            </View>
            <View style={styles.roomInfo}>
              <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
              <Text style={styles.roomMeta} numberOfLines={1}>
                {room.members?.length || 0} {t.messages.members} · {room.eventId?.metadata?.type || 'Evento'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.outline} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xxl },
  sectionTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.lg },
  list: { gap: spacing.md },
  roomCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface_container_high, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  iconContainer: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.surface_container_highest, alignItems: 'center', justifyContent: 'center' },
  roomInfo: { flex: 1, gap: 2 },
  roomName: { ...typography.title_md, color: colors.on_surface },
  roomMeta: { ...typography.body_sm, color: colors.outline },
});
