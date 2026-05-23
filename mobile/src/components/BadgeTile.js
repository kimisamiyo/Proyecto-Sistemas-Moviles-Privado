import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { getBadgeArt } from '../utils/images';

export default function BadgeTile({ badge, earned = true, size = 'md' }) {
  const [failed, setFailed] = useState(false);
  const meta = badge?.badge || badge;
  const name = meta?.name || badge?.slug || 'Insignia';
  const art = getBadgeArt(meta);
  const dim = size === 'lg' ? 100 : 88;

  return (
    <View
      style={[
        styles.cell,
        { width: dim, minHeight: dim + 28 },
        !earned && styles.locked,
      ]}
    >
      {earned && !failed ? (
        <Image
          source={{ uri: art }}
          style={[styles.art, { width: dim - 16, height: dim - 16 }]}
          onError={() => setFailed(true)}
        />
      ) : earned ? (
        <Ionicons name={meta?.icon || 'ribbon'} size={36} color={colors.primary} />
      ) : (
        <Ionicons name="lock-closed-outline" size={22} color={colors.outline} />
      )}
      <Text style={styles.name} numberOfLines={2}>
        {earned ? name : '???'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary_container,
    borderRadius: radius.xl,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface_container_high,
  },
  locked: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: colors.outline_variant,
  },
  art: { borderRadius: radius.lg, marginBottom: spacing.xs },
  name: {
    ...typography.label_sm,
    color: colors.on_surface,
    textAlign: 'center',
    marginTop: spacing.xs,
    textTransform: 'none',
  },
});
