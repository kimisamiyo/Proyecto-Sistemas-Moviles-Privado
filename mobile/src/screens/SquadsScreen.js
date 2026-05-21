import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useSquadStore } from '../store/squadStore';
import SquadCard from '../components/SquadCard';
import FadeInView from '../components/ui/FadeInView';
import PressableScale from '../components/ui/PressableScale';
import { parseApiErrors } from '../utils/validators';

export default function SquadsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { openSquads, mySquads, fetchOpenSquads, fetchMySquads, joinSquad } = useSquadStore();
  const [tab, setTab] = useState('open');
  const [planNote, setPlanNote] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOpenSquads();
    fetchMySquads();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOpenSquads(), fetchMySquads()]);
    setRefreshing(false);
  };

  const handleJoin = async (squad) => {
    try {
      await joinSquad(squad._id, planNote || 'Me sumo al mismo plan');
      Alert.alert('¡Listo!', 'Te uniste a la escuadra. Revisa tu correo.');
      setPlanNote('');
      fetchOpenSquads();
    } catch (e) {
      Alert.alert('No se pudo unir', parseApiErrors(e));
    }
  };

  const list = tab === 'open' ? openSquads : mySquads;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FadeInView style={styles.header}>
        <Text style={styles.label}>EVENTUS</Text>
        <Text style={styles.title}>Escuadras</Text>
        <Text style={styles.sub}>Grupos para ir juntos — raids, brigadas, conciertos</Text>
      </FadeInView>

      <View style={styles.tabs}>
        {['open', 'mine'].map((t) => (
          <PressableScale key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === 'open' ? 'Disponibles' : 'Mis squads'}</Text>
          </PressableScale>
        ))}
      </View>

      {tab === 'open' && (
        <TextInput
          style={styles.input}
          placeholder="Tu aporte al plan (ej: traigo incense)"
          placeholderTextColor={colors.outline}
          value={planNote}
          onChangeText={setPlanNote}
        />
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
      >
        {list.map((s, i) => (
          <FadeInView key={s._id} delay={i * 60} style={{ marginBottom: spacing.md }}>
            <SquadCard squad={s} onPress={tab === 'open' ? handleJoin : undefined} />
          </FadeInView>
        ))}
        {!list.length && <Text style={styles.empty}>No hay escuadras aquí todavía. ¡Hostea una desde un evento!</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  label: { ...typography.label_sm, color: colors.outline },
  title: { ...typography.display_sm, color: colors.on_surface },
  sub: { ...typography.body_sm, color: colors.outline, marginTop: spacing.xs },
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  tab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.surface_container_high },
  tabOn: { backgroundColor: colors.primary_container },
  tabText: { ...typography.label_md, color: colors.outline },
  tabTextOn: { color: colors.primary },
  input: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.surface_container_high,
    borderRadius: radius.lg,
    padding: spacing.lg,
    color: colors.on_surface,
    borderWidth: 1,
    borderColor: colors.outline_variant,
  },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  empty: { ...typography.body_md, color: colors.outline, textAlign: 'center', marginTop: spacing.xxl },
});
