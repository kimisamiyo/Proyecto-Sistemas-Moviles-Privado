import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
                <LinearGradient
                  colors={['#00C6FF', '#0072FF']}
                  style={styles.liveRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.avatar}>
                    {speaker?.profile?.avatar ? (
                      <Image source={{ uri: speaker.profile.avatar }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{initials}</Text>
                    )}
                  </View>
                </LinearGradient>
                <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>
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
  liveRing: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', padding: 2 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.surface_container_high, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { ...typography.title_md, color: colors.primary },
  liveBadge: { position: 'absolute', bottom: -2, right: 6, width: 22, height: 16, borderRadius: 4, backgroundColor: colors.live, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface },
  liveBadgeText: { fontSize: 8, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  speakerName: { ...typography.label_md, color: colors.on_surface, textAlign: 'center' },
});
