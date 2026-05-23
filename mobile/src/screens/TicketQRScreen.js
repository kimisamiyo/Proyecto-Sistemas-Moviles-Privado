import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert, Animated, Easing
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useEventusStore } from '../store/eventusStore';
import { useLanguageStore } from '../store/languageStore';

export default function TicketQRScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { eventId, eventTitle, initialQrDataUrl, initialExpiresAt, initialTtl } = route.params;
  const { refreshTicketQR, isLoading } = useEventusStore();
  const { t } = useLanguageStore();

  const [qrDataUrl, setQrDataUrl] = useState(initialQrDataUrl);
  const [expiresAt, setExpiresAt] = useState(new Date(initialExpiresAt));
  const [timeLeft, setTimeLeft] = useState(initialTtl || 15);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start countdown timer
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.max(0, Math.round((expiresAt.getTime() - now.getTime()) / 1000));
      setTimeLeft(diff);

      if (diff <= 0) {
        handleRefresh();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    // Animate progress ring
    Animated.timing(progressAnim, {
      toValue: timeLeft / (initialTtl || 15),
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [timeLeft]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const data = await refreshTicketQR(eventId);
      setQrDataUrl(data.ticket.qrDataUrl);
      setExpiresAt(new Date(data.ticket.expiresAt));
      setTimeLeft(data.ticket.ttlSeconds);
      progressAnim.setValue(1);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el pase de acceso.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formattedTimeLeft = timeLeft > 0 ? `${timeLeft}s` : 'Expirado';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0e0e0e', '#1a1d20']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.on_surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pase de Acceso</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.cardContainer}>
        {/* Ticket Top */}
        <View style={styles.ticketTop}>
          <View style={styles.academicSeal}>
            <Ionicons name="school-outline" size={24} color={colors.primary} />
          </View>
          <Text style={styles.eventTitle} numberOfLines={2}>{eventTitle}</Text>
          <Text style={styles.institutionLabel}>UNIVERSIDAD DE EVENTUS</Text>
        </View>

        {/* Dashed Separator with Cutouts */}
        <View style={styles.dashedContainer}>
          <View style={styles.cutoutLeft} />
          <View style={styles.dashedLine} />
          <View style={styles.cutoutRight} />
        </View>

        {/* Ticket Bottom (QR Code) */}
        <View style={styles.ticketBottom}>
          <Text style={styles.qrLabel}>CÓDIGO QR DINÁMICO</Text>

          <View style={styles.qrWrapper}>
            {isRefreshing && (
              <View style={styles.qrLoader}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            {qrDataUrl ? (
              <Image source={{ uri: qrDataUrl }} style={styles.qrImage} />
            ) : (
              <Ionicons name="qr-code-outline" size={140} color={colors.outline} />
            )}
          </View>

          <View style={styles.timerRow}>
            <View style={styles.timerCircle}>
              <Animated.View
                style={[
                  styles.timerProgress,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.timerText}>
              Se actualiza en <Text style={styles.timerHighlight}>{formattedTimeLeft}</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleRefresh}
            activeOpacity={0.8}
            disabled={isRefreshing}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color={colors.on_primary}
              style={isRefreshing && styles.rotateIcon}
            />
            <Text style={styles.refreshBtnText}>REFRESCAR AHORA</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        Este pase es dinámico y expira cada 15 segundos para garantizar seguridad institucional.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface_container_high,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.headline_lg, color: colors.on_surface },
  cardContainer: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    backgroundColor: colors.surface_container_high,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(193, 199, 207, 0.08)',
  },
  ticketTop: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surface_container_low,
  },
  academicSeal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface_container_highest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  eventTitle: {
    ...typography.display_sm,
    color: colors.on_surface,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  institutionLabel: {
    ...typography.label_sm,
    color: colors.outline,
    letterSpacing: 2,
    fontSize: 9,
  },
  dashedContainer: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface_container_high,
  },
  cutoutLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
    marginLeft: -10,
  },
  cutoutRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
    marginRight: -10,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: colors.outline_variant,
    borderStyle: 'dashed',
    marginHorizontal: spacing.sm,
  },
  ticketBottom: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  qrLabel: {
    ...typography.label_sm,
    color: colors.secondary,
    letterSpacing: 2,
    fontSize: 9,
    marginBottom: spacing.lg,
  },
  qrWrapper: {
    width: 170,
    height: 170,
    borderRadius: radius.lg,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    position: 'relative',
    marginBottom: spacing.lg,
  },
  qrImage: {
    width: 150,
    height: 150,
  },
  qrLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  timerCircle: {
    width: 40,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface_container_highest,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    backgroundColor: colors.live,
  },
  timerText: {
    ...typography.body_sm,
    color: colors.secondary,
  },
  timerHighlight: {
    fontWeight: '700',
    color: colors.live,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.md,
    width: '100%',
    justifyContent: 'center',
  },
  refreshBtnText: {
    ...typography.label_lg,
    color: colors.on_primary,
    fontWeight: '700',
  },
  disclaimer: {
    ...typography.body_sm,
    color: colors.outline,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
    lineHeight: 18,
  },
});
