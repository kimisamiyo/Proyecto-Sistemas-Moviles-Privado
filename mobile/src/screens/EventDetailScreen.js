import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useEventStore } from '../store/eventStore';
import { useAuthStore } from '../store/authStore';
import { useSquadStore } from '../store/squadStore';
import { useWalletStore } from '../store/walletStore';
import { useEventusStore } from '../store/eventusStore';
import CommunityChip from '../components/CommunityChip';
import EventTabBar from '../components/event/EventTabBar';
import EventInfoTab from '../components/event/tabs/EventInfoTab';
import EventWallTab from '../components/event/tabs/EventWallTab';
import EventGroupsTab from '../components/event/tabs/EventGroupsTab';
import EventSquadsTab from '../components/event/tabs/EventSquadsTab';
import EventTicketTab from '../components/event/tabs/EventTicketTab';
import EventAlbumTab from '../components/event/tabs/EventAlbumTab';
import EventMetricsTab from '../components/event/tabs/EventMetricsTab';
import LockedSectionGate from '../components/event/LockedSectionGate';
import AppButton from '../components/ui/AppButton';
import AvatarImage from '../components/ui/AvatarImage';
import EventAttendeesRow from '../components/event/EventAttendeesRow';
import { getEventCover } from '../utils/images';
import { useLayout } from '../utils/responsive';
import { openProfileTab } from '../utils/navigationHelpers';
import { useNotificationStore } from '../store/notificationStore';
import { parseApiErrors } from '../utils/validators';
import { getEventPhase } from '../utils/eventSchedule';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const insets = useSafeAreaInsets();
  const { horizontalPad } = useLayout();
  const {
    currentEvent,
    eventSquads,
    myEventSquad,
    attendeeSquads,
    fetchEvent,
    registerForEvent,
    isLoading,
    clearCurrentEvent,
  } = useEventStore();
  const { joinSquad, leaveSquad } = useSquadStore();
  const { addTicket, fetchWallet, hasTicketForEvent, tickets: walletTickets } = useWalletStore();
  const { getWhatsAppInvite, clearEventus, setTicketQR, fetchMyTicket } = useEventusStore();
  const { fetchNotifications } = useNotificationStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('info');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchEvent(eventId);
    fetchWallet();
    return () => {
      clearCurrentEvent();
      clearEventus();
    };
  }, [eventId]);

  useEffect(() => {
    if (currentEvent && user) {
      const inAttendees = currentEvent.attendees?.some(
        (a) => String(a._id || a) === String(user._id)
      );
      const reg = inAttendees || hasTicketForEvent(eventId);
      setIsRegistered(reg);
      if (reg) fetchMyTicket(eventId).catch(() => {});
    }
  }, [currentEvent, user, eventId, walletTickets]);

  const event = currentEvent;
  const isOrganizer =
    event?.createdBy &&
    user?._id &&
    (String(event.createdBy._id || event.createdBy) === String(user._id) ||
      event.hosts?.some((h) => String(h.userId?._id || h.userId) === String(user._id)));

  const schedulePhase = event?.schedulePhase || getEventPhase(event?.schedule);
  const isPastEvent = schedulePhase === 'past';

  const tabs = useMemo(() => {
    if (!event) return [];
    const f = event.features || {};
    if (isPastEvent) {
      const past = [{ id: 'info', label: 'Info' }];
      if (f.wallEnabled !== false) past.push({ id: 'wall', label: 'Muro' });
      if (f.albumEnabled !== false) past.push({ id: 'album', label: 'Recuerdos' });
      return past;
    }
    const list = [{ id: 'info', label: 'Info' }];
    if (f.wallEnabled !== false) list.push({ id: 'wall', label: 'Muro' });
    if (f.matchmakingEnabled !== false) list.push({ id: 'groups', label: 'Grupos' });
    list.push({ id: 'squads', label: 'Escuadras' });
    list.push({ id: 'ticket', label: 'Mi entrada' });
    if (f.albumEnabled !== false) list.push({ id: 'album', label: 'Recuerdos' });
    if (isOrganizer) list.push({ id: 'metrics', label: 'Métricas' });
    return list;
  }, [event, isOrganizer, isPastEvent]);

  useEffect(() => {
    if (tabs.length && !tabs.some((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs]);

  const handleWhatsApp = async () => {
    try {
      const data = await getWhatsAppInvite(eventId);
      Linking.openURL(data.whatsappUrl);
    } catch {
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    }
  };

  const promptRegister = () => {
    if (isPastEvent) {
      Alert.alert('Evento finalizado', 'Solo puedes ver el muro y los recuerdos de este evento.');
      return;
    }
    if (spotsLeft <= 0) {
      Alert.alert('Sin cupos', 'Este evento ya no tiene lugares disponibles.');
      return;
    }
    Alert.alert(
      'Confirmar asistencia',
      'Recibirás tu entrada con QR en Perfil → Mis entradas. No necesitas unirte a una escuadra ni a un grupo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar y generar QR', onPress: handleRegister },
      ]
    );
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const result = await registerForEvent(eventId);
      if (result.ticket) {
        addTicket(result.ticket);
        setTicketQR(result.ticket);
      } else {
        await fetchMyTicket(eventId);
      }
      setIsRegistered(true);
      setActiveTab('ticket');
      await fetchWallet();
      await fetchNotifications();
      await fetchEvent(eventId);
      Alert.alert(
        result.alreadyRegistered ? 'Ya inscrito' : '¡Inscripción guardada!',
        result.message ||
          'Tu entrada quedó en Perfil → Mis entradas y en Notificaciones.',
        [
          { text: 'Ver entrada', onPress: () => setActiveTab('ticket') },
          {
            text: 'Mis entradas',
            onPress: () => openProfileTab(navigation, 'ProfileHome'),
          },
          { text: 'Cerrar', style: 'cancel' },
        ]
      );
    } catch (error) {
      Alert.alert('Error', typeof error === 'string' ? error : 'No se pudo inscribir');
    } finally {
      setRegistering(false);
    }
  };

  const handleJoinSquad = async (squad, planNote) => {
    try {
      const note = planNote?.trim() || 'Me apunto al mismo plan';
      const hadSquad = !!myEventSquad;
      await joinSquad(squad._id, note);
      Alert.alert(
        hadSquad ? 'Escuadra actualizada' : '¡Unido!',
        hadSquad
          ? `Cambiaste a "${squad.name}". Solo puedes estar en una escuadra por evento.`
          : `Te uniste a ${squad.name}.`
      );
      fetchEvent(eventId);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || parseApiErrors(e) || 'No se pudo unir');
    }
  };

  const handleLeaveSquad = async () => {
    if (!myEventSquad?._id) return;
    Alert.alert('Salir de escuadra', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveSquad(myEventSquad._id);
            fetchEvent(eventId);
          } catch (e) {
            Alert.alert('Error', e?.response?.data?.error || 'No se pudo salir');
          }
        },
      },
    ]);
  };

  if (isLoading || !event) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const spotsLeft = Math.max(0, (event.capacity?.max || 0) - (event.capacity?.current || 0));
  const fillPct = event.capacity?.max
    ? Math.round(((event.capacity?.current || 0) / event.capacity.max) * 100)
    : 0;
  const eventDate = new Date(event.schedule?.date);
  const cover = getEventCover(event);

  const scrollBottomPad = spacing.xxl;

  const renderTab = () => {
    switch (activeTab) {
      case 'wall':
        return (
          <EventWallTab
            eventId={eventId}
            canPost={isRegistered || isPastEvent}
            embedInScroll
            bottomInset={spacing.lg}
          />
        );
      case 'groups':
        return <EventGroupsTab eventId={eventId} />;
      case 'squads':
        if (isPastEvent) return null;
        return (
          <EventSquadsTab
            eventId={eventId}
            event={event}
            squads={eventSquads}
            mySquad={myEventSquad}
            navigation={navigation}
            onJoin={handleJoinSquad}
            onLeave={handleLeaveSquad}
            hasTicketAccess={isRegistered}
            onRequestRegister={promptRegister}
            embedInScroll
          />
        );
      case 'ticket':
        if (isPastEvent) return null;
        return (
          <EventTicketTab
            eventId={eventId}
            event={event}
            isRegistered={isRegistered}
            onRequestRegister={promptRegister}
            embedInScroll
          />
        );
      case 'album':
        if (!isPastEvent && !isRegistered) {
          return (
            <LockedSectionGate
              title="Recuerdos del evento"
              message="Confirma tu asistencia para subir fotos y ver el álbum colaborativo."
              onConfirm={promptRegister}
            />
          );
        }
        return <EventAlbumTab eventId={eventId} event={event} embedInScroll />;
      case 'metrics':
        return <EventMetricsTab eventId={eventId} />;
      default:
        return <EventInfoTab event={event} onWhatsApp={handleWhatsApp} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.on_surface} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          {event.metadata?.title}
        </Text>
        <TouchableOpacity onPress={handleWhatsApp} style={styles.iconBtn}>
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={{
          paddingBottom: scrollBottomPad,
        }}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <View style={styles.hero}>
          <Image source={{ uri: cover }} style={styles.heroImg} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <CommunityChip slug={event.metadata?.communitySlug} />
            <Text style={styles.heroTitle}>{event.metadata?.title}</Text>
            {event.metadata?.impactStatement ? (
              <Text style={styles.heroImpact}>{event.metadata.impactStatement}</Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.capacityBlock, { paddingHorizontal: horizontalPad }]}>
        <View style={styles.capacityRow}>
          <Text style={styles.capacityLabel}>Cupos disponibles</Text>
          <Text style={styles.capacityValue}>
            {spotsLeft}/{event.capacity?.max} lugares
          </Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${fillPct}%` }]} />
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <View>
            <Text style={styles.detailMain}>
              {eventDate.toLocaleDateString('es-PE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
            <Text style={styles.detailSub}>
              {event.schedule?.startTime} — {event.schedule?.endTime}
            </Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          <View>
            <Text style={styles.detailMain}>{event.location?.venue}</Text>
          </View>
        </View>

        {event.hosts?.length ? (
          <View style={styles.organizerBlock}>
            <Text style={styles.organizerTitle}>Organizador</Text>
            {event.hosts.slice(0, 2).map((h, i) => {
              const u = h.userId?.profile ? h.userId : null;
              const name = u
                ? `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim()
                : 'Organizador';
              return (
                <View key={i} style={styles.hostCard}>
                  <AvatarImage
                    uri={u?.profile?.avatar}
                    size={48}
                    initials={name.slice(0, 2).toUpperCase()}
                  />
                  <View style={styles.hostInfo}>
                    <Text style={styles.hostName}>{name}</Text>
                    <Text style={styles.hostRole}>{h.role || 'Organizador'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {isPastEvent ? (
          <View style={styles.pastBanner}>
            <Ionicons name="time-outline" size={22} color={colors.on_surface_variant} />
            <Text style={styles.pastBannerText}>
              Evento finalizado · Muro y recuerdos siguen disponibles en tu perfil
            </Text>
          </View>
        ) : (
          <View style={styles.attendanceCard}>
            {isRegistered ? (
              <>
                <View style={styles.confirmedRow}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  <Text style={styles.confirmedText}>Tu asistencia está confirmada</Text>
                </View>
                <AppButton title="Ver mi QR de entrada" onPress={() => setActiveTab('ticket')} />
              </>
            ) : (
              <>
                <Text style={styles.attendanceTitle}>¿Vas a asistir?</Text>
                <Text style={styles.attendanceSub}>
                  Confirma aquí para generar tu QR. No necesitas escuadra ni grupo de matchmaking.
                </Text>
                <AppButton
                  title="Confirmar asistencia"
                  onPress={promptRegister}
                  loading={registering}
                  disabled={spotsLeft <= 0}
                />
              </>
            )}
          </View>
        )}

        <EventAttendeesRow
          attendees={event.attendees || []}
          attendeeSquads={attendeeSquads}
          mySquad={myEventSquad}
          currentUserId={user?._id}
          navigation={navigation}
        />
        </View>

        <EventTabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <View style={styles.tabPanel}>{renderTab()}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline_variant,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    ...typography.headline_md,
    color: colors.primary,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  mainScroll: { flex: 1 },
  tabPanel: { minHeight: 320 },
  hero: { height: 160, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroPlaceholder: { backgroundColor: colors.surface_container_high },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  heroTitle: { ...typography.headline_md, color: '#fff', marginTop: spacing.sm },
  heroImpact: { ...typography.body_sm, color: 'rgba(255,255,255,0.9)', marginTop: spacing.xs },
  capacityBlock: { paddingVertical: spacing.lg, gap: spacing.sm },
  capacityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  capacityLabel: { ...typography.label_md, color: colors.on_surface_variant },
  capacityValue: { ...typography.headline_md, color: colors.primary },
  barTrack: {
    height: 8,
    backgroundColor: colors.surface_container_high,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  detailRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  detailMain: { ...typography.body_md, color: colors.on_surface, fontWeight: '500' },
  detailSub: { ...typography.body_sm, color: colors.on_surface_variant },
  organizerBlock: { marginTop: spacing.lg, gap: spacing.sm },
  organizerTitle: { ...typography.title_lg, color: colors.on_surface },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outline_variant,
  },
  hostInfo: { flex: 1 },
  hostName: { ...typography.title_lg, color: colors.on_surface },
  hostRole: { ...typography.body_sm, color: colors.on_surface_variant },
  attendanceCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary_container,
  },
  attendanceTitle: { ...typography.headline_md, color: colors.on_surface },
  attendanceSub: { ...typography.body_sm, color: colors.on_surface_variant },
  confirmedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  confirmedText: { ...typography.title_lg, color: colors.primary, fontWeight: '600' },
  pastBanner: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface_container_high,
    borderRadius: radius.xl,
  },
  pastBannerText: { flex: 1, ...typography.body_sm, color: colors.on_surface_variant },
});
