import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEventusStore } from '../store/eventusStore';
import AvatarImage from '../components/ui/AvatarImage';
import { colors, typography, spacing, radius } from '../theme/tokens';

const SCAN_COOLDOWN_MS = 2500;

export default function CheckInScannerScreen({ navigation, route }) {
  const { eventId, eventTitle } = route.params || {};
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const checkInTicket = useEventusStore((s) => s.checkInTicket);

  const [result, setResult] = useState(null); // { ok, message, attendee?, totalCheckIns? }
  const [validating, setValidating] = useState(false);
  const [checkedCount, setCheckedCount] = useState(0);
  const lastScanRef = useRef(0);
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  const flashFeedback = (success) => {
    Haptics.notificationAsync(
      success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    ).catch(() => {});
    flash.setValue(1);
    Animated.timing(flash, { toValue: 0, duration: 600, useNativeDriver: true }).start();
  };

  const handleScan = async ({ data }) => {
    const now = Date.now();
    if (validating || now - lastScanRef.current < SCAN_COOLDOWN_MS) return;
    lastScanRef.current = now;

    setValidating(true);
    try {
      const res = await checkInTicket(eventId, data);
      setResult({
        ok: true,
        message: res.message,
        attendee: res.attendee,
        totalCheckIns: res.totalCheckIns,
      });
      setCheckedCount(res.totalCheckIns || checkedCount + 1);
      flashFeedback(true);
    } catch (e) {
      const apiError = e.response?.data;
      setResult({
        ok: false,
        message: apiError?.error || 'No se pudo validar la entrada.',
        reason: apiError?.reason,
      });
      flashFeedback(false);
    } finally {
      setValidating(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { paddingHorizontal: spacing.xl }]}>
        <Ionicons name="camera-outline" size={48} color={colors.outline} />
        <Text style={styles.permissionText}>
          EventUs necesita la cámara para escanear los QR dinámicos de las entradas.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Permitir cámara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const flashColor = result?.ok ? 'rgba(46, 125, 50, 0.45)' : 'rgba(186, 26, 26, 0.45)';

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleScan}
      />

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: flashColor, opacity: flash }]}
      />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerLabel}>VALIDACIÓN ANTI-FRAUDE</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {eventTitle || 'Escanear entradas'}
          </Text>
        </View>
        <View style={styles.counterPill}>
          <Ionicons name="checkmark-done" size={14} color="#fff" />
          <Text style={styles.counterText}>{checkedCount}</Text>
        </View>
      </View>

      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <Text style={styles.frameHint}>
          Apunta al QR dinámico del asistente
        </Text>
      </View>

      {(result || validating) && (
        <View style={[styles.resultCard, { paddingBottom: insets.bottom + spacing.lg }]}>
          {validating ? (
            <View style={styles.resultRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.resultValidating}>Validando entrada…</Text>
            </View>
          ) : result.ok ? (
            <View style={styles.resultRow}>
              <AvatarImage
                uri={result.attendee?.avatar}
                initials={result.attendee?.fullName?.[0] || '?'}
                size={48}
              />
              <View style={{ flex: 1 }}>
                <View style={styles.resultBadgeOk}>
                  <Ionicons name="shield-checkmark" size={14} color="#fff" />
                  <Text style={styles.resultBadgeText}>ENTRADA VÁLIDA</Text>
                </View>
                <Text style={styles.resultName}>{result.attendee?.fullName}</Text>
                <Text style={styles.resultDetail}>{result.attendee?.email}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.resultRow}>
              <View style={styles.errorIcon}>
                <Ionicons name="close" size={26} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.resultBadgeError}>
                  <Ionicons name="alert-circle" size={14} color="#fff" />
                  <Text style={styles.resultBadgeText}>
                    {result.reason === 'already_used'
                      ? 'RE-USO DETECTADO'
                      : result.reason === 'stale_token' || result.reason === 'expired'
                        ? 'QR VENCIDO'
                        : 'INVÁLIDA'}
                  </Text>
                </View>
                <Text style={styles.resultDetail}>{result.message}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.lg,
  },
  permissionText: {
    ...typography.body_lg,
    color: colors.on_surface_variant,
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  permissionBtnText: { ...typography.label_lg, color: colors.on_primary, fontWeight: '700' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerLabel: { ...typography.label_sm, color: '#a7cdd6', letterSpacing: 1.5 },
  headerTitle: { ...typography.title_lg, color: '#fff' },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(46, 125, 50, 0.85)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  counterText: { ...typography.label_md, color: '#fff', fontWeight: '700' },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  frame: { width: 240, height: 240 },
  corner: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderColor: '#c2e9f3',
    borderWidth: 4,
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: radius.lg },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: radius.lg },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: radius.lg },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: radius.lg },
  frameHint: { ...typography.body_md, color: 'rgba(255,255,255,0.85)' },
  resultCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  resultValidating: { ...typography.body_lg, color: colors.on_surface_variant },
  resultBadgeOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.live,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginBottom: 4,
  },
  resultBadgeError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginBottom: 4,
  },
  resultBadgeText: { ...typography.label_sm, color: '#fff', letterSpacing: 1 },
  resultName: { ...typography.title_lg, color: colors.on_surface },
  resultDetail: { ...typography.body_sm, color: colors.on_surface_variant },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
