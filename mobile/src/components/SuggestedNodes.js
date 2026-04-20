import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useLanguageStore } from '../store/languageStore';

export default function SuggestedNodes({ suggestions = [], onConnect, t: tProp }) {
  const { t: tStore } = useLanguageStore();
  const t = tProp || tStore;
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t.messages.suggestedConnections}</Text>
      <View style={styles.list}>
        {suggestions.slice(0, 5).map((user) => {
          const initials = `${user.profile?.firstName?.[0] || ''}${user.profile?.lastName?.[0] || ''}`;
          return (
            <View key={user._id} style={styles.nodeCard}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
              <View style={styles.info}>
                <Text style={styles.name}>{user.profile?.firstName} {user.profile?.lastName}</Text>
                <Text style={styles.title} numberOfLines={1}>{user.profile?.title || 'Académico'}</Text>
              </View>
              <TouchableOpacity style={styles.connectButton} onPress={() => onConnect?.(user._id)} activeOpacity={0.7}>
                <Ionicons name="add" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xxl },
  sectionTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.lg },
  list: { gap: spacing.lg },
  nodeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface_container_highest, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.title_md, color: colors.primary, fontSize: 13 },
  info: { flex: 1, gap: 2 },
  name: { ...typography.title_md, color: colors.on_surface },
  title: { ...typography.body_sm, color: colors.secondary },
  connectButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(118, 117, 117, 0.2)', alignItems: 'center', justifyContent: 'center' },
});
