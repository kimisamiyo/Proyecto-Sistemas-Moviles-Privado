import React from 'react';
import { View, Text, Image, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../ui/AppButton';
import AvatarImage from '../../ui/AvatarImage';
import { colors, typography, spacing, radius, shadows } from '../../../theme/tokens';

export default function EventInfoTab({ event, onWhatsApp }) {
  const cover = event.metadata?.coverImage;
  const impact = event.impact?.goal || event.metadata?.impactStatement;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Acerca del evento</Text>
      <Text style={styles.body}>{event.metadata?.description}</Text>

      {impact ? (
        <View style={styles.impactBanner}>
          {cover ? <Image source={{ uri: cover }} style={styles.impactImg} /> : null}
          <View style={styles.impactOverlay}>
            <Text style={styles.impactTitle}>Impacto esperado</Text>
            <Text style={styles.impactSub}>{impact}</Text>
          </View>
        </View>
      ) : null}

      {event.hosts?.length ? (
        <>
          <Text style={styles.sectionTitle}>Organizadores</Text>
          {event.hosts.map((h, i) => {
            const u = h.userId?.profile ? h.userId : null;
            const name = u
              ? `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim()
              : 'Organizador';
            return (
              <View key={i} style={styles.hostCard}>
                <AvatarImage
                  uri={u?.profile?.avatar}
                  size={44}
                  initials={name.slice(0, 2).toUpperCase()}
                />
                <View style={styles.hostInfo}>
                  <Text style={styles.hostName}>{name}</Text>
                  <Text style={styles.hostRole}>{h.role || 'Organizador'}</Text>
                </View>
              </View>
            );
          })}
        </>
      ) : null}

      <AppButton title="Invitar por WhatsApp" variant="outline" onPress={onWhatsApp} style={styles.waBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.lg },
  sectionTitle: { ...typography.headline_md, color: colors.on_surface, fontSize: 18 },
  body: { ...typography.body_md, color: colors.on_surface_variant, lineHeight: 22 },
  impactBanner: { borderRadius: radius.xl, overflow: 'hidden', minHeight: 120, ...shadows.ambient },
  impactImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  impactOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(63, 100, 108, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  impactTitle: { ...typography.headline_md, color: '#fff', fontWeight: '600' },
  impactSub: { ...typography.body_md, color: '#fff', marginTop: spacing.xs, textAlign: 'center' },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outline_variant,
    backgroundColor: colors.surface_container_lowest,
    marginBottom: spacing.sm,
  },
  hostInfo: { flex: 1 },
  hostName: { ...typography.title_lg, color: colors.on_surface },
  hostRole: { ...typography.body_sm, color: colors.on_surface_variant, marginTop: 2 },
  waBtn: { marginTop: spacing.sm },
});
