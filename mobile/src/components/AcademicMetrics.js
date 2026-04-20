import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useLanguageStore } from '../store/languageStore';

const METRICS_MAP = {
  citations: { icon: 'document-text-outline' },
  contributions: { icon: 'git-branch-outline' },
  connections: { icon: 'people-outline' },
  eventsAttended: { icon: 'calendar-outline' },
};

export default function AcademicMetrics({ metrics = {}, t: tProp }) {
  const { t: tStore } = useLanguageStore();
  const t = tProp || tStore;

  const METRICS = [
    { key: 'citations', label: t.profile.citations, icon: 'document-text-outline' },
    { key: 'contributions', label: t.profile.contributions, icon: 'git-branch-outline' },
    { key: 'connections', label: t.profile.connections, icon: 'people-outline' },
    { key: 'eventsAttended', label: t.profile.eventsAttended, icon: 'calendar-outline' },
  ];

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t.profile.academicWallet}</Text>
      <View style={styles.grid}>
        {METRICS.map((m) => (
          <View key={m.key} style={styles.metricCard}>
            <Ionicons name={m.icon} size={18} color={colors.secondary} />
            <Text style={styles.metricValue}>{formatNumber(metrics[m.key])}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xxl },
  sectionTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metricCard: { width: '47%', backgroundColor: colors.surface_container_high, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  metricValue: { ...typography.display_sm, color: colors.on_surface, marginTop: spacing.xs },
  metricLabel: { ...typography.label_sm, color: colors.outline, fontSize: 9, letterSpacing: 1.5 },
});
