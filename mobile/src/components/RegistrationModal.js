import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useLanguageStore } from '../store/languageStore';
import * as Haptics from 'expo-haptics';

export default function RegistrationModal({ visible, onClose, onConfirm, userEmail }) {
  const { t } = useLanguageStore();

  const handleConfirm = () => {
    // Fuerte respuesta háptica
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.outline} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-open-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>{t.eventDetail.modalTitle}</Text>
            <Text style={styles.desc}>{t.eventDetail.modalDesc}</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>{t.eventDetail.modalEmailLabel}</Text>
            <TextInput
              style={styles.input}
              value={userEmail || 'demo@atelier.edu'}
              editable={false}
              selectTextOnFocus={false}
            />
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.8}>
            <Text style={styles.confirmText}>{t.eventDetail.modalConfirmBtn}</Text>
            <Ionicons name="checkmark-circle" size={20} color={colors.on_primary} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface_container_high,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(193, 199, 207, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headline_md,
    color: colors.on_surface,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  desc: {
    ...typography.body_md,
    color: colors.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  formContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.label_sm,
    color: colors.outline,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.md,
    color: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    ...typography.body_md,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.full,
    width: '100%',
  },
  confirmText: {
    ...typography.label_lg,
    fontWeight: 'bold',
    color: colors.on_primary,
  },
});
