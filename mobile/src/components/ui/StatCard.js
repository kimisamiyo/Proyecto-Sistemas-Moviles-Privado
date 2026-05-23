import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, spacing, shadows } from '../../theme/tokens';

export default function StatCard({ icon, label, value, style }) {
  return (
    <View style={[styles.card, style]}>
      {icon ? (
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
      ) : null}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    maxWidth: '48%',
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface_container_high,
    ...shadows.ambient,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary_fixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    ...typography.headline_md,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.label_md,
    color: colors.on_surface_variant,
  },
});
