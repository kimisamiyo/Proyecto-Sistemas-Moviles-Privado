import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { colors, typography, spacing, radius } from '../../theme/tokens';
import config from '../../config';
import { smokeMapStyle } from '../../utils/mapStyles';

const DEFAULT = {
  latitude: config.DEFAULT_LOCATION.latitude,
  longitude: config.DEFAULT_LOCATION.longitude,
};

/**
 * Mini mapa para elegir el punto del evento (GeoJSON: [lng, lat]).
 */
export default function LocationMapPicker({ coordinates, onChange, height = 200 }) {
  const mapRef = useRef(null);
  const lng = coordinates?.[0] ?? DEFAULT.longitude;
  const lat = coordinates?.[1] ?? DEFAULT.latitude;
  const region = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  };

  const setPoint = (coord) => {
    onChange?.([coord.longitude, coord.latitude]);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Ubicación en el mapa</Text>
      <Text style={styles.hint}>Toca el mapa o arrastra el pin para marcar el punto del evento.</Text>
      <MapView
        ref={mapRef}
        style={[styles.map, { height }]}
        initialRegion={region}
        region={region}
        customMapStyle={smokeMapStyle}
        onPress={(e) => setPoint(e.nativeEvent.coordinate)}
      >
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          draggable
          onDragEnd={(e) => setPoint(e.nativeEvent.coordinate)}
        />
      </MapView>
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
