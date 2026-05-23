import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { colors, typography, spacing } from '../../theme/tokens';

export default function EventTabBar({ tabs, active, onChange }) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tabs.map((tab) => {
          const on = active === tab.id;
          return (
            <TouchableOpacity key={tab.id} onPress={() => onChange(tab.id)} style={styles.tab}>
              <Text style={[styles.label, on && styles.labelActive]}>{tab.label}</Text>
              {on ? <View style={styles.indicator} /> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.outline_variant,
    backgroundColor: colors.surface,
  },
  row: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  tab: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm, alignItems: 'center' },
  label: { ...typography.label_md, color: colors.on_surface_variant, fontSize: 13 },
  labelActive: { color: colors.primary, fontWeight: '600' },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: spacing.sm,
    right: spacing.sm,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});
