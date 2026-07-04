import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import { useEventusStore } from '../store/eventusStore';
import { useLanguageStore } from '../store/languageStore';
import StatCard from '../components/ui/StatCard';
import AvatarImage from '../components/ui/AvatarImage';
import NotificationBell from '../components/ui/NotificationBell';
import EventTicketTab from '../components/event/tabs/EventTicketTab';
import AppButton from '../components/ui/AppButton';
import BadgeTile from '../components/BadgeTile';
import { useLayout } from '../utils/responsive';
import { getEventCover } from '../utils/images';
import { canCreateEvent } from '../utils/eventPermissions';
import { openCreatorDashboard } from '../utils/navigationHelpers';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { horizontalPad } = useLayout();
  const { user, fetchMe, logout } = useAuthStore();
  const { tickets, fetchWallet } = useWalletStore();
  const { badgeWall, fetchBadgeWall } = useEventusStore();
  const { t, locale, toggleLanguage } = useLanguageStore();
  const [refreshing, setRefreshing] = useState(false);
  const [qrEventId, setQrEventId] = useState(null);

  const load = useCallback(async () => {
    await Promise.all([fetchMe(), fetchWallet(), fetchBadgeWall()]);
  }, []);

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const m = user?.metrics || {};
  const badges = badgeWall?.badges || user?.badges || [];

  const showCreateEvent = canCreateEvent(user);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: horizontalPad }]}>
        <Text style={styles.headerTitle}>Mi perfil</Text>
        <NotificationBell navigation={navigation} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: horizontalPad }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.identity}>
          <View style={styles.avatarWrap}>
            <AvatarImage
              uri={user?.profile?.avatar}
              size={120}
              initials={`${user?.profile?.firstName?.[0] || ''}${user?.profile?.lastName?.[0] || ''}`}
            />
          </View>
          <Text style={styles.name}>
            {user?.profile?.firstName} {user?.profile?.lastName}
          </Text>
          <Text style={styles.bio}>{user?.profile?.bio}</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="ticket-outline" label="Eventos asistidos" value={String(m.eventsAttended ?? 0)} />
          <StatCard icon="add-circle-outline" label="Eventos creados" value={String(m.eventsCreated ?? 0)} />
          <StatCard icon="star-outline" label="Puntos" value={String(m.impactPoints ?? 0)} />
          <StatCard icon="mail-outline" label="Invitaciones" value={String(m.invitesSent ?? 0)} />
        </View>

        <Text style={styles.sectionTitle}>Insignias</Text>
        <View style={styles.badgeGrid}>
          {badges.slice(0, 6).map((b, i) => (
            <BadgeTile key={b._id || i} badge={b} earned />
          ))}
          {badges.length < 6
            ? Array.from({ length: 6 - badges.length }).map((_, i) => (
                <BadgeTile key={`lock-${i}`} badge={{ name: 'Por desbloquear' }} earned={false} />
              ))
            : null}
        </View>

        <Text style={styles.sectionTitle}>Mis entradas</Text>
        <Text style={styles.sectionHint}>Solo eventos en curso o próximos</Text>
        {tickets.length === 0 ? (
          <Text style={styles.empty}>Sin entradas activas. Explora eventos en curso o próximos.</Text>
        ) : (
          tickets.map((ticket) => (
            <TouchableOpacity
              key={ticket.ticketId || ticket.eventId}
              style={styles.ticketCard}
              onPress={() => setQrEventId(ticket.eventId)}
            >
              <Image
                source={{ uri: ticket.coverImage || getEventCover({ metadata: { title: ticket.eventTitle } }) }}
                style={styles.ticketThumb}
              />
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketTitle}>{ticket.eventTitle || 'Evento'}</Text>
                <Text style={styles.ticketSub}>Toca para ver QR dinámico</Text>
              </View>
              <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          ))
        )}

        {showCreateEvent ? (
          <>
            <Text style={styles.sectionTitle}>Modo creador</Text>
            <TouchableOpacity
              style={styles.creatorCard}
              activeOpacity={0.85}
              onPress={() => openCreatorDashboard(navigation)}
            >
              <View style={styles.creatorIcon}>
                <Ionicons name="stats-chart" size={20} color={colors.on_primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.creatorTitle}>Panel de métricas</Text>
                <Text style={styles.creatorSub}>
                  Impacto, asistencia y alcance de tus iniciativas
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.outline} />
            </TouchableOpacity>
            <AppButton
              title="Crear evento"
              onPress={() => navigation.navigate('CreateEvent')}
              style={{ marginTop: spacing.sm }}
            />
            {(user?.role === 'admin' || user?.role === 'moderator') ? (
              <TouchableOpacity
                style={[styles.creatorCard, { marginTop: spacing.md }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('AdminRoleRequests')}
              >
                <View style={[styles.creatorIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.creatorTitle}>Solicitudes de rol</Text>
                  <Text style={styles.creatorSub}>Revisar y aprobar organizadores</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.outline} />
              </TouchableOpacity>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>¿Quieres organizar eventos?</Text>
            <TouchableOpacity
              style={styles.creatorCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('RequestOrganizer')}
            >
              <View style={[styles.creatorIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="megaphone-outline" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.creatorTitle}>Solicitar ser organizador</Text>
                <Text style={styles.creatorSub}>
                  Envía tu solicitud para crear y gestionar eventos
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.outline} />
            </TouchableOpacity>
          </>
        )}

        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, locale === 'es' && styles.langOn]}
            onPress={() => locale !== 'es' && toggleLanguage()}
          >
            <Text style={[styles.langText, locale === 'es' && styles.langTextOn]}>ES</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, locale === 'en' && styles.langOn]}
            onPress={() => locale !== 'en' && toggleLanguage()}
          >
            <Text style={[styles.langText, locale === 'en' && styles.langTextOn]}>EN</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={!!qrEventId} animationType="slide" onRequestClose={() => setQrEventId(null)}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setQrEventId(null)}>
            <Ionicons name="close" size={28} color={colors.on_surface} />
          </TouchableOpacity>
          {qrEventId ? (
            <EventTicketTab
              eventId={qrEventId}
              event={{ metadata: { title: tickets.find((t) => t.eventId === qrEventId)?.eventTitle } }}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerTitle: { ...typography.headline_lg, color: colors.on_surface },
  scroll: { flexGrow: 1 },
  identity: { alignItems: 'center', marginBottom: spacing.xxl },
  avatarWrap: { marginBottom: spacing.lg },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: colors.surface },
  avatarPh: { backgroundColor: colors.surface_container_high, alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.headline_lg, color: colors.on_surface },
  bio: { ...typography.body_md, color: colors.on_surface_variant, textAlign: 'center', marginTop: spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl },
  sectionTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.lg },
  sectionHint: { ...typography.body_sm, color: colors.outline, marginTop: -spacing.md, marginBottom: spacing.lg },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  ticketThumb: {
    width: 56,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface_container_high,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface_container_high,
    ...shadows.ambient,
  },
  ticketInfo: { flex: 1 },
  ticketTitle: { ...typography.title_lg, color: colors.on_surface },
  ticketSub: { ...typography.body_sm, color: colors.outline },
  empty: { ...typography.body_md, color: colors.outline, marginBottom: spacing.lg },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surface_container_high,
    ...shadows.ambient,
  },
  creatorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorTitle: { ...typography.title_lg, color: colors.on_surface },
  creatorSub: { ...typography.body_sm, color: colors.outline },
  langRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  langBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface_container,
    alignItems: 'center',
  },
  langOn: { backgroundColor: colors.primary },
  langText: { ...typography.label_lg, color: colors.on_surface_variant },
  langTextOn: { color: colors.on_primary },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  logoutText: { ...typography.body_md, color: colors.error },
  modal: { flex: 1, backgroundColor: colors.surface, paddingTop: 56 },
  modalClose: { position: 'absolute', top: 16, right: 20, zIndex: 10 },
});
