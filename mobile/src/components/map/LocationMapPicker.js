import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, typography, spacing, radius } from '../../theme/tokens';
import config from '../../config';

const DEFAULT = {
  latitude: config.DEFAULT_LOCATION.latitude,
  longitude: config.DEFAULT_LOCATION.longitude,
};

function buildPickerHTML(lat, lng) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; border-radius: 16px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${lat}, ${lng}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    var marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);
    function sendCoords(latlng) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: latlng.lat, lng: latlng.lng }));
    }
    marker.on('dragend', function() { sendCoords(marker.getLatLng()); });
    map.on('click', function(e) { marker.setLatLng(e.latlng); sendCoords(e.latlng); });
  </script>
</body>
</html>`;
}

export default function LocationMapPicker({ coordinates, onChange, height = 200 }) {
  const webRef = useRef(null);
  const lng = coordinates?.[0] ?? DEFAULT.longitude;
  const lat = coordinates?.[1] ?? DEFAULT.latitude;

  const handleMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      onChange?.([msg.lng, msg.lat]);
    } catch { /* ignore */ }
  }, [onChange]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Ubicación en el mapa</Text>
      <Text style={styles.hint}>Toca el mapa o arrastra el pin para marcar el punto del evento.</Text>
      <WebView
        ref={webRef}
        source={{ html: buildPickerHTML(lat, lng) }}
        style={[styles.map, { height }]}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
      />
      <Text style={styles.coords}>
        {lat.toFixed(5)}, {lng.toFixed(5)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  label: { ...typography.label_md, color: colors.on_surface, marginBottom: spacing.xs },
  hint: { ...typography.body_sm, color: colors.outline, marginBottom: spacing.sm },
  map: {
    width: '100%',
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface_container_high,
  },
  coords: {
    ...typography.label_sm,
    color: colors.on_surface_variant,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
