import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useLanguageStore } from '../store/languageStore';

export default function DirectCorrespondence({ conversations = [], onPress, t: tProp }) {
  const { t: tStore } = useLanguageStore();
  const t = tProp || tStore;
  if (conversations.length === 0) return null;

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${t.messages.ago} ${mins} ${t.messages.minutes}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${t.messages.ago} ${hours} ${t.messages.hours}`;
    return date.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t.messages.directCorrespondence}</Text>
      <View style={styles.list}>
        {conversations.map((convo) => {
          const user = convo.user;
          const initials = user ? `${user.profile?.firstName?.[0] || ''}${user.profile?.lastName?.[0] || ''}` : '?';
          return (
            <TouchableOpacity key={convo.userId} style={styles.convoItem} onPress={() => onPress?.(convo)} activeOpacity={0.85}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
                {convo.unread > 0 && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.convoInfo}>
                <View style={styles.convoHeader}>
                  <Text style={styles.convoName} numberOfLines={1}>{user?.profile?.firstName} {user?.profile?.lastName}</Text>
                  <Text style={styles.convoTime}>{formatTime(convo.lastTimestamp)}</Text>
                </View>
                <Text style={styles.convoMessage} numberOfLines={1}>{convo.lastMessage}</Text>
              </View>
            </TouchableOpacity>
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
  convoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface_container_highest, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { ...typography.title_md, color: colors.primary, fontSize: 13 },
  unreadDot: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.surface },
  convoInfo: { flex: 1, gap: 4 },
  convoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convoName: { ...typography.title_md, color: colors.on_surface, flex: 1 },
  convoTime: { ...typography.label_sm, color: colors.outline, fontSize: 10, textTransform: 'none' },
  convoMessage: { ...typography.body_md, color: colors.outline },
});
