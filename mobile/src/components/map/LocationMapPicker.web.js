import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import config from "../../config";

const DEFAULT = {
  latitude: config.DEFAULT_LOCATION.latitude,
  longitude: config.DEFAULT_LOCATION.longitude,
};

/**
 * Fallback web para el selector de ubicación.
 * En web no usamos react-native-maps para evitar errores de bundling.
 */
export default function LocationMapPicker({
  coordinates,
  onChange,
  height = 200,
}) {
  const lng = coordinates?.[0] ?? DEFAULT.longitude;
  const lat = coordinates?.[1] ?? DEFAULT.latitude;

  useEffect(() => {
    if (!coordinates?.length) {
      onChange?.([DEFAULT.longitude, DEFAULT.latitude]);
    }
  }, [coordinates, onChange]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Ubicación en el mapa</Text>
      <View style={[styles.map, { height }]}>
        <Text style={styles.title}>Vista web sin mapa nativo</Text>
        <Text style={styles.hint}>
          En web se usa la ubicación por defecto de la app. En el móvil podrás
          tocar y arrastrar el pin.
        </Text>
        <Text style={styles.coords}>
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  label: {
    ...typography.label_md,
    color: colors.on_surface,
    marginBottom: spacing.xs,
  },
  map: {
    width: "100%",
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.surface_container_high,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    ...typography.title_md,
    color: colors.on_surface,
    textAlign: "center",
  },
  hint: {
    ...typography.body_sm,
    color: colors.outline,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  coords: {
    ...typography.label_sm,
    color: colors.on_surface_variant,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
