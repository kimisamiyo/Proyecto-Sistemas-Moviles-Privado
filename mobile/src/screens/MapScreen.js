import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform,
  Animated, Easing
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useEventStore } from '../store/eventStore';
import { useLanguageStore } from '../store/languageStore';
import config from '../config';

const { width, height } = Dimensions.get('window');

import MapView, { Marker, Circle } from 'react-native-maps';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#131313' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#767575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0e0e0e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2020' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1f2020' }] },
];

function RadarPulse({ style }) {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };
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
        style={[
          styles.radarRing,
          style,
          { transform: [{ scale }], opacity },
        ]}
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
  const { events, fetchAllEvents } = useEventStore();
  const { t } = useLanguageStore();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [radarActive, setRadarActive] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => { fetchAllEvents(); }, []);

  const activateRadar = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation({
          latitude: config.DEFAULT_LOCATION.latitude,
          longitude: config.DEFAULT_LOCATION.longitude,
        });
      } else {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const newLoc = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserLocation(newLoc);
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...newLoc,
            latitudeDelta: 0.025,
            longitudeDelta: 0.025,
          }, 1500); // 1.5 seconds smooth fly-in
        }
      }
      setRadarActive(true);
    } catch (e) {
      setUserLocation({
        latitude: config.DEFAULT_LOCATION.latitude,
        longitude: config.DEFAULT_LOCATION.longitude,
      });
      setRadarActive(true);
    }
    setLocationLoading(false);
  };

  const initialRegion = {
    latitude: config.DEFAULT_LOCATION.latitude,
    longitude: config.DEFAULT_LOCATION.longitude,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={userLocation ? { ...userLocation, latitudeDelta: 0.025, longitudeDelta: 0.025 } : initialRegion}
        customMapStyle={darkMapStyle}
        showsUserLocation={radarActive}
      >
        {events.map((event) => {
          const coords = event.location?.coordinates?.coordinates;
          if (!coords || coords.length < 2) return null;
          return (
            <Marker
              key={event._id}
              coordinate={{ latitude: coords[1], longitude: coords[0] }}
              onPress={() => setSelectedEvent(event)}
            >
              <View style={[styles.markerDot, event.isLive && styles.markerLive]} />
            </Marker>
          );
        })}
        {radarActive && userLocation && Circle && (
          <Circle
            center={userLocation}
            radius={config.RADAR_RADIUS}
            fillColor="rgba(193, 199, 207, 0.08)"
            strokeColor="rgba(193, 199, 207, 0.3)"
            strokeWidth={1}
          />
        )}
      </MapView>

      <View style={[styles.mapHeader, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerLabel}>{t.map.headerLabel}</Text>
        <Text style={styles.headerTitle}>{t.map.headerTitle}</Text>
      </View>

      {!radarActive && (
        <View style={styles.radarButtonFloat}>
          <TouchableOpacity style={styles.activateButtonSmall} onPress={activateRadar} activeOpacity={0.85}>
            <Ionicons name="radio-outline" size={18} color={colors.on_primary} />
            <Text style={styles.activateTextSmall}>{t.map.activateRadar}</Text>
          </TouchableOpacity>
        </View>
      )}

      {radarActive && (
        <View style={styles.radarStatusFloat}>
          <View style={styles.radarDot} />
          <Text style={styles.radarStatusText}>{t.map.radarActive}</Text>
        </View>
      )}

      {selectedEvent && (
        <View style={styles.floatingCard}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={40} tint="dark" style={styles.blurCard}>
              <EventCard event={selectedEvent} onClose={() => setSelectedEvent(null)} t={t} />
            </BlurView>
          ) : (
            <View style={styles.androidCard}>
              <EventCard event={selectedEvent} onClose={() => setSelectedEvent(null)} t={t} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function EventCard({ event, onClose, t }) {
  return (
    <View style={styles.cardInner}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardType}>{event.metadata?.type?.toUpperCase()}</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={20} color={colors.outline} />
        </TouchableOpacity>
      </View>
      <Text style={styles.cardTitle}>{event.metadata?.title}</Text>
      <Text style={styles.cardVenue}>{event.location?.venue}</Text>
      <View style={styles.cardMeta}>
        <Text style={styles.cardMetaText}>
          {new Date(event.schedule?.date).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })}
        </Text>
        <Text style={styles.cardMetaText}>{event.schedule?.startTime} — {event.schedule?.endTime}</Text>
      </View>
      <View style={styles.cardCapacity}>
        <Text style={styles.capacityText}>
          {event.capacity?.max - event.capacity?.current} {t.map.seatsAvailable}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  mapHeader: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  headerLabel: { ...typography.label_sm, color: colors.outline, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { ...typography.display_sm, color: colors.on_surface },
  radarActivateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  radarContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  radarRing: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  radarCenter: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.primary,
  },
  activateButton: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: 14,
    borderRadius: radius.full, marginTop: 120,
  },
  activateText: { ...typography.label_lg, color: colors.on_primary, fontWeight: '700' },
  radarHint: { ...typography.body_sm, color: colors.outline, marginTop: spacing.lg, textAlign: 'center' },
  radarStatusBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface_container_high, alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full,
    marginBottom: spacing.lg,
  },
  radarDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  radarStatusText: { ...typography.label_md, color: colors.live },
  radarButtonFloat: {
    position: 'absolute', bottom: 110, alignSelf: 'center',
  },
  activateButtonSmall: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: 12,
    borderRadius: radius.full,
  },
  activateTextSmall: { ...typography.label_md, color: colors.on_primary, fontWeight: '700' },
  radarStatusFloat: {
    position: 'absolute', top: 120, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(31, 32, 32, 0.9)', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  fallback: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  fallbackTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.lg },
  eventList: { gap: spacing.sm },
  eventItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface_container_high, borderRadius: radius.lg,
    padding: spacing.lg, gap: spacing.md,
  },
  eventPinIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface_container_highest,
    alignItems: 'center', justifyContent: 'center',
  },
  eventItemInfo: { flex: 1, gap: 2 },
  eventItemTitle: { ...typography.title_md, color: colors.on_surface },
  eventItemVenue: { ...typography.body_sm, color: colors.outline },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  markerDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.surface,
  },
  markerLive: { backgroundColor: colors.live, borderColor: colors.live_bg },
  floatingCard: { position: 'absolute', bottom: 100, left: spacing.lg, right: spacing.lg },
  blurCard: { borderRadius: radius.xl, overflow: 'hidden' },
  androidCard: { backgroundColor: 'rgba(37, 38, 38, 0.95)', borderRadius: radius.xl },
  cardInner: { padding: spacing.xl, gap: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardType: { ...typography.label_sm, color: colors.secondary, letterSpacing: 1.5 },
  cardTitle: { ...typography.headline_md, color: colors.on_surface },
  cardVenue: { ...typography.body_md, color: colors.outline },
  cardMeta: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  cardMetaText: { ...typography.label_md, color: colors.secondary },
  cardCapacity: { marginTop: spacing.sm },
  capacityText: { ...typography.body_sm, color: colors.primary },
});
