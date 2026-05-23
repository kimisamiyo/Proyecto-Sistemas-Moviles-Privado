import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../ui/AppButton';
import { colors, typography, spacing, radius } from '../../theme/tokens';

export default function LockedSectionGate({ title, message, onConfirm }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="lock-closed-outline" size={40} color={colors.outline} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onConfirm ? (
        <AppButton title="Confirmar asistencia" onPress={onConfirm} style={{ alignSelf: 'stretch' }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
    margin: spacing.lg,
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outline_variant,
  },
  title: { ...typography.title_lg, color: colors.on_surface, textAlign: 'center' },
  message: { ...typography.body_md, color: colors.on_surface_variant, textAlign: 'center' },
});
