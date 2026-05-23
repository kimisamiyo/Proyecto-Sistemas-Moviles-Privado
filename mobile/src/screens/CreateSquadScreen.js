import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useSquadStore } from '../store/squadStore';
import AppButton from '../components/ui/AppButton';
import AppInput from '../components/ui/AppInput';
import { parseApiErrors, validateRequired } from '../utils/validators';

const TAGS = [
  { id: 'general', label: 'General' },
  { id: 'voluntariado', label: 'Voluntariado' },
  { id: 'concierto', label: 'Concierto' },
  { id: 'pokemon_go', label: 'Pokémon GO' },
];

export default function CreateSquadScreen({ route, navigation }) {
  const { eventId, eventTitle } = route.params;
  const insets = useSafeAreaInsets();
  const { createSquad } = useSquadStore();

  const [name, setName] = useState('');
  const [plan, setPlan] = useState('');
  const [maxSize, setMaxSize] = useState('5');
  const [planNote, setPlanNote] = useState('');
  const [activityTag, setActivityTag] = useState('general');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!validateRequired(name, 3) || !validateRequired(plan, 5)) {
      Alert.alert('Completa los campos', 'Nombre y plan son obligatorios.');
      return;
    }
    const size = parseInt(maxSize, 10);
    if (size < 2 || size > 30) {
      Alert.alert('Tamaño inválido', 'Entre 2 y 30 personas.');
      return;
    }
    setLoading(true);
    try {
      await createSquad({
        eventId,
        name: name.trim(),
        plan: plan.trim(),
        maxSize: size,
        activityTag,
        planNote: planNote.trim() || 'Organizo la escuadra',
        joinPolicy: 'open',
      });
      Alert.alert('Escuadra creada', 'Ya puedes invitar desde el detalle de la escuadra.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', parseApiErrors(e));
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Nueva escuadra</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.heroCard}>
          <Ionicons name="people" size={28} color={colors.primary} />
          <Text style={styles.heroTitle}>Crear escuadra</Text>
          <Text style={styles.heroEvent} numberOfLines={2}>
            {eventTitle}
          </Text>
        </View>

        <Text style={styles.fieldLabel}>Tipo de actividad</Text>
        <View style={styles.tags}>
          {TAGS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tag, activityTag === t.id && styles.tagOn]}
              onPress={() => setActivityTag(t.id)}
            >
              <Text style={[styles.tagText, activityTag === t.id && styles.tagTextOn]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <AppInput icon="flag-outline" placeholder="Nombre de la escuadra" value={name} onChangeText={setName} />
        <AppInput
          icon="compass-outline"
          placeholder="Plan común (mín. 5 caracteres)"
          value={plan}
          onChangeText={setPlan}
          multiline
          style={{ marginTop: spacing.md, minHeight: 80 }}
        />
        <AppInput
          icon="chatbubble-outline"
          placeholder="Tu aporte (opcional)"
          value={planNote}
          onChangeText={setPlanNote}
          style={{ marginTop: spacing.md }}
        />
        <AppInput
          icon="people-outline"
          placeholder="Cupos máximos"
          value={maxSize}
          onChangeText={setMaxSize}
          keyboardType="number-pad"
          style={{ marginTop: spacing.md }}
        />

        <AppButton title="Publicar escuadra" onPress={submit} loading={loading} style={{ marginTop: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline_variant,
    backgroundColor: colors.surface,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', ...typography.headline_md, color: colors.primary },
  form: { padding: spacing.xl, paddingBottom: 80 },
  heroCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.outline_variant,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  heroTitle: { ...typography.headline_md, color: colors.on_surface },
  heroEvent: { ...typography.body_md, color: colors.on_surface_variant, textAlign: 'center' },
  fieldLabel: { ...typography.label_md, color: colors.on_surface_variant, marginBottom: spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  tag: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface_container_high,
    borderWidth: 1,
    borderColor: colors.outline_variant,
  },
  tagOn: { backgroundColor: colors.primary_container, borderColor: colors.primary },
  tagText: { ...typography.label_md, color: colors.outline },
  tagTextOn: { color: colors.primary, fontWeight: '600' },
});
