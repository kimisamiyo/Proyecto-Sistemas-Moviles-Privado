import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { COMMUNITY_THEMES, getCommunityTheme } from '../theme/communityThemes';

export default function CommunityFilterBar({ communities = [], selected, onSelect }) {
  const items = communities.length ? communities : Object.values(COMMUNITY_THEMES);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <TouchableOpacity
        style={[styles.chip, !selected && styles.chipActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.label, !selected && styles.labelActive]}>Todos</Text>
      </TouchableOpacity>
      {items.map((c) => {
        const slug = c.slug;
        const theme = getCommunityTheme(slug);
        const active = selected === slug;
        return (
          <TouchableOpacity
            key={slug}
            style={[
              styles.chip,
              active && { backgroundColor: theme.colors.primary_container, borderColor: theme.colors.primary },
            ]}
            onPress={() => onSelect(slug)}
          >
            <Ionicons name={theme.icon} size={14} color={active ? theme.colors.primary : colors.outline} />
            <Text style={[styles.label, active && { color: theme.colors.primary }]}>{c.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outline_variant,
    backgroundColor: colors.surface_container_high,
  },
  chipActive: { backgroundColor: colors.primary_container, borderColor: colors.primary },
  label: { ...typography.label_md, color: colors.outline, textTransform: 'none' },
  labelActive: { color: colors.primary },
});
