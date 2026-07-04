import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useLanguageStore } from '../store/languageStore';

export default function RegistrationAction({ onRegister, isRegistered = false, t: tProp }) {
  const { t: tStore } = useLanguageStore();
  const t = tProp || tStore;
  const handlePress = async () => {
    if (isRegistered) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onRegister?.();
  };

  if (isRegistered) {
    return (
      <TouchableOpacity style={styles.registeredButton} activeOpacity={1}>
        <Text style={styles.registeredIcon}>✓</Text>
        <Text style={styles.registeredText}>{t.eventDetail.registered}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <LinearGradient
        colors={[colors.primary, colors.primary_container]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{t.eventDetail.registerButton}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl },
  buttonText: { ...typography.label_lg, color: colors.on_primary, fontWeight: '700' },
  registeredButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.surface_container_highest, borderRadius: radius.md, paddingVertical: 16, marginTop: spacing.xl,
  },
  registeredIcon: { color: colors.live, fontSize: 16, fontWeight: '700' },
  registeredText: { ...typography.label_lg, color: colors.live },
});
