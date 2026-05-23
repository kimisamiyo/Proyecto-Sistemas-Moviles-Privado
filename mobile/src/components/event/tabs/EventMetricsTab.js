import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useEventusStore } from '../../../store/eventusStore';
import StatCard from '../../ui/StatCard';
import { colors, typography, spacing } from '../../../theme/tokens';

export default function EventMetricsTab({ eventId }) {
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  denied: { ...typography.body_md, color: colors.outline },
});
