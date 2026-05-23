import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import { useLanguageStore } from '../store/languageStore';
import IdentityHeader from '../components/IdentityHeader';
import AcademicMetrics from '../components/AcademicMetrics';
import DigitalWallet from '../components/DigitalWallet';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, fetchMe, logout } = useAuthStore();
  const { tickets, fetchWallet } = useWalletStore();
  const { t, locale, toggleLanguage } = useLanguageStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchMe(); fetchWallet(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await fetchMe(); await fetchWallet(); setRefreshing(false);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>{t.profile.headerLabel}</Text>
          <Text style={styles.headerTitle}>{t.profile.headerTitle}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <IdentityHeader user={user} />
        <View style={styles.sections}>
          <AcademicMetrics metrics={user?.metrics} t={t} />
          <DigitalWallet 
            wallet={tickets} 
            credentials={user?.credentials} 
            t={t} 
            onTicketPress={(ticket) => {
              const eventId = ticket.eventId?._id || ticket.eventId;
              if (eventId) {
                navigation.navigate('TicketQR', {
                  eventId,
                  eventTitle: ticket.eventId?.metadata?.title || ticket.accessType,
                  initialQrDataUrl: ticket.qrDataUrl,
                  initialExpiresAt: ticket.expiresAt,
                  initialTtl: ticket.ttlSeconds
                });
              }
            }}
          />

          <View style={styles.languageSection}>
            <Text style={styles.languageSectionTitle}>{t.profile.language}</Text>
            <View style={styles.languageToggle}>
              <TouchableOpacity
                style={[styles.langOption, locale === 'es' && styles.langActive]}
                onPress={() => { if (locale !== 'es') toggleLanguage(); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.langText, locale === 'es' && styles.langTextActive]}>
                  🇪🇸 {t.profile.spanish}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langOption, locale === 'en' && styles.langActive]}
                onPress={() => { if (locale !== 'en') toggleLanguage(); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.langText, locale === 'en' && styles.langTextActive]}>
                  🇺🇸 {t.profile.english}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
  },
  headerLabel: { ...typography.label_sm, color: colors.outline, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { ...typography.display_sm, color: colors.on_surface },
  logoutButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface_container_high,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingTop: spacing.sm },
  sections: { paddingHorizontal: spacing.xl },
  languageSection: { marginTop: spacing.lg, marginBottom: spacing.xxl },
  languageSectionTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.lg },
  languageToggle: { flexDirection: 'row', gap: spacing.md },
  langOption: {
    flex: 1, paddingVertical: 14, borderRadius: radius.lg,
    backgroundColor: colors.surface_container_high, alignItems: 'center',
  },
  langActive: { backgroundColor: colors.primary },
  langText: { ...typography.label_lg, color: colors.secondary },
  langTextActive: { color: colors.on_primary, fontWeight: '700' },
});
