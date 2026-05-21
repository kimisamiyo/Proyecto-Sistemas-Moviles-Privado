import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';

const FEATURES = [
  { icon: 'locate-outline', key: 'radar', label: 'Radar de eventos' },
  { icon: 'people-outline', key: 'match', label: 'Matchmaking' },
  { icon: 'qr-code-outline', key: 'qr', label: 'QR dinámico' },
  { icon: 'chatbubbles-outline', key: 'wall', label: 'Muro comunidad' },
  { icon: 'ribbon-outline', key: 'badges', label: 'Insignias' },
  { icon: 'logo-whatsapp', key: 'wa', label: 'Invitar WhatsApp' },
  { icon: 'create-outline', key: 'creator', label: 'Modo creador' },
  { icon: 'images-outline', key: 'album', label: 'Álbum colaborativo' },
  { icon: 'stats-chart-outline', key: 'metrics', label: 'Panel métricas' },
];

export default function EventUsFeatures({ accentColor = colors.primary }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {FEATURES.map((f) => (
        <View key={f.key} style={[styles.pill, { borderColor: accentColor }]}>
          <Ionicons name={f.icon} size={14} color={accentColor} />
          <Text style={[styles.text, { color: colors.on_surface }]}>{f.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: colors.surface_container_high,
  },
  text: { ...typography.label_md, textTransform: 'none' },
});
