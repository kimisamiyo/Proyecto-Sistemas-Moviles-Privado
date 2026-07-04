import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../components/ui/AppButton';
import AvatarImage from '../components/ui/AvatarImage';
import LockedSectionGate from '../components/event/LockedSectionGate';
import { colors, typography, spacing, radius, shadows } from '../theme/tokens';
import { useLayout } from '../utils/responsive';
import { getSquadCover } from '../utils/images';
import client from '../api/client';
import { useSquadStore } from '../store/squadStore';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import { parseApiErrors } from '../utils/validators';

export default function SquadDetailScreen({ route, navigation }) {
  const { squadId } = route.params || {};
  const insets = useSafeAreaInsets();

  if (!squadId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface, paddingTop: insets.top }}>
        <Text style={{ ...typography.body_lg, color: colors.error, marginBottom: 16 }}>Escuadra no disponible</Text>
        <AppButton title="Volver" onPress={() => navigation.goBack()} />
      </View>
    );
  }
  const { horizontalPad } = useLayout();
  const { joinSquad } = useSquadStore();
  const { user } = useAuthStore();
  const { hasTicketForEvent, fetchWallet } = useWalletStore();
  const [squad, setSquad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planNote, setPlanNote] = useState('');

  const load = async () => {
    try {
      const { data } = await client.get(`/squads/${squadId}`);
      setSquad(data.squad);
    } catch {
      setSquad(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    load();
  }, [squadId]);

  const handleJoin = () => {
    const eventId = squad?.event?._id || squad?.event;
    if (eventId && !hasTicketForEvent(eventId)) {
      Alert.alert(
        'Entrada requerida',
        'Confirma tu asistencia en el evento para unirte a esta escuadra.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Ir al evento',
            onPress: () => navigation.navigate('EventDetail', { eventId }),
          },
        ]
      );
      return;
    }
    Alert.alert('Unirse a la escuadra', `¿Unirte a "${squad.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Unirme',
        onPress: async () => {
          try {
            await joinSquad(squadId, planNote.trim() || 'Me apunto al plan');
            Alert.alert('¡Unido!', `Ahora eres parte de ${squad.name}`);
            await load();
          } catch (e) {
            Alert.alert('Error', parseApiErrors(e));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!squad) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.error}>Escuadra no encontrada</Text>
        <AppButton title="Volver" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const members = (squad.members || []).filter((m) => m.status === 'active');
  const spotsLeft = squad.slotsOpen ?? Math.max(0, (squad.maxSize || 0) - (squad.activeCount || members.length));
  const cover = getSquadCover(squad);
  const eventId = squad.event?._id || squad.event;
  const userId = user?._id;
  const isMember = members.some((m) => String(m.user?._id || m.user) === String(userId));
  const hasTicket = !eventId || hasTicketForEvent(eventId);

  const footerPosition = {
    paddingBottom: spacing.md,
    paddingHorizontal: horizontalPad,
  };

  const renderFooter = () => {
    if (isMember) {
      return (
        <View style={[styles.footer, styles.footerMember, footerPosition]}>
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          <Text style={styles.memberMsg}>Ya estás en esta escuadra</Text>
        </View>
      );
    }
    if (!hasTicket) {
      return (
        <View style={[styles.footer, footerPosition]}>
          <AppButton
            title="Confirmar asistencia en el evento"
            onPress={() => navigation.navigate('EventDetail', { eventId })}
            style={{ flex: 1 }}
          />
        </View>
      );
    }
    if (spotsLeft > 0) {
      return (
        <View style={[styles.footer, footerPosition]}>
          <AppButton title="Unirme ahora" onPress={handleJoin} style={{ flex: 1 }} />
        </View>
      );
    }
    return (
      <View style={[styles.footer, footerPosition]}>
        <Text style={styles.fullMsg}>Esta escuadra está completa</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.topBar, { paddingHorizontal: horizontalPad }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.on_surface} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          Escuadra
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: horizontalPad,
          paddingBottom: spacing.xxl,
        }}
      >
        <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
        <View style={styles.hero}>
          <Text style={styles.activityTag}>{(squad.activityTag || 'general').replace('_', ' ')}</Text>
          <Text style={styles.heroTitle}>{squad.name}</Text>
          <Text style={styles.heroMeta}>
            {squad.activeCount}/{squad.maxSize} miembros · {spotsLeft > 0 ? `${spotsLeft} cupos` : 'completo'}
          </Text>
        </View>

        {!hasTicket && !isMember ? (
          <LockedSectionGate
            title="Necesitas tu QR del evento"
            message="Confirma asistencia en el evento vinculado para unirte a esta escuadra."
          />
        ) : null}

        <Text style={styles.membersTitle}>Integrantes ({members.length})</Text>
        {members.map((m, i) => {
          const u = m.user;
          const p = u?.profile || u;
          const uid = u?._id || u;
          return (
            <TouchableOpacity
              key={m._id || i}
              style={styles.memberRowItem}
              onPress={() => uid && navigation.navigate('PublicProfile', { userId: uid })}
            >
              <AvatarImage
                uri={p?.avatar}
                size={44}
                initials={`${p?.firstName?.[0] || ''}${p?.lastName?.[0] || ''}`}
              />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {p?.firstName} {p?.lastName}
                </Text>
                <Text style={styles.memberNote} numberOfLines={1}>
                  {m.planNote || m.role || 'Miembro'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.outline} />
            </TouchableOpacity>
          );
        })}

        <View style={[styles.planCard, shadows.ambient]}>
          <Text style={styles.planLabel}>EL PLAN</Text>
          <Text style={styles.planText}>{squad.plan}</Text>
        </View>

        {!isMember && spotsLeft > 0 && hasTicket ? (
          <TextInput
            style={styles.input}
            placeholder="Tu aporte al plan (opcional)"
            placeholderTextColor={colors.outline}
            value={planNote}
            onChangeText={setPlanNote}
            multiline
          />
        ) : null}

        {eventId ? (
          <TouchableOpacity
            style={styles.eventLink}
            onPress={() => navigation.navigate('EventDetail', { eventId })}
          >
            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
            <View style={styles.eventLinkBody}>
              <Text style={styles.eventLinkTitle}>Evento vinculado</Text>
              <Text style={styles.eventLinkSub} numberOfLines={1}>
                {squad.event?.metadata?.title || 'Ver detalle del evento'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.outline} />
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {renderFooter()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.sm },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, ...typography.headline_md, color: colors.primary, textAlign: 'center' },
  cover: {
    width: '100%',
    height: 180,
    borderRadius: radius.xxl,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface_container_high,
  },
  hero: { marginBottom: spacing.lg },
  activityTag: { ...typography.label_sm, color: colors.primary, letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle: { ...typography.headline_lg, color: colors.on_surface, marginTop: spacing.xs },
  heroMeta: { ...typography.body_md, color: colors.on_surface_variant, marginTop: spacing.sm },
  membersTitle: { ...typography.title_md, color: colors.on_surface, marginBottom: spacing.sm },
  memberRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  memberInfo: { flex: 1 },
  memberName: { ...typography.title_md, color: colors.on_surface },
  memberNote: { ...typography.body_sm, color: colors.outline },
  planCard: {
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  planLabel: { ...typography.label_sm, color: colors.outline, letterSpacing: 2, marginBottom: spacing.sm },
  planText: { ...typography.body_lg, color: colors.on_surface, lineHeight: 24 },
  input: {
    backgroundColor: colors.surface_container_high,
    borderRadius: radius.lg,
    padding: spacing.lg,
    color: colors.on_surface,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline_variant,
  },
  eventLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.xl,
  },
  eventLinkBody: { flex: 1, minWidth: 0 },
  eventLinkTitle: { ...typography.label_lg, color: colors.primary },
  eventLinkSub: { ...typography.body_md, color: colors.on_surface },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.outline_variant,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
  },
  footerMember: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  memberMsg: { ...typography.title_md, color: colors.primary, fontWeight: '600' },
  fullMsg: { ...typography.body_md, color: colors.outline, textAlign: 'center', padding: spacing.md },
  error: { ...typography.body_lg, color: colors.error, marginBottom: spacing.lg },
});
