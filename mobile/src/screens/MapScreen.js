import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import MapView, { Marker, Circle } from 'react-native-maps';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { getCommunityTheme } from '../theme/communityThemes';
import { useEventStore } from '../store/eventStore';
import { useLanguageStore } from '../store/languageStore';
import config from '../config';
import client from '../api/client';
import { smokeMapStyle } from '../utils/mapStyles';
import AvatarImage from '../components/ui/AvatarImage';
import MapEventCard from '../components/map/MapEventCard';
import { openEventDetail, openPublicProfile } from '../utils/navigationHelpers';

const RADAR_POLL_MS = 15000;

function EventPin({ event, selected, inRadar }) {
  const theme = getCommunityTheme(event.metadata?.communitySlug);
  const pinColor = event.isLive || event.schedulePhase === 'live'
    ? colors.live
    : theme?.colors?.primary || colors.primary;

  return (
    <View style={[styles.pinWrap, selected && styles.pinSelected]}>
      <View style={[styles.pinHead, { backgroundColor: pinColor }, inRadar && styles.pinNearby]}>
        <Ionicons
          name={theme?.icon || 'location'}
          size={14}
          color="#fff"
        />
      </View>
      <View style={[styles.pinTail, { borderTopColor: pinColor }]} />
      {event.isLive || event.schedulePhase === 'live' ? (
        <View style={styles.pinLiveBadge}>
          <Text style={styles.pinLiveText}>LIVE</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function MapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { events, fetchAllEvents, fetchRadar } = useEventStore();
  const { t } = useLanguageStore();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [radarActive, setRadarActive] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [communityFilter, setCommunityFilter] = useState(null);
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const mapRef = useRef(null);
  const pollRef = useRef(null);
  const locationRef = useRef(null);
  const initRef = useRef(false);

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const runRadarSweep = useCallback(async () => {
    const loc = locationRef.current;
    if (!loc) return;
    const data = await fetchRadar(loc.longitude, loc.latitude, config.RADAR_RADIUS);
    setNearbyEvents(data.nearbyEvents || []);
    setNearbyUsers(data.nearbyUsers || []);
  }, [fetchRadar]);

  useEffect(() => {
    if (!radarActive) return undefined;
    runRadarSweep();
    pollRef.current = setInterval(runRadarSweep, RADAR_POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [radarActive, runRadarSweep]);

  const activateRadar = useCallback(async () => {
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
      // GPS falló: ubicación por defecto
    }
    setUserLocation(newLoc);
    locationRef.current = newLoc;
    client
      .put('/auth/location', { longitude: newLoc.longitude, latitude: newLoc.latitude })
      .catch(() => {});
    setRadarActive(true);
    setLocationLoading(false);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...newLoc,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 800);
    }
  }, []);

  // Auto-activar radar al abrir el mapa
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    activateRadar();
  }, [activateRadar]);

  const visibleEvents = useMemo(() => {
    if (!communityFilter) return events;
    return events.filter((e) => e.metadata?.communitySlug === communityFilter);
  }, [events, communityFilter]);

  const communitySlugs = useMemo(() => {
    const set = new Set(events.map((e) => e.metadata?.communitySlug).filter(Boolean));
    return Array.from(set);
  }, [events]);

  const nearbyEventIds = useMemo(
    () => new Set(nearbyEvents.map((e) => String(e._id))),
    [nearbyEvents]
  );

  const eventCoordinates = useMemo(
    () =>
      visibleEvents
        .map((event) => {
          const coords = event.location?.coordinates?.coordinates;
          if (!coords || coords.length < 2) return null;
          return { latitude: coords[1], longitude: coords[0] };
        })
        .filter(Boolean),
    [visibleEvents]
  );

  const fitAllMarkers = useCallback(() => {
    if (!mapRef.current || !eventCoordinates.length) return;
    if (userLocation) {
      mapRef.current.fitToCoordinates(
        [...eventCoordinates, userLocation],
        { edgePadding: { top: 120, right: 40, bottom: 180, left: 40 }, animated: true }
      );
    } else {
      mapRef.current.fitToCoordinates(eventCoordinates, {
        edgePadding: { top: 120, right: 40, bottom: 180, left: 40 },
        animated: true,
      });
    }
  }, [eventCoordinates, userLocation]);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    const coords = event.location?.coordinates?.coordinates;
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coords[1],
        longitude: coords[0],
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }, 500);
    }
  }, []);

  const handleOpenEvent = useCallback(() => {
    if (!selectedEvent) return;
    const id = selectedEvent._id;
    setSelectedEvent(null);
    openEventDetail(navigation, id);
  }, [navigation, selectedEvent]);

  const recenterOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      }, 600);
    } else {
      activateRadar();
    }
  }, [userLocation, activateRadar]);

  const initialRegion = {
    latitude: config.DEFAULT_LOCATION.latitude,
    longitude: config.DEFAULT_LOCATION.longitude,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  const displayNearby = radarActive ? nearbyEvents : visibleEvents.slice(0, 8);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        customMapStyle={smokeMapStyle}
        showsUserLocation={radarActive}
        showsMyLocationButton={false}
        showsCompass={false}
        scrollEnabled
        zoomEnabled
        rotateEnabled
        pitchEnabled={false}
        onMapReady={fitAllMarkers}
        onPress={() => setSelectedEvent(null)}
      >
        {visibleEvents.map((event) => {
          const coords = event.location?.coordinates?.coordinates;
          if (!coords || coords.length < 2) return null;
          const isSelected = selectedEvent?._id === event._id;
          const inRadar = radarActive && nearbyEventIds.has(String(event._id));
          return (
            <Marker
              key={event._id}
              coordinate={{ latitude: coords[1], longitude: coords[0] }}
              onPress={(e) => {
                e.stopPropagation?.();
                handleSelectEvent(event);
              }}
              tracksViewChanges={false}
              zIndex={isSelected ? 999 : inRadar ? 100 : 1}
            >
              <EventPin event={event} selected={isSelected} inRadar={inRadar} />
            </Marker>
          );
        })}

        {radarActive &&
          nearbyUsers.map((person) => {
            const coords = person.location?.coordinates;
            if (!coords || coords.length < 2) return null;
            return (
              <Marker
                key={person._id}
                coordinate={{ latitude: coords[1], longitude: coords[0] }}
                onPress={(e) => {
                  e.stopPropagation?.();
                  openPublicProfile(navigation, person._id);
                }}
                tracksViewChanges={false}
              >
                <View style={styles.personMarker}>
                  <AvatarImage
                    uri={person.profile?.avatar}
                    initials={`${person.profile?.firstName?.[0] || ''}${person.profile?.lastName?.[0] || ''}` || '?'}
                    size={32}
                  />
                </View>
              </Marker>
            );
          })}

        {radarActive && userLocation && (
          <Circle
            center={userLocation}
            radius={config.RADAR_RADIUS}
            fillColor="rgba(63, 100, 108, 0.08)"
            strokeColor="rgba(63, 100, 108, 0.35)"
            strokeWidth={1.5}
          />
        )}
      </MapView>

      {/* Header */}
      <View style={[styles.mapHeader, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerLabel}>{t.map.headerLabel}</Text>
        <Text style={styles.headerTitle}>{t.map.headerTitle}</Text>
      </View>

      {/* Filtros por comunidad */}
      {communitySlugs.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.filterBar, { top: insets.top + 72 }]}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, !communityFilter && styles.filterChipActive]}
            onPress={() => setCommunityFilter(null)}
          >
            <Text style={[styles.filterText, !communityFilter && styles.filterTextActive]}>Todos</Text>
          </TouchableOpacity>
          {communitySlugs.map((slug) => {
            const theme = getCommunityTheme(slug);
            const active = communityFilter === slug;
            return (
              <TouchableOpacity
                key={slug}
                style={[styles.filterChip, active && { backgroundColor: theme.colors.primary }]}
                onPress={() => setCommunityFilter(active ? null : slug)}
              >
                <Ionicons name={theme.icon} size={14} color={active ? '#fff' : colors.outline} />
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {theme.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Estado radar */}
      <View style={[styles.radarStatusFloat, { top: insets.top + (communitySlugs.length > 1 ? 118 : 72) }]}>
        {locationLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : radarActive ? (
          <>
            <View style={styles.radarDot} />
            <Text style={styles.radarStatusText}>{t.map.radarActive}</Text>
            <Text style={styles.radarCounts}>
              {nearbyEvents.length} eventos · {nearbyUsers.length} personas
            </Text>
          </>
        ) : (
          <TouchableOpacity style={styles.reactivateRow} onPress={activateRadar}>
            <Ionicons name="radio-outline" size={16} color={colors.primary} />
            <Text style={styles.reactivateText}>{t.map.activateRadar}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Controles flotantes */}
      <View style={[styles.mapControls, { bottom: selectedEvent ? 280 : 120 }]}>
        <TouchableOpacity style={styles.controlBtn} onPress={recenterOnUser} activeOpacity={0.85}>
          <Ionicons name="locate" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={fitAllMarkers} activeOpacity={0.85}>
          <Ionicons name="scan-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Lista horizontal de eventos cercanos */}
      {!selectedEvent && displayNearby.length > 0 ? (
        <View style={styles.nearbyStrip}>
          <Text style={styles.nearbyLabel}>
            {radarActive ? t.map.nearbyEvents : 'Eventos en el mapa'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyScroll}>
            {displayNearby.map((event) => {
              const theme = getCommunityTheme(event.metadata?.communitySlug);
              const isSelected = selectedEvent?._id === event._id;
              return (
                <TouchableOpacity
                  key={event._id}
                  style={[styles.nearbyChip, isSelected && { borderColor: theme.colors.primary }]}
                  onPress={() => handleSelectEvent(event)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={theme.icon} size={14} color={theme.colors.primary} />
                  <Text style={styles.nearbyChipText} numberOfLines={1}>
                    {event.metadata?.title}
                  </Text>
                  {(event.isLive || event.schedulePhase === 'live') && (
                    <View style={styles.nearbyLiveDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Card del evento seleccionado */}
      {selectedEvent ? (
        <View style={styles.floatingCard}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={60} tint="light" style={styles.blurCard}>
              <MapEventCard
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onOpen={handleOpenEvent}
                t={t}
              />
            </BlurView>
          ) : (
            <View style={styles.androidCard}>
              <MapEventCard
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onOpen={handleOpenEvent}
                t={t}
              />
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  mapHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(250, 249, 247, 0.88)',
  },
  headerLabel: { ...typography.label_sm, color: colors.primary, letterSpacing: 2, marginBottom: 2 },
  headerTitle: { ...typography.display_sm, color: colors.on_surface },
  filterBar: { position: 'absolute', left: 0, right: 0, maxHeight: 40 },
  filterContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(250, 249, 247, 0.95)',
    borderWidth: 1,
    borderColor: colors.outline_variant,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.label_sm, color: colors.on_surface_variant },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  radarStatusFloat: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(250, 249, 247, 0.95)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outline_variant,
  },
  radarDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  radarStatusText: { ...typography.label_md, color: colors.live },
  radarCounts: { ...typography.body_sm, color: colors.on_surface_variant },
  reactivateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  reactivateText: { ...typography.label_md, color: colors.primary },
  mapControls: {
    position: 'absolute',
    right: spacing.lg,
    gap: spacing.sm,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(250, 249, 247, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline_variant,
    shadowColor: '#1a1c1b',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  nearbyStrip: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
  },
  nearbyLabel: {
    ...typography.label_sm,
    color: colors.on_surface_variant,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  nearbyScroll: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  nearbyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: 180,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(250, 249, 247, 0.97)',
    borderWidth: 1,
    borderColor: colors.outline_variant,
  },
  nearbyChipText: { ...typography.label_sm, color: colors.on_surface, flexShrink: 1 },
  nearbyLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.live },
  pinWrap: { alignItems: 'center' },
  pinSelected: { transform: [{ scale: 1.15 }] },
  pinHead: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pinNearby: {
    borderWidth: 3,
    borderColor: '#c2e9f3',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  pinLiveBadge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: colors.live,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pinLiveText: { fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  personMarker: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
    shadowColor: '#1a1c1b',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingCard: { position: 'absolute', bottom: 100, left: spacing.lg, right: spacing.lg },
  blurCard: { borderRadius: radius.xxl, overflow: 'hidden' },
  androidCard: {
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.outline_variant,
    shadowColor: '#1a1c1b',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
});
