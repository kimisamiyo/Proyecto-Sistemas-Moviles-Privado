import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useEventStore } from '../store/eventStore';
import { useWalletStore } from '../store/walletStore';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import KeynoteList from '../components/KeynoteList';
import RegistrationAction from '../components/RegistrationAction';
import RegistrationModal from '../components/RegistrationModal';
import CommunityChip from '../components/CommunityChip';
import SquadsStrip from '../components/SquadsStrip';
import { getCommunityTheme } from '../theme/communityThemes';
import { useSquadStore } from '../store/squadStore';
import FadeInView from '../components/ui/FadeInView';
import PressableScale from '../components/ui/PressableScale';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../api/client';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const insets = useSafeAreaInsets();
  const { currentEvent, currentCommunity, eventSquads, fetchEvent, registerForEvent, isLoading, clearCurrentEvent } = useEventStore();
  const { joinSquad } = useSquadStore();
  const { addTicket } = useWalletStore();
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => { fetchEvent(eventId); return () => clearCurrentEvent(); }, [eventId]);

  useEffect(() => {
    if (currentEvent && user) {
      const reg = currentEvent.attendees?.some((a) => (a._id || a) === user._id);
      setIsRegistered(reg);
    }
  }, [currentEvent, user]);

  const handleRegisterClick = () => {
    setIsModalVisible(true);
  };

  const handleConfirmRegistration = async () => {
    try {
      const result = await registerForEvent(eventId);
      addTicket(result.ticket);
      setIsModalVisible(false);
      Alert.alert(t.eventDetail.confirmTitle, t.eventDetail.confirmMessage, [{ text: t.common.ok }]);
    } catch (error) {
      setIsModalVisible(false);
      Alert.alert(t.eventDetail.registrationFailed, typeof error === 'string' ? error : t.common.retry);
    }
  };

  if (isLoading || !currentEvent) {
    return (
      <View style={[styles.container, styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const event = currentEvent;
  const theme = getCommunityTheme(event.metadata?.communitySlug);
  const c = theme.colors;
  const spotsLeft = event.capacity?.max - event.capacity?.current;
  const eventDate = new Date(event.schedule?.date);

  const handleWhatsApp = async () => {
    try {
      const { data } = await client.get(`/eventus/events/${eventId}/invite/whatsapp`);
      Linking.openURL(data.whatsappUrl);
    } catch {
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    }
  };

  const handleJoinSquad = async (squad) => {
    try {
      await joinSquad(squad._id, 'Mismo plan — me apunto');
      Alert.alert('Unido', `Te uniste a ${squad.name}`);
      fetchEvent(eventId);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'No se pudo unir');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: c.surface }]}>
      <LinearGradient colors={theme.gradient || [c.surface, c.surface]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={colors.on_surface} />
      </TouchableOpacity>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <FadeInView style={styles.headerSection}>
          <CommunityChip slug={event.metadata?.communitySlug} />
          <Text style={[styles.typeLabel, { color: c.secondary }]}>{event.metadata?.type?.toUpperCase()}</Text>
          <Text style={[styles.title, { color: c.on_surface }]}>{event.metadata?.title}</Text>
          {event.metadata?.impactStatement ? (
            <Text style={[styles.impact, { color: c.primary }]}>{event.metadata.impactStatement}</Text>
          ) : null}
        </FadeInView>
        <SquadsStrip
          eventId={eventId}
          squads={eventSquads}
          title="Grupos para este evento"
          subtitle="Hostea o únete — mismo plan, mismos cupos"
          onSquadPress={handleJoinSquad}
          onCreate={() => navigation.navigate('CreateSquad', {
            eventId,
            eventTitle: event.metadata?.title,
            communitySlug: event.metadata?.communitySlug,
          })}
        />
        <PressableScale onPress={handleWhatsApp} style={[styles.waBtn, { borderColor: c.primary }]}>
          <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          <Text style={{ color: c.on_surface, ...typography.label_md }}>Invitar amigos por WhatsApp</Text>
        </PressableScale>
        <View style={styles.metaGrid}>
          <View style={styles.metaCard}>
            <Ionicons name="calendar-outline" size={16} color={colors.secondary} />
            <Text style={styles.metaLabel}>{t.eventDetail.date}</Text>
            <Text style={styles.metaValue}>
              {eventDate.toLocaleDateString('es-PE', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Ionicons name="time-outline" size={16} color={colors.secondary} />
            <Text style={styles.metaLabel}>{t.eventDetail.time}</Text>
            <Text style={styles.metaValue}>{event.schedule?.startTime} — {event.schedule?.endTime}</Text>
          </View>
        </View>
        <View style={styles.metaGrid}>
          <View style={styles.metaCard}>
            <Ionicons name="location-outline" size={16} color={colors.secondary} />
            <Text style={styles.metaLabel}>{t.eventDetail.location}</Text>
            <Text style={styles.metaValue}>{event.location?.venue}</Text>
          </View>
          <View style={styles.metaCard}>
            <Ionicons name="people-outline" size={16} color={colors.secondary} />
            <Text style={styles.metaLabel}>{t.eventDetail.capacity}</Text>
            <Text style={styles.metaValue}>{spotsLeft} {t.eventDetail.seatsRemaining}</Text>
          </View>
        </View>
        <RegistrationAction onRegister={handleRegisterClick} isRegistered={isRegistered} t={t} />
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>{t.eventDetail.aboutSeminar}</Text>
          <Text style={styles.description}>{event.metadata?.description}</Text>
        </View>
        {event.metadata?.tags && (
          <View style={styles.tagsContainer}>
            {event.metadata.tags.map((tag, i) => (
              <View key={i} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
            ))}
          </View>
        )}
        <KeynoteList speakers={event.speakers} t={t} />
        <View style={{ height: 120 }} />
      </ScrollView>
      <RegistrationModal 
        visible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
        onConfirm={handleConfirmRegistration} 
        userEmail={user?.email} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loading: { justifyContent: 'center', alignItems: 'center' },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface_container_high,
    alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xl, marginVertical: spacing.sm,
  },
  scroll: { paddingHorizontal: spacing.xl },
  headerSection: { marginTop: spacing.lg, marginBottom: spacing.xl },
  typeLabel: { ...typography.label_sm, color: colors.secondary, letterSpacing: 2, marginBottom: spacing.sm },
  title: { ...typography.display_md, color: colors.on_surface },
  metaGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  metaCard: { flex: 1, backgroundColor: colors.surface_container_high, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  metaLabel: { ...typography.label_sm, color: colors.outline, fontSize: 9, letterSpacing: 1.5, marginTop: spacing.xs },
  metaValue: { ...typography.body_md, color: colors.on_surface },
  descriptionSection: { marginTop: spacing.xxl, gap: spacing.md },
  sectionTitle: { ...typography.headline_md, color: colors.on_surface },
  description: { ...typography.body_lg, color: colors.secondary, lineHeight: 26 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  tag: { backgroundColor: colors.surface_container_highest, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  tagText: { ...typography.label_md, color: colors.secondary },
  impact: { ...typography.body_md, marginTop: spacing.sm },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(37,38,38,0.6)',
  },
});
