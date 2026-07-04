import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { getCommunityTheme } from '../theme/communityThemes';
import { useEventStore } from '../store/eventStore';
import { useLanguageStore } from '../store/languageStore';
import config from '../config';
import client from '../api/client';
import MapEventCard from '../components/map/MapEventCard';
import { openEventDetail, openPublicProfile } from '../utils/navigationHelpers';

const RADAR_POLL_MS = 15000;

function buildLeafletHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #1a1f25; }

    .leaflet-tile-pane { filter: saturate(0.85) brightness(1.02) contrast(1.05); }

    @keyframes pulse-ring {
      0% { transform: scale(0.8); opacity: 0.7; }
      70% { transform: scale(2.2); opacity: 0; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    @keyframes radar-breathe {
      0%, 100% { opacity: 0.6; stroke-dashoffset: 0; }
      50% { opacity: 1; stroke-dashoffset: 20; }
    }
    @keyframes marker-bounce {
      0%, 100% { transform: translateY(0); }
      40% { transform: translateY(-6px); }
    }
    @keyframes ripple-out {
      0% { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(3); opacity: 0; }
    }
    @keyframes float-gentle {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
    @keyframes glow-pulse {
      0%, 100% { box-shadow: 0 0 4px rgba(63,100,108,0.3), 0 2px 8px rgba(0,0,0,0.2); }
      50% { box-shadow: 0 0 12px rgba(63,100,108,0.5), 0 2px 12px rgba(0,0,0,0.3); }
    }

    .event-pin {
      position: relative;
      width: 38px; height: 38px;
      display: flex; align-items: center; justify-content: center;
      animation: float-gentle 3s ease-in-out infinite;
    }
    .event-pin-inner {
      width: 34px; height: 34px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2.5px solid rgba(255,255,255,0.9);
      font-size: 15px; color: #fff; font-weight: 700;
      box-shadow: 0 3px 10px rgba(0,0,0,0.25);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
      cursor: pointer;
    }
    .event-pin-inner:active, .event-pin.selected .event-pin-inner {
      transform: scale(1.25);
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
    }
    .event-pin.selected .event-pin-inner {
      border-color: #fff;
    }
    .event-pin.nearby .event-pin-inner {
      animation: glow-pulse 2s ease-in-out infinite;
    }

    .pulse-ring {
      position: absolute; top: 50%; left: 50%;
      width: 34px; height: 34px;
      margin-left: -17px; margin-top: -17px;
      border-radius: 50%;
      border: 2px solid currentColor;
      opacity: 0;
      animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }
    .event-pin.selected .pulse-ring { animation-duration: 1.5s; }

    .ripple-effect {
      position: absolute; top: 50%; left: 50%;
      width: 34px; height: 34px;
      margin-left: -17px; margin-top: -17px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0;
      pointer-events: none;
    }
    .ripple-effect.active {
      animation: ripple-out 0.6s ease-out forwards;
    }

    .live-badge {
      position: absolute; top: -4px; right: -8px;
      background: linear-gradient(135deg, #ff4757, #e74c3c);
      color: #fff; font-size: 7px; font-weight: 800;
      padding: 2px 4px; border-radius: 4px;
      letter-spacing: 0.5px;
      box-shadow: 0 1px 4px rgba(231,76,60,0.4);
    }

    .user-dot-wrap {
      position: relative;
      width: 20px; height: 20px;
      display: flex; align-items: center; justify-content: center;
    }
    .user-dot {
      width: 14px; height: 14px; border-radius: 50%;
      background: linear-gradient(135deg, #3F646C, #5a8a94);
      border: 3px solid #fff;
      box-shadow: 0 0 0 3px rgba(63,100,108,0.25), 0 2px 8px rgba(0,0,0,0.2);
    }
    .user-dot-pulse {
      position: absolute; top: 50%; left: 50%;
      width: 14px; height: 14px;
      margin-left: -7px; margin-top: -7px;
      border-radius: 50%;
      background: rgba(63,100,108,0.3);
      animation: pulse-ring 2.5s ease-out infinite;
    }

    .person-marker {
      width: 30px; height: 30px; border-radius: 50%;
      border: 2.5px solid rgba(63,100,108,0.8);
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      transition: transform 0.2s ease;
    }
    .person-marker:active { transform: scale(1.15); }
    .person-marker img { width: 100%; height: 100%; object-fit: cover; }

    .radar-circle {
      stroke: rgba(63, 100, 108, 0.4);
      stroke-dasharray: 8 4;
      stroke-linecap: round;
      fill: rgba(63, 100, 108, 0.04);
      animation: radar-breathe 3s ease-in-out infinite;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([-12.1068, -77.0251], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    var markers = {};
    var userMarker = null;
    var radarCircle = null;
    var personMarkers = {};

    function clearMarkers() {
      Object.values(markers).forEach(function(m) { map.removeLayer(m); });
      markers = {};
    }

    function clearPersonMarkers() {
      Object.values(personMarkers).forEach(function(m) { map.removeLayer(m); });
      personMarkers = {};
    }

    function triggerRipple(el, color) {
      var ripple = el.querySelector('.ripple-effect');
      if (!ripple) return;
      ripple.style.color = color;
      ripple.classList.remove('active');
      void ripple.offsetWidth;
      ripple.classList.add('active');
    }

    function setEvents(events, nearbyIds, selectedId) {
      clearMarkers();
      events.forEach(function(ev) {
        var coords = ev.coords;
        if (!coords) return;
        var isNearby = nearbyIds.indexOf(ev.id) >= 0;
        var isSelected = ev.id === selectedId;
        var isLive = ev.isLive;
        var color = ev.color || '#3F646C';
        var html = '<div class="event-pin' + (isNearby ? ' nearby' : '') + (isSelected ? ' selected' : '') + '">'
          + '<div class="pulse-ring" style="color:' + color + '"></div>'
          + '<div class="ripple-effect" style="color:' + color + '"></div>'
          + '<div class="event-pin-inner" style="background:' + color + '">●</div>'
          + (isLive ? '<span class="live-badge">LIVE</span>' : '')
          + '</div>';
        var icon = L.divIcon({
          className: '',
          html: html,
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        });
        var m = L.marker([coords[1], coords[0]], { icon: icon }).addTo(map);
        m.on('click', function(e) {
          var container = m.getElement();
          if (container) triggerRipple(container.querySelector('.event-pin'), color);
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', eventId: ev.id }));
        });
        markers[ev.id] = m;
      });
    }

    function setUserLocation(lat, lng, radarRadius) {
      if (userMarker) map.removeLayer(userMarker);
      if (radarCircle) map.removeLayer(radarCircle);
      var html = '<div class="user-dot-wrap">'
        + '<div class="user-dot-pulse"></div>'
        + '<div class="user-dot"></div>'
        + '</div>';
      var icon = L.divIcon({ className: '', html: html, iconSize: [20, 20], iconAnchor: [10, 10] });
      userMarker = L.marker([lat, lng], { icon: icon, zIndexOffset: 1000 }).addTo(map);
      if (radarRadius) {
        radarCircle = L.circle([lat, lng], { radius: radarRadius, className: 'radar-circle', weight: 2, fillOpacity: 0.04 }).addTo(map);
      }
    }

    function setNearbyUsers(users) {
      clearPersonMarkers();
      users.forEach(function(p) {
        if (!p.coords) return;
        var avatarHtml = p.avatar
          ? '<div class="person-marker"><img src="' + p.avatar + '"/></div>'
          : '<div class="person-marker" style="background:#3F646C;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;">' + (p.initials || '?') + '</div>';
        var icon = L.divIcon({ className: '', html: avatarHtml, iconSize: [30, 30], iconAnchor: [15, 15] });
        var m = L.marker([p.coords[1], p.coords[0]], { icon: icon }).addTo(map);
        m.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'personPress', userId: p.id }));
        });
        personMarkers[p.id] = m;
      });
    }

    function centerMap(lat, lng, zoom) {
      map.flyTo([lat, lng], zoom || 14, { duration: 1.2 });
    }

    function fitBounds(coords) {
      if (coords.length === 0) return;
      var bounds = L.latLngBounds(coords.map(function(c) { return [c[1], c[0]]; }));
      map.flyToBounds(bounds, { padding: [60, 40], duration: 1 });
    }

    map.on('click', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapPress' }));
    });
  </script>
</body>
</html>`;
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
  const webRef = useRef(null);
  const pollRef = useRef(null);
  const locationRef = useRef(null);
  const initRef = useRef(false);
  const radarPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!radarActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(radarPulse, { toValue: 1.6, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(radarPulse, { toValue: 1, duration: 1000, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [radarActive]);

  useEffect(() => { fetchAllEvents(); }, []);

  const injectJS = useCallback((js) => {
    webRef.current?.injectJavaScript(`${js}; true;`);
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
    } catch { /* GPS failed, use default */ }
    setUserLocation(newLoc);
    locationRef.current = newLoc;
    client.put('/auth/location', { longitude: newLoc.longitude, latitude: newLoc.latitude }).catch(() => {});
    setRadarActive(true);
    setLocationLoading(false);
    injectJS(`setUserLocation(${newLoc.latitude}, ${newLoc.longitude}, ${config.RADAR_RADIUS})`);
    injectJS(`centerMap(${newLoc.latitude}, ${newLoc.longitude}, 15)`);
  }, [injectJS]);

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
    () => nearbyEvents.map((e) => String(e._id)),
    [nearbyEvents]
  );

  // Sync markers to WebView whenever data changes
  useEffect(() => {
    const evData = visibleEvents.map((ev) => {
      const coords = ev.location?.coordinates?.coordinates;
      const theme = getCommunityTheme(ev.metadata?.communitySlug);
      return {
        id: ev._id,
        coords: coords && coords.length >= 2 ? coords : null,
        color: theme?.colors?.primary || colors.primary,
        isLive: ev.isLive || ev.schedulePhase === 'live',
      };
    }).filter((e) => e.coords);
    injectJS(`setEvents(${JSON.stringify(evData)}, ${JSON.stringify(nearbyEventIds)}, ${JSON.stringify(selectedEvent?._id || null)})`);
  }, [visibleEvents, nearbyEventIds, selectedEvent, injectJS]);

  useEffect(() => {
    const users = nearbyUsers.map((p) => ({
      id: p._id,
      coords: p.location?.coordinates,
      avatar: p.profile?.avatar,
      initials: `${p.profile?.firstName?.[0] || ''}${p.profile?.lastName?.[0] || ''}`,
    }));
    injectJS(`setNearbyUsers(${JSON.stringify(users)})`);
  }, [nearbyUsers, injectJS]);

  useEffect(() => {
    if (userLocation && radarActive) {
      injectJS(`setUserLocation(${userLocation.latitude}, ${userLocation.longitude}, ${config.RADAR_RADIUS})`);
    }
  }, [userLocation, radarActive, injectJS]);

  const handleWebMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'markerPress') {
        const ev = events.find((e) => e._id === msg.eventId);
        if (ev) setSelectedEvent(ev);
      } else if (msg.type === 'personPress') {
        openPublicProfile(navigation, msg.userId);
      } else if (msg.type === 'mapPress') {
        setSelectedEvent(null);
      }
    } catch { /* ignore */ }
  }, [events, navigation]);

  const handleOpenEvent = useCallback(() => {
    if (!selectedEvent) return;
    const id = selectedEvent._id;
    setSelectedEvent(null);
    openEventDetail(navigation, id);
  }, [navigation, selectedEvent]);

  const recenterOnUser = useCallback(() => {
    if (userLocation) {
      injectJS(`centerMap(${userLocation.latitude}, ${userLocation.longitude}, 15)`);
    } else {
      activateRadar();
    }
  }, [userLocation, activateRadar, injectJS]);

  const fitAllMarkers = useCallback(() => {
    const allCoords = visibleEvents
      .map((ev) => ev.location?.coordinates?.coordinates)
      .filter((c) => c && c.length >= 2);
    if (userLocation) allCoords.push([userLocation.longitude, userLocation.latitude]);
    if (allCoords.length) injectJS(`fitBounds(${JSON.stringify(allCoords)})`);
  }, [visibleEvents, userLocation, injectJS]);

  const displayNearby = radarActive ? nearbyEvents : visibleEvents.slice(0, 8);

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{ html: buildLeafletHTML() }}
        style={StyleSheet.absoluteFill}
        onMessage={handleWebMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />

      {/* Header */}
      <View style={[styles.mapHeader, { paddingTop: insets.top + spacing.sm }]} pointerEvents="none">
        <Text style={styles.headerLabel}>{t.map.headerLabel}</Text>
        <Text style={styles.headerTitle}>{t.map.headerTitle}</Text>
      </View>

      {/* Community filters */}
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
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{theme.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Radar status */}
      <View style={[styles.radarStatusFloat, { top: insets.top + (communitySlugs.length > 1 ? 118 : 72) }]}>
        {locationLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : radarActive ? (
          <>
            <View style={styles.radarDotWrap}>
              <Animated.View style={[styles.radarDotRing, { transform: [{ scale: radarPulse }], opacity: radarPulse.interpolate({ inputRange: [1, 1.6], outputRange: [0.6, 0] }) }]} />
              <View style={styles.radarDot} />
            </View>
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

      {/* Floating controls */}
      <View style={[styles.mapControls, { bottom: selectedEvent ? 280 : 120 }]}>
        <TouchableOpacity style={styles.controlBtn} onPress={recenterOnUser} activeOpacity={0.85}>
          <Ionicons name="locate" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={fitAllMarkers} activeOpacity={0.85}>
          <Ionicons name="scan-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Nearby events strip */}
      {!selectedEvent && displayNearby.length > 0 ? (
        <View style={styles.nearbyStrip}>
          <Text style={styles.nearbyLabel}>
            {radarActive ? t.map.nearbyEvents : 'Eventos en el mapa'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyScroll}>
            {displayNearby.map((event) => {
              const theme = getCommunityTheme(event.metadata?.communitySlug);
              return (
                <TouchableOpacity
                  key={event._id}
                  style={styles.nearbyChip}
                  onPress={() => {
                    setSelectedEvent(event);
                    const coords = event.location?.coordinates?.coordinates;
                    if (coords) injectJS(`centerMap(${coords[1]}, ${coords[0]}, 16)`);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name={theme.icon} size={14} color={theme.colors.primary} />
                  <Text style={styles.nearbyChipText} numberOfLines={1}>{event.metadata?.title}</Text>
                  {(event.isLive || event.schedulePhase === 'live') && <View style={styles.nearbyLiveDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Selected event card */}
      {selectedEvent ? (
        <View style={styles.floatingCard}>
          <View style={styles.androidCard}>
            <MapEventCard
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onOpen={handleOpenEvent}
              t={t}
            />
          </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  headerLabel: { ...typography.label_sm, color: colors.primary, letterSpacing: 2, marginBottom: 2, opacity: 0.9 },
  headerTitle: { ...typography.display_sm, color: colors.on_surface, opacity: 0.95 },
  filterBar: { position: 'absolute', left: 0, right: 0, maxHeight: 40 },
  filterContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.label_sm, color: colors.on_surface_variant },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  radarStatusFloat: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  radarDotWrap: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  radarDotRing: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: colors.live },
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
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
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  nearbyChipText: { ...typography.label_sm, color: colors.on_surface, flexShrink: 1 },
  nearbyLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.live },
  floatingCard: { position: 'absolute', bottom: 100, left: spacing.lg, right: spacing.lg },
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
