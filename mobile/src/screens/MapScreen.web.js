import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { getCommunityTheme } from '../theme/communityThemes';
import { useEventStore } from '../store/eventStore';
import { useSquadStore } from '../store/squadStore';
import { useLanguageStore } from '../store/languageStore';
import SquadsStrip from '../components/SquadsStrip';
import MapEventCard from '../components/map/MapEventCard';
import config from '../config';
import client from '../api/client';
import { openEventDetail } from '../utils/navigationHelpers';

const RADAR_POLL_MS = 15000;

function RadarPulse({ style }) {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    const a1 = createPulse(pulse1, 0);
    const a2 = createPulse(pulse2, 600);
    const a3 = createPulse(pulse3, 1200);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  const renderRing = (anim) => {
    const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
    return (
      <Animated.View
        style={[styles.radarRing, style, { transform: [{ scale }], opacity }]}
      />
    );
  };

  return (
    <View style={[styles.radarContainer, style]}>
      {renderRing(pulse1)}
      {renderRing(pulse2)}
      {renderRing(pulse3)}
      <View style={styles.radarCenter} />
    </View>
  );
}

export default function MapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { events, fetchAllEvents, fetchRadar } = useEventStore();
  const openSquads = useSquadStore((s) => s.openSquads);
  const fetchOpenSquads = useSquadStore((s) => s.fetchOpenSquads);
  const { t } = useLanguageStore();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [radarActive, setRadarActive] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const locationRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchAllEvents();
    fetchOpenSquads();
    activateRadar();
  }, []);

  const runRadarSweep = useCallback(async () => {
    const loc = locationRef.current;
    if (!loc) return;
    const data = await fetchRadar(loc.longitude, loc.latitude, config.RADAR_RADIUS);
    setNearbyEvents(data.nearbyEvents || []);
  }, [fetchRadar]);

  useEffect(() => {
    if (!radarActive) return undefined;
    runRadarSweep();
    pollRef.current = setInterval(runRadarSweep, RADAR_POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [radarActive, runRadarSweep]);

  const activateRadar = async () => {
    setLocationLoading(true);
    let newLoc = {
      latitude: config.DEFAULT_LOCATION.latitude,
      longitude: config.DEFAULT_LOCATION.longitude,
    };
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        newLoc = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      }
    } catch {
      // ubicación por defecto
    }
    locationRef.current = newLoc;
    client
      .put('/auth/location', { longitude: newLoc.longitude, latitude: newLoc.latitude })
      .catch(() => {});
    setRadarActive(true);
    setLocationLoading(false);
  };

  const displayEvents = radarActive && nearbyEvents.length ? nearbyEvents : events;

  const handleOpenEvent = () => {
    if (!selectedEvent) return;
    const id = selectedEvent._id;
    setSelectedEvent(null);
    openEventDetail(navigation, id);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>{t.map.headerLabel}</Text>
        <Text style={styles.headerTitle}>{t.map.headerTitle}</Text>
        <Text style={styles.webHint}>
          {t.map?.webPreviewHint ?? 'Vista web: mapa interactivo como lista. En móvil verás el mapa nativo.'}
        </Text>
      </View>

      {locationLoading ? (
        <View style={styles.loadingWrap}>
          <RadarPulse style={{ width: 140, height: 140 }} />
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          <Text style={styles.radarHint}>{t.map.locating || 'Localizando…'}</Text>
        </View>
      ) : (
        <ScrollView style={styles.fallback} contentContainerStyle={styles.fallbackContent}>
          <View style={styles.radarStatusBar}>
            <View style={styles.radarDot} />
            <Text style={styles.radarStatusText}>{t.map.radarActive}</Text>
            <Text style={styles.radarCounts}>
              {nearbyEvents.length} eventos cerca · radio {config.RADAR_RADIUS / 1000} km
            </Text>
          </View>

          <SquadsStrip
            squads={openSquads}
            compact
            title="Escuadras activas cerca"
            subtitle="Únete en grupo"
          />

          <Text style={styles.fallbackTitle}>{t.map.nearbyEvents}</Text>
          <View style={styles.eventList}>
            {displayEvents.map((event) => {
              const theme = getCommunityTheme(event.metadata?.communitySlug);
              const isSelected = selectedEvent?._id === event._id;
              return (
                <TouchableOpacity
                  key={event._id}
                  style={[
                    styles.eventItem,
                    isSelected && { borderColor: theme.colors.primary, borderWidth: 2 },
                  ]}
                  onPress={() => setSelectedEvent(event)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.eventPinIcon, { backgroundColor: `${theme.colors.primary}22` }]}>
                    <Ionicons name={theme.icon} size={16} color={theme.colors.primary} />
                  </View>
                  <View style={styles.eventItemInfo}>
                    <Text style={styles.eventItemTitle} numberOfLines={1}>{event.metadata?.title}</Text>
                    <Text style={styles.eventItemVenue} numberOfLines={1}>{event.location?.venue}</Text>
                  </View>
                  {(event.isLive || event.schedulePhase === 'live') && <View style={styles.liveDot} />}
                  <Ionicons name="chevron-forward" size={18} color={colors.outline} />
                </TouchableOpacity>
              );
            })}
            {!displayEvents.length ? (
              <Text style={styles.emptyText}>No hay eventos en tu zona. Prueba ampliar el radio o explora Eventos.</Text>
            ) : null}
          </View>
        </ScrollView>
      )}

      {selectedEvent ? (
        <View style={styles.floatingCard}>
          <MapEventCard
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onOpen={handleOpenEvent}
            t={t}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  headerLabel: { ...typography.label_sm, color: colors.primary, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { ...typography.display_sm, color: colors.on_surface },
  webHint: { ...typography.body_sm, color: colors.outline, marginTop: spacing.sm },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  radarContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  radarRing: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  radarCenter: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary },
  radarHint: { ...typography.body_sm, color: colors.outline, marginTop: spacing.lg, textAlign: 'center' },
  radarStatusBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap',
    backgroundColor: colors.surface_container_low,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.outline_variant,
  },
  radarDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  radarStatusText: { ...typography.label_md, color: colors.live },
  radarCounts: { ...typography.body_sm, color: colors.on_surface_variant },
  fallback: { flex: 1 },
  fallbackContent: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  fallbackTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.lg },
  eventList: { gap: spacing.sm },
  eventItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface_container_lowest, borderRadius: radius.lg,
    padding: spacing.lg, gap: spacing.md,
    borderWidth: 1, borderColor: colors.outline_variant,
  },
  eventPinIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  eventItemInfo: { flex: 1, gap: 2 },
  eventItemTitle: { ...typography.title_md, color: colors.on_surface },
  eventItemVenue: { ...typography.body_sm, color: colors.outline },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  emptyText: { ...typography.body_md, color: colors.outline, textAlign: 'center', marginTop: spacing.xl },
  floatingCard: { position: 'absolute', bottom: 100, left: spacing.lg, right: spacing.lg },
});
