import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radius } from '../theme/tokens';
import { getCommunityTheme } from '../theme/communityThemes';

export default function CommunityChip({ slug, size = 'md', style }) {
  const theme = getCommunityTheme(slug);
  const c = theme.colors;
  const isSmall = size === 'sm';

  return (
    <View style={[styles.chip, { backgroundColor: c.primary_container, borderColor: c.primary }, style]}>
      <Ionicons name={theme.icon} size={isSmall ? 12 : 14} color={c.primary} />
      <Text style={[isSmall ? styles.labelSm : styles.label, { color: c.primary }]}>
        {theme.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  label: { ...typography.label_sm, textTransform: 'none', letterSpacing: 0.3 },
  labelSm: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
});
