import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';

export default function IdentityHeader({ user }) {
  if (!user) return null;

  const initials = `${user.profile?.firstName?.[0] || ''}${user.profile?.lastName?.[0] || ''}`;
  const hasVerified = user.credentials?.some(c => c.verified);

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {hasVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          </View>
        )}
      </View>

      <Text style={styles.name}>
        {user.profile?.firstName} {user.profile?.lastName}
      </Text>

      {user.profile?.title ? (
        <Text style={styles.title}>{user.profile.title}</Text>
      ) : null}

      {user.profile?.bio ? (
        <Text style={styles.bio} numberOfLines={3}>{user.profile.bio}</Text>
      ) : null}

      {user.profile?.disciplines?.length > 0 && (
        <View style={styles.disciplines}>
          {user.profile.disciplines.slice(0, 4).map((d, i) => (
            <View key={i} style={styles.disciplineTag}>
              <Text style={styles.disciplineText}>{d}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface_container_highest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    padding: 2,
  },
  name: {
    ...typography.display_sm,
    color: colors.on_surface,
    textAlign: 'center',
  },
  title: {
    ...typography.body_lg,
    color: colors.secondary,
    textAlign: 'center',
  },
  bio: {
    ...typography.body_md,
    color: colors.outline,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  disciplines: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  disciplineTag: {
    backgroundColor: colors.surface_container_high,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  disciplineText: {
    ...typography.label_md,
    color: colors.secondary,
  },
});
