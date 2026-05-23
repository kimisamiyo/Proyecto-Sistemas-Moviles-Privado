import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useEventusStore } from '../store/eventusStore';
import FadeInView from '../components/ui/FadeInView';
import { getCommunityTheme } from '../theme/communityThemes';

export default function OrganizerMetricsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { eventId, eventTitle } = route.params;
  const { metrics, fetchEventMetrics, isLoading } = useEventusStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEventMetrics(eventId).catch((e) => {
      Alert.alert('Acceso Restringido', e.message || 'Solo el organizador de este evento puede consultar métricas.');
      navigation.goBack();
    });
  }, [eventId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchEventMetrics(eventId);
    } catch {}
    setRefreshing(false);
  }, [eventId]);

  if (isLoading && !refreshing && !metrics) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const cTheme = getCommunityTheme(route.params.communitySlug);
  const accent = cTheme.colors?.primary || colors.primary;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.on_surface} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>PANEL DE MÉTRICAS</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{eventTitle}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {metrics && (
          <FadeInView style={styles.content}>
            {/* Aforo Circular Panel */}
            <View style={styles.capacityCard}>
              <View style={styles.capacityInfo}>
                <Text style={styles.capacityLabel}>LLENADO DE AFORO</Text>
                <Text style={styles.capacityVal}>{metrics.capacityFill}%</Text>
                <Text style={styles.capacitySub}>
                  {metrics.registrations} registrados de aforo máximo.
                </Text>
              </View>
              <View style={[styles.progressBarOuter, { borderColor: accent }]}>
                <View
                  style={[
                    styles.progressBarInner,
                    { width: `${Math.min(100, metrics.capacityFill)}%`, backgroundColor: accent },
                  ]}
                />
              </View>
            </View>

            {/* Metrics 2x3 Grid */}
            <Text style={styles.sectionTitle}>Interacciones del Evento</Text>
            <View style={styles.grid}>
              <View style={styles.gridCard}>
                <Ionicons name="eye-outline" size={20} color={colors.secondary} />
                <Text style={styles.gridVal}>{metrics.views || 0}</Text>
                <Text style={styles.gridLabel}>Vistas de Iniciativa</Text>
              </View>

              <View style={styles.gridCard}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.live} />
                <Text style={styles.gridVal}>{metrics.checkIns || 0}</Text>
                <Text style={styles.gridLabel}>Check-Ins Registrados</Text>
              </View>

              <View style={styles.gridCard}>
                <Ionicons name="share-social-outline" size={20} color={colors.secondary} />
                <Text style={styles.gridVal}>{metrics.shares || 0}</Text>
                <Text style={styles.gridLabel}>Compartidos</Text>
              </View>

              <View style={styles.gridCard}>
                <Ionicons name="chatbubbles-outline" size={20} color={colors.secondary} />
                <Text style={styles.gridVal}>{metrics.wallPosts || 0}</Text>
                <Text style={styles.gridLabel}>Posts en Muro</Text>
              </View>

              <View style={styles.gridCard}>
                <Ionicons name="images-outline" size={20} color={colors.secondary} />
                <Text style={styles.gridVal}>{metrics.albumPhotos || 0}</Text>
                <Text style={styles.gridLabel}>Fotos de Recuerdos</Text>
              </View>

              <View style={styles.gridCard}>
                <Ionicons name="people-outline" size={20} color={colors.secondary} />
                <Text style={styles.gridVal}>{metrics.matchGroups || 0}</Text>
                <Text style={styles.gridLabel}>Grupos de Afinidad</Text>
              </View>
            </View>

            {/* Impact Panel */}
            {metrics.impact ? (
              <View style={styles.impactCard}>
                <View style={styles.impactHeader}>
                  <Ionicons name="ribbon-outline" size={22} color={colors.primary} />
                  <Text style={styles.impactTitle}>Declaración de Impacto Social</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.impactInfoRow}>
                  <View style={styles.impactInfoCol}>
                    <Text style={styles.impactLabelText}>CATEGORÍA</Text>
                    <Text style={styles.impactValueText}>
                      {metrics.impact.category?.toUpperCase() || 'SOCIAL'}
                    </Text>
                  </View>
                  <View style={styles.impactInfoCol}>
                    <Text style={styles.impactLabelText}>BENEFICIARIOS</Text>
                    <Text style={styles.impactValueText}>
                      {metrics.impact.beneficiaries || 'Comunidad local'}
                    </Text>
                  </View>
                </View>

                {metrics.impact.volunteerHours > 0 ? (
                  <View style={styles.impactStat}>
                    <Text style={styles.impactStatVal}>{metrics.impact.volunteerHours} hrs</Text>
                    <Text style={styles.impactStatLabel}>de contribución voluntaria estimada.</Text>
                  </View>
                ) : null}

                {metrics.impact.goal ? (
                  <View style={styles.impactGoal}>
                    <Text style={styles.impactGoalLabel}>META DE LA INICIATIVA</Text>
                    <Text style={styles.impactGoalText}>{metrics.impact.goal}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </FadeInView>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface_container_high,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  headerLabel: { ...typography.label_sm, color: colors.outline, letterSpacing: 2 },
  headerTitle: { ...typography.display_sm, color: colors.on_surface },
  scroll: { paddingHorizontal: spacing.xl },
  content: { gap: spacing.xxl },
  capacityCard: {
    backgroundColor: colors.surface_container_high,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(193, 199, 207, 0.05)',
  },
  capacityInfo: { gap: 2 },
  capacityLabel: { ...typography.label_sm, color: colors.secondary, letterSpacing: 2 },
  capacityVal: { ...typography.display_lg, color: colors.on_surface },
  capacitySub: { ...typography.body_sm, color: colors.outline },
  progressBarOuter: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface_container_low,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridCard: {
    width: (Dimensions => (Dimensions.get('window').width - spacing.xl * 2 - spacing.md) / 2)(),
    backgroundColor: colors.surface_container_high,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(193, 199, 207, 0.03)',
  },
  gridVal: { ...typography.headline_lg, color: colors.on_surface, fontWeight: '700' },
  gridLabel: { ...typography.body_sm, color: colors.outline },
  impactCard: {
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(193, 199, 207, 0.06)',
  },
  impactHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  impactTitle: { ...typography.title_lg, color: colors.on_surface },
  divider: { height: 1, backgroundColor: colors.outline_variant, opacity: 0.5 },
  impactInfoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  impactInfoCol: { flex: 1, gap: 2 },
  impactLabelText: { ...typography.label_sm, color: colors.outline, fontSize: 8, letterSpacing: 1.5 },
  impactValueText: { ...typography.title_md, color: colors.on_surface },
  impactStat: { marginTop: spacing.md },
  impactStatVal: { ...typography.display_sm, color: colors.primary, fontWeight: '700' },
  impactStatLabel: { ...typography.body_sm, color: colors.secondary },
  impactGoal: { marginTop: spacing.sm, gap: 2 },
  impactGoalLabel: { ...typography.label_sm, color: colors.outline, fontSize: 8, letterSpacing: 1.5 },
  impactGoalText: { ...typography.body_md, color: colors.secondary, lineHeight: 20 },
});
