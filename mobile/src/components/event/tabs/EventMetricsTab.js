import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useEventusStore } from '../../../store/eventusStore';
import StatCard from '../../ui/StatCard';
import { colors, typography, spacing, radius } from '../../../theme/tokens';
import { openCheckInScanner } from '../../../utils/navigationHelpers';

export default function EventMetricsTab({ eventId, eventTitle }) {
  const navigation = useNavigation();
  const { metrics, fetchMetrics, metricsForbidden, isLoading } = useEventusStore();

  useEffect(() => {
    fetchMetrics(eventId);
  }, [eventId]);

  if (metricsForbidden) {
    return (
      <View style={styles.centered}>
        <Text style={styles.denied}>Solo el organizador puede ver métricas</Text>
      </View>
    );
  }

  if (isLoading && !metrics) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!metrics) {
    return (
      <View style={styles.centered}>
        <Text style={styles.denied}>Sin datos de métricas</Text>
      </View>
    );
  }

  const items = [
    { icon: 'eye-outline', label: 'Vistas', value: metrics.views },
    { icon: 'people-outline', label: 'Inscripciones', value: metrics.registrations },
    { icon: 'checkmark-circle-outline', label: 'Check-ins', value: metrics.checkIns },
    { icon: 'share-social-outline', label: 'Compartidos', value: metrics.shares },
    { icon: 'chatbubbles-outline', label: 'Posts muro', value: metrics.wallPosts },
    { icon: 'git-network-outline', label: 'Grupos', value: metrics.matchGroups },
    { icon: 'images-outline', label: 'Fotos álbum', value: metrics.albumPhotos },
    { icon: 'pie-chart-outline', label: '% cupo', value: `${metrics.capacityFill || 0}%` },
  ];

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Panel del organizador</Text>
      <TouchableOpacity
        style={styles.scanBtn}
        activeOpacity={0.85}
        onPress={() => openCheckInScanner(navigation, eventId, eventTitle)}
      >
        <Ionicons name="qr-code-outline" size={20} color={colors.on_primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.scanBtnTitle}>Escanear entradas</Text>
          <Text style={styles.scanBtnHint}>Valida QR dinámicos en la puerta (anti re-uso)</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.on_primary} />
      </TouchableOpacity>
      <View style={styles.grid}>
        {items.map((item) => (
          <StatCard key={item.label} icon={item.icon} label={item.label} value={String(item.value ?? 0)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.xl, paddingBottom: spacing.lg },
  centered: { padding: spacing.xxxl, alignItems: 'center' },
  title: { ...typography.headline_md, color: colors.primary, marginBottom: spacing.lg },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  scanBtnTitle: { ...typography.title_md, color: colors.on_primary },
  scanBtnHint: { ...typography.body_sm, color: 'rgba(255,255,255,0.8)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  denied: { ...typography.body_md, color: colors.outline },
});
