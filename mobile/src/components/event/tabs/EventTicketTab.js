import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventusStore } from '../../../store/eventusStore';
import { useWalletStore } from '../../../store/walletStore';
import AppButton from '../../ui/AppButton';
import LockedSectionGate from '../LockedSectionGate';
import { colors, typography, spacing, radius } from '../../../theme/tokens';

export default function EventTicketTab({
  eventId,
  event,
  isRegistered = true,
  onRequestRegister,
  embedInScroll = false,
}) {
  const { refreshTicketQR, fetchMyTicket, ticketQR, setTicketQR } = useEventusStore();
  const tickets = useWalletStore((s) => s.tickets);
  const [qrUri, setQrUri] = useState(null);
  const [seconds, setSeconds] = useState(90);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState('');
  const timerRef = useRef(null);
  const ttlRef = useRef(90);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const hasAnimated = useRef(false);

  const runRevealAnimation = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    slideAnim.setValue(-60);
    scaleAnim.setValue(0.85);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, scaleAnim]);

  const applyTicket = useCallback(
    (ticket) => {
      if (!ticket?.qrDataUrl) return false;
      setQrUri(ticket.qrDataUrl);
      const ttl = ticket.ttlSeconds || 90;
      ttlRef.current = ttl;
      setSeconds(ttl);
      setTicketQR(ticket);
      setHint('');
      setTimeout(runRevealAnimation, 100);
      return true;
    },
    [setTicketQR, runRevealAnimation]
  );

  const walletFallback = useCallback(() => {
    const w = tickets.find((t) => String(t.eventId) === String(eventId));
    const raw = w?.rawTicket || w;
    if (raw?.qrDataUrl) return applyTicket(raw);
    if (ticketQR?.qrDataUrl && String(ticketQR.eventId) === String(eventId)) {
      return applyTicket(ticketQR);
    }
    return false;
  }, [tickets, eventId, ticketQR, applyTicket]);

  const loadTicket = useCallback(
    async (rotate = false) => {
      setLoading(true);
      setHint('');
      try {
        const data = rotate ? await refreshTicketQR(eventId) : await fetchMyTicket(eventId);
        const ticket = data?.ticket ?? data;
        if (applyTicket(ticket)) return;
      } catch (e) {
        const msg = e?.response?.data?.error || '';
        if (walletFallback()) return;
        setHint(msg || 'No se pudo cargar el QR. Toca actualizar.');
      } finally {
        setLoading(false);
      }
    },
    [eventId, refreshTicketQR, fetchMyTicket, applyTicket, walletFallback]
  );

  useEffect(() => {
    if (!isRegistered) return undefined;
    loadTicket(false);
    return () => clearInterval(timerRef.current);
  }, [eventId, isRegistered]);

  useEffect(() => {
    if (!qrUri) return undefined;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          loadTicket(true);
          return ttlRef.current;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qrUri, loadTicket]);

  if (!isRegistered) {
    return (
      <LockedSectionGate
        title="Tu entrada con QR"
        message="Confirma tu asistencia para generar tu código de acceso."
        onConfirm={onRequestRegister}
      />
    );
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const title = event?.metadata?.title || ticketQR?.eventTitle || 'Tu evento';

  const body = (
    <Animated.View
      style={[
        styles.card,
        { transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      <View style={styles.ticketHeader}>
        <Ionicons name="ticket-outline" size={20} color={colors.primary} />
        <Text style={styles.ticketLabel}>MI ENTRADA</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.sub}>Presenta este código en el acceso</Text>

      {loading && !qrUri ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : qrUri ? (
        <Animated.View style={styles.qrWrap}>
          <Image source={{ uri: qrUri }} style={styles.qr} resizeMode="contain" />
        </Animated.View>
      ) : (
        <View style={styles.emptyQr}>
          <Ionicons name="qr-code-outline" size={56} color={colors.outline} />
          <Text style={styles.hint}>{hint || 'Sin código activo'}</Text>
        </View>
      )}

      <View style={styles.timerRow}>
        <Ionicons name="time-outline" size={16} color={colors.primary} />
        <Text style={styles.timer}>Se renueva en {mm}:{ss}</Text>
      </View>
      <AppButton
        title="Actualizar QR"
        variant="outline"
        onPress={() => loadTicket(true)}
        loading={loading}
      />
    </Animated.View>
  );

  return <View style={styles.wrap}>{body}</View>;
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.outline_variant,
    shadowColor: '#1a1c1b',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  ticketLabel: {
    ...typography.label_sm,
    color: colors.primary,
    letterSpacing: 2,
    fontWeight: '700',
  },
  title: { ...typography.headline_md, color: colors.on_surface, textAlign: 'center' },
  sub: { ...typography.body_sm, color: colors.outline, marginTop: spacing.xs, marginBottom: spacing.lg },
  loader: { marginVertical: spacing.xxl },
  qrWrap: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  qr: {
    width: 240,
    height: 240,
    borderRadius: radius.md,
  },
  emptyQr: { alignItems: 'center', padding: spacing.xxl, gap: spacing.md },
  hint: { ...typography.body_md, color: colors.outline, textAlign: 'center' },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  timer: { ...typography.title_lg, color: colors.primary },
});
