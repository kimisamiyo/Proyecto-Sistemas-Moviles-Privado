import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useEventusStore } from '../store/eventusStore';
import { useEventStore } from '../store/eventStore';
import { COMMUNITY_THEMES } from '../theme/communityThemes';
import PressableScale from '../components/ui/PressableScale';

export default function CreateEventScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { createEvent, isLoading } = useEventusStore();
  const { fetchAllEvents } = useEventStore();

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [communitySlug, setCommunitySlug] = useState('quedada');
  const [date, setDate] = useState('2026-06-15');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [venue, setVenue] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('50');
  const [impactStatement, setImpactStatement] = useState('');
  const [tags, setTags] = useState('');

  // Field focus states
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async () => {
    // Basic validation
    if (title.trim().length < 5 || title.trim().length > 120) {
      Alert.alert('Validación', 'El título debe tener entre 5 y 120 caracteres.');
      return;
    }
    if (description.trim().length < 20 || description.trim().length > 2000) {
      Alert.alert('Validación', 'La descripción debe tener entre 20 y 2000 caracteres.');
      return;
    }
    if (!venue.trim()) {
      Alert.alert('Validación', 'La ubicación es requerida.');
      return;
    }
    const cap = parseInt(maxCapacity);
    if (isNaN(cap) || cap < 2 || cap > 5000) {
      Alert.alert('Validación', 'El aforo debe ser un número entre 2 y 5000.');
      return;
    }

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      Alert.alert('Validación', 'Las horas de inicio y fin deben tener formato HH:MM (ej. 18:00).');
      return;
    }

    try {
      const parsedTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const eventPayload = {
        title: title.trim(),
        description: description.trim(),
        communitySlug,
        schedule: {
          date: new Date(date).toISOString(),
          startTime,
          endTime,
        },
        location: {
          venue: venue.trim(),
          coordinates: { type: 'Point', coordinates: [-77.0282, -12.0432] } // Mock Lima center coordinates
        },
        capacity: {
          max: cap,
          current: 0,
          isLimited: true,
        },
        tags: parsedTags,
        impactStatement: impactStatement.trim(),
        features: {
          radarEnabled: true,
          matchmakingEnabled: true,
          wallEnabled: true,
          dynamicQrEnabled: true,
          albumEnabled: true,
          whatsappInviteEnabled: true,
        },
        creatorMode: 'personal'
      };

      await createEvent(eventPayload);
      Alert.alert('¡Publicado!', 'Tu iniciativa académica ha sido creada exitosamente.');
      await fetchAllEvents();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo publicar la iniciativa.');
    }
  };

  const getInputFieldStyle = (fieldName) => [
    styles.input,
    focusedField === fieldName && styles.inputFocused
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color={colors.on_surface} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>MODO CREADOR</Text>
          <Text style={styles.headerTitle}>Publicar Iniciativa</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Comunidad de Afinidad</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.communityScroll}>
            {Object.values(COMMUNITY_THEMES).map((theme) => {
              const isActive = communitySlug === theme.slug;
              const accentColor = theme.colors.primary;
              return (
                <TouchableOpacity
                  key={theme.slug}
                  style={[
                    styles.communityCard,
                    isActive && { borderColor: accentColor, backgroundColor: theme.colors.surface_container_high }
                  ]}
                  onPress={() => setCommunitySlug(theme.slug)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={theme.icon} size={24} color={isActive ? accentColor : colors.outline} />
                  <Text style={[styles.communityName, isActive && { color: colors.on_surface, fontWeight: '700' }]}>
                    {theme.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Detalles Generales</Text>

          <Text style={styles.label}>TÍTULO DE LA INICIATIVA</Text>
          <TextInput
            style={getInputFieldStyle('title')}
            placeholder="Ej. Taller de Biodiversidad en Lomas de Lachay"
            placeholderTextColor={colors.outline}
            value={title}
            onChangeText={setTitle}
            onFocus={() => setFocusedField('title')}
            onBlur={() => setFocusedField(null)}
          />

          <Text style={styles.label}>DESCRIPCIÓN ACADÉMICA / INVITACIÓN</Text>
          <TextInput
            style={[getInputFieldStyle('description'), styles.textArea]}
            placeholder="Introduce los detalles, ponentes y propósito de la iniciativa. Mínimo 20 caracteres."
            placeholderTextColor={colors.outline}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            onFocus={() => setFocusedField('description')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Agenda y Capacidad</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>FECHA (AAAA-MM-DD)</Text>
              <TextInput
                style={getInputFieldStyle('date')}
                placeholder="2026-06-15"
                placeholderTextColor={colors.outline}
                value={date}
                onChangeText={setDate}
                onFocus={() => setFocusedField('date')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>AFORO MÁXIMO</Text>
              <TextInput
                style={getInputFieldStyle('maxCapacity')}
                placeholder="50"
                placeholderTextColor={colors.outline}
                value={maxCapacity}
                onChangeText={setMaxCapacity}
                keyboardType="numeric"
                onFocus={() => setFocusedField('maxCapacity')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>HORA INICIO (HH:MM)</Text>
              <TextInput
                style={getInputFieldStyle('startTime')}
                placeholder="18:00"
                placeholderTextColor={colors.outline}
                value={startTime}
                onChangeText={setStartTime}
                onFocus={() => setFocusedField('startTime')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>HORA FIN (HH:MM)</Text>
              <TextInput
                style={getInputFieldStyle('endTime')}
                placeholder="20:00"
                placeholderTextColor={colors.outline}
                value={endTime}
                onChangeText={setEndTime}
                onFocus={() => setFocusedField('endTime')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Ubicación e Impacto</Text>

          <Text style={styles.label}>RECINTO / LUGAR</Text>
          <TextInput
            style={getInputFieldStyle('venue')}
            placeholder="Ej. Auditorio Principal de la Facultad de Ingeniería"
            placeholderTextColor={colors.outline}
            value={venue}
            onChangeText={setVenue}
            onFocus={() => setFocusedField('venue')}
            onBlur={() => setFocusedField(null)}
          />

          <Text style={styles.label}>DECLARACIÓN DE IMPACTO SOCIAL (OPCIONAL)</Text>
          <TextInput
            style={getInputFieldStyle('impactStatement')}
            placeholder="Ej. Apoyar a la reforestación de la zona media."
            placeholderTextColor={colors.outline}
            value={impactStatement}
            onChangeText={setImpactStatement}
            onFocus={() => setFocusedField('impactStatement')}
            onBlur={() => setFocusedField(null)}
          />

          <Text style={styles.label}>ETIQUETAS / PALABRAS CLAVE (SEPARADAS POR COMA)</Text>
          <TextInput
            style={getInputFieldStyle('tags')}
            placeholder="Ej. ecologia, lima, botanica"
            placeholderTextColor={colors.outline}
            value={tags}
            onChangeText={setTags}
            onFocus={() => setFocusedField('tags')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <PressableScale
          style={[styles.publishBtn, isLoading && styles.publishBtnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.on_primary} />
          ) : (
            <Text style={styles.publishBtnText}>PUBLICAR INICIATIVA</Text>
          )}
        </PressableScale>

        <View style={{ height: 120 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
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
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  formSection: { marginBottom: spacing.xl, gap: spacing.sm },
  sectionTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.md },
  label: { ...typography.label_sm, color: colors.outline, fontSize: 8, letterSpacing: 1.5, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.on_surface,
    ...typography.body_md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputFocused: {
    backgroundColor: colors.surface_container_highest,
    borderColor: 'rgba(193, 199, 207, 0.4)',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  communityScroll: { gap: spacing.md, paddingBottom: spacing.sm },
  communityCard: {
    width: 110,
    height: 90,
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  communityName: { ...typography.body_sm, color: colors.outline, fontSize: 10, textAlign: 'center' },
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1, gap: spacing.xs },
  publishBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  publishBtnDisabled: { opacity: 0.6 },
  publishBtnText: { ...typography.label_lg, color: colors.on_primary, fontWeight: '700' },
});
