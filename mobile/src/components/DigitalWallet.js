import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useLanguageStore } from '../store/languageStore';

export default function DigitalWallet({ wallet = [], credentials = [], t: tProp }) {
  const { t: tStore } = useLanguageStore();
  const t = tProp || tStore;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t.profile.verifiedCredentials}</Text>

      {credentials.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.credentialScroll}>
          {credentials.map((cred, index) => (
            <View key={index} style={styles.credentialCard}>
              <View style={styles.credentialIcon}>
                <Ionicons name={cred.verified ? 'shield-checkmark' : 'school'} size={20} color={cred.verified ? colors.primary : colors.outline} />
              </View>
              <Text style={styles.credentialName} numberOfLines={2}>{cred.name}</Text>
              <Text style={styles.credentialIssuer}>{cred.issuer} · {cred.year}</Text>
              {cred.verified && (
                <View style={styles.verifiedTag}>
                  <Ionicons name="checkmark" size={10} color={colors.live} />
                  <Text style={styles.verifiedText}>{t.profile.verified}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {wallet.length > 0 && (
        <View style={styles.walletSection}>
          <Text style={styles.walletTitle}>{t.profile.institutionalAccess}</Text>
          {wallet.map((ticket, index) => (
            <View key={index} style={styles.walletCard}>
              <View style={styles.walletAccent} />
              <View style={styles.walletContent}>
                <Text style={styles.walletLabel}>{t.profile.accessPass}</Text>
                <Text style={styles.walletEventName} numberOfLines={1}>{ticket.eventId?.metadata?.title || ticket.accessType}</Text>
                <Text style={styles.walletDate}>{ticket.eventId?.location?.venue || 'Conservatorio Principal'}</Text>
              </View>
              <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
            </View>
          ))}
        </View>
      )}

      {wallet.length === 0 && credentials.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="wallet-outline" size={32} color={colors.surface_container_highest} />
          <Text style={styles.emptyText}>{t.profile.noCredentials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xxl },
  sectionTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.lg },
  credentialScroll: { gap: spacing.md, paddingBottom: spacing.sm },
  credentialCard: { width: 160, backgroundColor: colors.surface_container_high, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  credentialIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.surface_container_highest, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  credentialName: { ...typography.title_md, color: colors.on_surface, fontSize: 13 },
  credentialIssuer: { ...typography.body_sm, color: colors.outline },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: spacing.xs },
  verifiedText: { ...typography.label_sm, color: colors.live, fontSize: 8 },
  walletSection: { marginTop: spacing.xl, gap: spacing.md },
  walletTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.sm },
  walletCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface_container_high, borderRadius: radius.lg, overflow: 'hidden' },
  walletAccent: { width: 4, height: '100%', backgroundColor: colors.primary },
  walletContent: { flex: 1, padding: spacing.lg, gap: 3 },
  walletLabel: { ...typography.label_sm, color: colors.secondary, fontSize: 8, letterSpacing: 2 },
  walletEventName: { ...typography.title_md, color: colors.on_surface },
  walletDate: { ...typography.body_sm, color: colors.outline },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyText: { ...typography.body_md, color: colors.outline },
});
