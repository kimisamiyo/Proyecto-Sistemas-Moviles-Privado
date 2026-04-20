import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useLanguageStore } from '../store/languageStore';

export default function KeynoteList({ speakers = [], t: tProp }) {
  const { t: tStore } = useLanguageStore();
  const t = tProp || tStore;
  if (speakers.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t.eventDetail.keynoteSpeakers}</Text>
      <View style={styles.list}>
        {speakers.map((speaker, index) => {
          const user = speaker.userId;
          if (!user) return null;
          const initials = `${user.profile?.firstName?.[0] || ''}${user.profile?.lastName?.[0] || ''}`;
          return (
            <View key={index} style={styles.speakerItem}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
              <View style={styles.info}>
                <Text style={styles.name}>{user.profile?.firstName} {user.profile?.lastName}</Text>
                <Text style={styles.title} numberOfLines={1}>{user.profile?.title || speaker.role}</Text>
              </View>
              <View style={styles.roleBadge}><Text style={styles.roleText}>{speaker.role}</Text></View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.xxl },
  sectionTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.lg },
  list: { gap: spacing.lg },
  speakerItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface_container_highest, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.title_md, color: colors.primary },
  info: { flex: 1, gap: 2 },
  name: { ...typography.title_md, color: colors.on_surface },
  title: { ...typography.body_sm, color: colors.secondary },
  roleBadge: { backgroundColor: colors.surface_container_high, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  roleText: { ...typography.label_sm, color: colors.secondary, fontSize: 9 },
});
