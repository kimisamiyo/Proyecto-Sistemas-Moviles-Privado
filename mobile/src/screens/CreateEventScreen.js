import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import Screen from "../components/ui/Screen";
import AppInput from "../components/ui/AppInput";
import AppButton from "../components/ui/AppButton";
import { colors, typography, spacing, radius } from "../theme/tokens";
import { useEventusStore } from "../store/eventusStore";
import { useCommunityStore } from "../store/communityStore";
import { getCoverForDraft } from "../utils/images";
import { parseApiErrors } from "../utils/validators";
import LocationMapPicker from "../components/map/LocationMapPicker";
import { pickAndUploadCover } from "../utils/mediaUpload";
import config from "../config";
import resolveMediaUrl from "../utils/resolveMediaUrl";

const STEPS = ["Iniciativa", "Cuándo y dónde", "Publicar"];

// Próximos 30 días seleccionables para programar la iniciativa
const buildDateOptions = () => {
  const options = [];
  for (let i = 1; i <= 30; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(12, 0, 0, 0);
    options.push(d);
  }
  return options;
};

const DATE_OPTIONS = buildDateOptions();

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function CreateEventScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { createEvent, isLoading } = useEventusStore();
  const { communities, fetchCommunities } = useCommunityStore();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [impactStatement, setImpactStatement] = useState("");
  const [communitySlug, setCommunitySlug] = useState("voluntariado");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState(DATE_OPTIONS[6]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [maxCapacity, setMaxCapacity] = useState("50");
  const [coordinates, setCoordinates] = useState([
    config.DEFAULT_LOCATION.longitude,
    config.DEFAULT_LOCATION.latitude,
  ]);
  const [mapTouched, setMapTouched] = useState(Platform.OS === "web");
  const [geoLoading, setGeoLoading] = useState(false);
  const [coverUri, setCoverUri] = useState(null);
  const [coverUrl, setCoverUrl] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    if (
      communities.length &&
      !communities.some((c) => c.slug === communitySlug)
    ) {
      setCommunitySlug(communities[0].slug);
    }
  }, [communities]);

  const coverPreview =
    coverUri ||
    (coverUrl ? resolveMediaUrl(coverUrl) : null) ||
    getCoverForDraft(title.trim() || communitySlug);

  const handlePickCover = async () => {
    setCoverUploading(true);
    try {
      const uploaded = await pickAndUploadCover();
      if (uploaded) {
        setCoverUri(uploaded.localUri);
        setCoverUrl(uploaded.url);
      }
    } catch (e) {
      Alert.alert("Portada", parseApiErrors(e));
    } finally {
      setCoverUploading(false);
    }
  };

  const next = () => {
    if (step === 0) {
      if (title.trim().length < 5) {
        Alert.alert("Título", "Mínimo 5 caracteres.");
        return;
      }
      if (description.trim().length < 20) {
        Alert.alert("Descripción", "Mínimo 20 caracteres para publicar.");
        return;
      }
    }
    if (step === 1) {
      if (!venue.trim()) {
        Alert.alert("Lugar", "Indica el venue o punto de encuentro.");
        return;
      }
      if (Platform.OS !== "web" && !mapTouched) {
        Alert.alert(
          "Mapa",
          "Marca el punto exacto en el mapa (toca o arrastra el pin).",
        );
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const timeOk = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

  const handlePublish = async () => {
    if (!coverUrl) {
      Alert.alert("Portada", "Sube una imagen de portada desde la galería.");
      setStep(2);
      return;
    }
    if (Platform.OS !== "web" && !mapTouched) {
      Alert.alert("Ubicación", "Marca el punto en el mapa (paso 2).");
      setStep(1);
      return;
    }
    if (!timeOk(startTime) || !timeOk(endTime)) {
      Alert.alert("Horario", "Usa formato HH:MM (ej. 09:00).");
      setStep(1);
      return;
    }
    const cap = parseInt(maxCapacity, 10) || 50;
    if (cap < 2) {
      Alert.alert("Cupos", "Mínimo 2 personas.");
      return;
    }
    try {
      const { event } = await createEvent({
        title: title.trim(),
        description: description.trim(),
        impactStatement: impactStatement.trim(),
        communitySlug,
        schedule: {
          date: eventDate.toISOString(),
          startTime,
          endTime,
        },
        location: {
          venue: venue.trim(),
          address: venue.trim(),
          coordinates: {
            type: "Point",
            coordinates: [coordinates[0], coordinates[1]],
          },
        },
        capacity: { max: cap, isLimited: true },
        coverImage: coverUrl || coverPreview,
        features: {
          wallEnabled: true,
          albumEnabled: true,
          matchmakingEnabled: true,
        },
      });
      if (navigation.canGoBack()) {
        navigation.replace("EventDetail", { eventId: event._id });
      } else {
        navigation.navigate("EventDetail", { eventId: event._id });
      }
    } catch (e) {
      Alert.alert("Error", parseApiErrors(e));
    }
  };

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => (step > 0 ? setStep(step - 1) : navigation.goBack())}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Crear evento</Text>
        <Text style={styles.stepLabel}>
          {step + 1}/{STEPS.length}
        </Text>
      </View>

      <View style={styles.progress}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotOn]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.stepName}>{STEPS[step]}</Text>

        {step === 0 && (
          <>
            <AppInput
              icon="text-outline"
              placeholder="Título de la iniciativa"
              value={title}
              onChangeText={setTitle}
            />
            <AppInput
              icon="document-text-outline"
              placeholder="Descripción (mín. 20 caracteres)"
              value={description}
              onChangeText={setDescription}
              multiline
              style={{ marginTop: spacing.md }}
            />
            <AppInput
              icon="heart-outline"
              placeholder="Frase de impacto"
              value={impactStatement}
              onChangeText={setImpactStatement}
              style={{ marginTop: spacing.md }}
            />
            <Text style={styles.fieldLabel}>Comunidad</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chips}
            >
              {(communities.length
                ? communities
                : [{ slug: communitySlug, name: communitySlug }]
              ).map((c) => (
                <TouchableOpacity
                  key={c.slug}
                  style={[
                    styles.chip,
                    communitySlug === c.slug && styles.chipOn,
                  ]}
                  onPress={() => setCommunitySlug(c.slug)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      communitySlug === c.slug && styles.chipTextOn,
                    ]}
                  >
                    {c.name || c.slug}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {step === 1 && (
          <>
            <AppInput
              icon="location-outline"
              placeholder="Lugar / venue"
              value={venue}
              onChangeText={setVenue}
            />
            <TouchableOpacity
              style={styles.geoBtn}
              activeOpacity={0.7}
              disabled={geoLoading}
              onPress={async () => {
                setGeoLoading(true);
                try {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status !== "granted") {
                    Alert.alert("Ubicación", "Permite el acceso a tu ubicación para autocompletar.");
                    return;
                  }
                  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                  const newCoords = [loc.coords.longitude, loc.coords.latitude];
                  setCoordinates(newCoords);
                  setMapTouched(true);
                  const [geo] = await Location.reverseGeocodeAsync({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                  });
                  if (geo) {
                    const parts = [geo.name, geo.street, geo.district || geo.subregion, geo.city].filter(Boolean);
                    setVenue(parts.slice(0, 3).join(", "));
                  }
                } catch {
                  Alert.alert("Error", "No se pudo obtener tu ubicación.");
                } finally {
                  setGeoLoading(false);
                }
              }}
            >
              {geoLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="navigate-outline" size={16} color={colors.primary} />
              )}
              <Text style={styles.geoBtnText}>Usar mi ubicación actual</Text>
            </TouchableOpacity>
            <Text style={styles.fieldLabel}>Fecha del evento</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dateStrip}
            >
              {DATE_OPTIONS.map((d) => {
                const selected = sameDay(d, eventDate);
                return (
                  <TouchableOpacity
                    key={d.toISOString()}
                    style={[styles.dateChip, selected && styles.dateChipOn]}
                    onPress={() => setEventDate(d)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dateChipDay, selected && styles.dateChipTextOn]}>
                      {d.toLocaleDateString("es-PE", { weekday: "short" }).toUpperCase()}
                    </Text>
                    <Text style={[styles.dateChipNum, selected && styles.dateChipTextOn]}>
                      {d.getDate()}
                    </Text>
                    <Text style={[styles.dateChipMonth, selected && styles.dateChipTextOn]}>
                      {d.toLocaleDateString("es-PE", { month: "short" })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <AppInput
              icon="time-outline"
              placeholder="Inicio (HH:MM)"
              value={startTime}
              onChangeText={setStartTime}
              style={{ marginTop: spacing.md }}
            />
            <AppInput
              icon="time-outline"
              placeholder="Fin (HH:MM)"
              value={endTime}
              onChangeText={setEndTime}
              style={{ marginTop: spacing.md }}
            />
            <LocationMapPicker
              coordinates={coordinates}
              onChange={(coords) => {
                setCoordinates(coords);
                setMapTouched(true);
              }}
            />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.fieldLabel}>Portada del evento</Text>
            <Image
              source={{ uri: coverPreview }}
              style={styles.coverPreview}
              resizeMode="cover"
            />
            <AppButton
              title={
                coverUrl ? "Cambiar portada" : "Elegir portada desde galería"
              }
              onPress={handlePickCover}
              loading={coverUploading}
              variant="outline"
            />
            <AppInput
              icon="people-outline"
              placeholder="Cupos máximos"
              value={maxCapacity}
              onChangeText={setMaxCapacity}
              keyboardType="number-pad"
            />
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>{title}</Text>
              <Text style={styles.summaryMeta}>
                {venue || "Lugar por definir"} · {communitySlug}
              </Text>
              <Text style={styles.summaryMeta}>
                {eventDate.toLocaleDateString("es-PE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                · {startTime} — {endTime}
              </Text>
            </View>
          </>
        )}

        {step < 2 ? (
          <AppButton
            title="Siguiente"
            onPress={next}
            style={{ marginTop: spacing.xxl }}
          />
        ) : (
          <AppButton
            title="Publicar iniciativa"
            onPress={handlePublish}
            loading={isLoading}
            style={{ marginTop: spacing.xxl }}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  topTitle: { flex: 1, ...typography.headline_md, color: colors.primary },
  stepLabel: { ...typography.label_md, color: colors.outline },
  progress: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface_container_high,
  },
  dotOn: { backgroundColor: colors.primary },
  form: { padding: spacing.xl, paddingBottom: 120 },
  stepName: {
    ...typography.headline_lg,
    color: colors.on_surface,
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    ...typography.label_md,
    color: colors.on_surface_variant,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  chips: { flexDirection: "row", marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface_container_high,
    marginRight: spacing.sm,
  },
  chipOn: { backgroundColor: colors.primary_container },
  chipText: { ...typography.label_md, color: colors.outline },
  chipTextOn: { color: colors.primary },
  hint: { ...typography.body_sm, color: colors.outline, marginTop: spacing.lg },
  dateStrip: { flexDirection: "row", marginBottom: spacing.sm },
  dateChip: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface_container_high,
    marginRight: spacing.sm,
    minWidth: 58,
  },
  dateChipOn: { backgroundColor: colors.primary },
  dateChipDay: { ...typography.label_sm, color: colors.outline },
  dateChipNum: { ...typography.headline_md, color: colors.on_surface },
  dateChipMonth: { ...typography.label_sm, color: colors.outline, textTransform: "capitalize" },
  dateChipTextOn: { color: colors.on_primary },
  summary: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.xl,
  },
  summaryTitle: { ...typography.title_lg, color: colors.on_surface },
  summaryMeta: {
    ...typography.body_sm,
    color: colors.on_surface_variant,
    marginTop: spacing.xs,
  },
  coverPreview: {
    width: "100%",
    height: 160,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface_container_high,
  },
  geoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.primary_fixed,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  geoBtnText: {
    ...typography.label_sm,
    color: colors.primary,
    fontWeight: "600",
  },
});
