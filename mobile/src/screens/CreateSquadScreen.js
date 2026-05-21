import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useSquadStore } from '../store/squadStore';
import { getCommunityTheme } from '../theme/communityThemes';
import PressableScale from '../components/ui/PressableScale';
import { parseApiErrors, validateRequired } from '../utils/validators';

export default function CreateSquadScreen({ route, navigation }) {
  const { eventId, eventTitle, communitySlug } = route.params;
  const insets = useSafeAreaInsets();
  const theme = getCommunityTheme(communitySlug);
  const c = theme.colors;
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
        planNote: planNote.trim(),
        joinPolicy: 'open',
      });
      Alert.alert('Escuadra creada', 'Comparte el enlace para llenar cupos.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', parseApiErrors(e));
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: c.surface }]}>
      <PressableScale onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={{ color: c.primary }}>← Volver</Text>
      </PressableScale>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={[styles.label, { color: c.outline }]}>MODO CREADOR · ESCUADRA</Text>
        <Text style={[styles.title, { color: c.on_surface }]}>Hostear grupo</Text>
        <Text style={[styles.event, { color: c.secondary }]}>{eventTitle}</Text>

        {['pokemon_go', 'general', 'voluntariado', 'concierto'].map((tag) => (
          <PressableScale key={tag} onPress={() => setActivityTag(tag)} style={[styles.tag, activityTag === tag && { borderColor: c.primary }]}>
            <Text style={{ color: activityTag === tag ? c.primary : c.outline }}>{tag}</Text>
          </PressableScale>
        ))}

        <Field label="Nombre de la escuadra" value={name} onChangeText={setName} color={c} />
        <Field label="Plan (mismo objetivo para todos)" value={plan} onChangeText={setPlan} color={c} multiline />
        <Field label="Tu aporte" value={planNote} onChangeText={setPlanNote} color={c} />
        <Field label="Cupos máximos" value={maxSize} onChangeText={setMaxSize} color={c} keyboardType="number-pad" />

        <PressableScale onPress={submit} style={[styles.btn, { backgroundColor: c.primary }]} disabled={loading}>
          <Text style={[styles.btnText, { color: c.on_primary }]}>{loading ? 'Publicando...' : 'Publicar escuadra'}</Text>
        </PressableScale>
      </ScrollView>
    </View>
  );
}

function Field({ label, color: c, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: c.outline }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={c.outline}
        style={[styles.input, { color: c.on_surface, borderColor: c.outline_variant, backgroundColor: c.surface_container_high }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { padding: spacing.xl },
  form: { padding: spacing.xl, paddingBottom: 80 },
  label: { ...typography.label_sm },
  title: { ...typography.display_sm, marginTop: spacing.xs },
  event: { ...typography.body_md, marginBottom: spacing.lg },
  tag: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 999, borderWidth: 1, borderColor: '#484848', marginRight: spacing.sm, marginBottom: spacing.sm },
  field: { marginBottom: spacing.lg },
  fieldLabel: { ...typography.label_md, marginBottom: spacing.xs },
  input: { borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, minHeight: 48 },
  btn: { borderRadius: radius.full, padding: spacing.lg, alignItems: 'center', marginTop: spacing.lg },
  btnText: { ...typography.label_lg, fontWeight: '700' },
});
