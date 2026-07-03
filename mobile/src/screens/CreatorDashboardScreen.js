import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEventusStore } from '../store/eventusStore';
import { getCommunityTheme } from '../theme/communityThemes';
import resolveMediaUrl from '../utils/resolveMediaUrl';
import { colors, typography, spacing, radius, shadows } from '../theme/tokens';
import { navigateToAppScreen, openEventDetail } from '../utils/navigationHelpers';

function KpiCard({ icon, label, value, accent }) {
  return (
    <View style={styles.kpi}>
      <View style={[styles.kpiIcon, accent && { backgroundColor: accent }]}>
        <Ionicons name={icon} size={18} color={accent ? '#fff' : colors.primary} />
      </View>
      <Text style={styles.kpiValue}>{value ?? 0}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function FillBar({ pct }) {
  return (
    <View style={styles.fillTrack}>
      <View
        style={[
          styles.fillBar,
          { width: `${Math.min(pct, 100)}%` },
          pct >= 90 && { backgroundColor: colors.live },
        ]}
      />
    </View>
  );
}

export default function CreatorDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { creatorDashboard, fetchCreatorDashboard } = useEventusStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCreatorDashboard();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCreatorDashboard();
    setRefreshing(false);
  }, []);

  const totals = creatorDashboard?.totals;
  const events = creatorDashboard?.events || [];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.on_surface} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerLabel}>MODO CREADOR</Text>
          <Text style={styles.headerTitle}>Panel de métricas</Text>
        </View>
      </View>

      {!creatorDashboard ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[colors.primary, '#274c54']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroLabel}>IMPACTO TOTAL</Text>
            <View style={styles.heroRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroValue}>{totals?.eventsPublished ?? 0}</Text>
                <Text style={styles.heroStatLabel}>Iniciativas</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroValue}>{totals?.registrations ?? 0}</Text>
                <Text style={styles.heroStatLabel}>Inscritos</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroValue}>{totals?.attendanceRate ?? 0}%</Text>
                <Text style={styles.heroStatLabel}>Asistencia</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.kpiGrid}>
            <KpiCard icon="checkmark-circle" label="Check-ins" value={totals?.checkIns} accent={colors.live} />
            <KpiCard icon="eye" label="Vistas" value={totals?.views} />
            <KpiCard icon="share-social" label="Compartidos" value={totals?.shares} />
            <KpiCard icon="chatbubbles" label="Posts en muros" value={totals?.wallPosts} />
            <KpiCard icon="git-network" label="Grupos formados" value={totals?.matchGroupsFormed} />
            <KpiCard icon="images" label="Fotos en álbumes" value={totals?.albumPhotos} />
          </View>

          <Text style={styles.sectionTitle}>Tus iniciativas</Text>
          {events.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="rocket-outline" size={32} color={colors.outline} />
              <Text style={styles.emptyText}>
                Aún no publicas iniciativas. Crea tu primer evento y mide tu impacto aquí.
              </Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigateToAppScreen(navigation, 'CreateEvent')}
              >
                <Ionicons name="add" size={18} color={colors.on_primary} />
                <Text style={styles.createBtnText}>Publicar iniciativa</Text>
              </TouchableOpacity>
            </View>
          ) : (
            events.map((ev) => {
              const theme = getCommunityTheme(ev.communitySlug);
              return (
                <TouchableOpacity
                  key={ev._id}
                  style={styles.eventCard}
                  activeOpacity={0.85}
                  onPress={() => openEventDetail(navigation, ev._id)}
                >
                  <Image
                    source={{ uri: resolveMediaUrl(ev.coverImage) }}
                    style={styles.eventCover}
                  />
                  <View style={styles.eventBody}>
                    <View style={styles.eventHead}>
                      <Text style={[styles.eventCommunity, { color: theme?.primary || colors.primary }]}>
                        {ev.communitySlug?.replace('_', ' ').toUpperCase()}
                      </Text>
                      <Text style={styles.eventDate}>
                        {new Date(ev.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                    <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                    <View style={styles.eventMetaRow}>
                      <View style={styles.metaChip}>
                        <Ionicons name="people-outline" size={13} color={colors.on_surface_variant} />
                        <Text style={styles.metaText}>
                          {ev.capacity?.current ?? 0}/{ev.capacity?.max ?? 0}
                        </Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Ionicons name="checkmark-circle-outline" size={13} color={colors.on_surface_variant} />
                        <Text style={styles.metaText}>{ev.metrics?.checkIns ?? 0} check-ins</Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Ionicons name="share-social-outline" size={13} color={colors.on_surface_variant} />
                        <Text style={styles.metaText}>{ev.metrics?.shares ?? 0}</Text>
                      </View>
                    </View>
                    <FillBar pct={ev.capacityFill || 0} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface_container,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: { ...typography.label_sm, color: colors.primary, letterSpacing: 2 },
  headerTitle: { ...typography.display_sm, color: colors.on_surface },
  heroCard: {
    marginHorizontal: spacing.xl,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    ...shadows.float,
  },
  heroLabel: { ...typography.label_sm, color: 'rgba(255,255,255,0.75)', letterSpacing: 2, marginBottom: spacing.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' },
  heroValue: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroStatLabel: { ...typography.label_md, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  kpi: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface_container_high,
    gap: 4,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary_fixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kpiValue: { ...typography.headline_lg, color: colors.on_surface },
  kpiLabel: { ...typography.label_md, color: colors.on_surface_variant },
  sectionTitle: {
    ...typography.headline_md,
    color: colors.on_surface,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  emptyBox: {
    marginHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.xl,
  },
  emptyText: { ...typography.body_md, color: colors.on_surface_variant, textAlign: 'center' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  createBtnText: { ...typography.label_lg, color: colors.on_primary, fontWeight: '700' },
  eventCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surface_container_high,
    overflow: 'hidden',
    ...shadows.ambient,
  },
  eventCover: { width: 86, height: '100%', backgroundColor: colors.surface_container_high },
  eventBody: { flex: 1, padding: spacing.lg, gap: 6 },
  eventHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventCommunity: { ...typography.label_sm, letterSpacing: 1.2 },
  eventDate: { ...typography.label_md, color: colors.on_surface_variant },
  eventTitle: { ...typography.title_lg, color: colors.on_surface },
  eventMetaRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { ...typography.body_sm, color: colors.on_surface_variant },
  fillTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface_container_highest,
    overflow: 'hidden',
    marginTop: 2,
  },
  fillBar: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
});
