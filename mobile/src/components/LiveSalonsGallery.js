import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useLanguageStore } from '../store/languageStore';

export default function LiveSalonsGallery({ liveEvents = [], onPress }) {
  const { t } = useLanguageStore();
  if (liveEvents.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t.feed.liveSalons}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {liveEvents.map((event) => {
          const speaker = event.speakers?.[0]?.userId;
          const initials = speaker ? `${speaker.profile?.firstName?.[0] || ''}${speaker.profile?.lastName?.[0] || ''}` : '?';
          return (
            <TouchableOpacity key={event._id} style={styles.salonItem} onPress={() => onPress?.(event)} activeOpacity={0.8}>
              <View style={styles.avatarContainer}>
                <View style={styles.liveRing}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
                </View>
                <View style={styles.liveBadge}><View style={styles.liveDot} /></View>
              </View>
              <Text style={styles.speakerName} numberOfLines={1}>{speaker ? speaker.profile?.firstName : 'En Vivo'}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.lg, paddingHorizontal: spacing.xl },
  scrollContent: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  salonItem: { alignItems: 'center', width: 72 },
  avatarContainer: { position: 'relative', marginBottom: spacing.sm },
  liveRing: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: colors.live, alignItems: 'center', justifyContent: 'center', padding: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface_container_high, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.title_md, color: colors.primary },
  liveBadge: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.live },
  speakerName: { ...typography.label_md, color: colors.secondary, textAlign: 'center' },
});
