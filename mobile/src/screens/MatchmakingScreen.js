import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useEventusStore } from '../store/eventusStore';
import FadeInView from '../components/ui/FadeInView';
import PressableScale from '../components/ui/PressableScale';

export default function MatchmakingScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { eventId, eventTitle } = route.params;
  const { matchGroups, fetchMatchGroups, joinMatchmaking, isLoading } = useEventusStore();

  const [refreshing, setRefreshing] = useState(false);
  const [joinedGroup, setJoinedGroup] = useState(null);

  useEffect(() => {
    fetchMatchGroups(eventId).catch(() => {});
  }, [eventId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchMatchGroups(eventId);
    } catch {}
    setRefreshing(false);
  }, [eventId]);

  const handleJoin = async () => {
    try {
      const group = await joinMatchmaking(eventId);
      setJoinedGroup(group);
      Alert.alert(
        '¡Registrado en Matchmaking!',
        'El sistema te ha emparejado exitosamente. Revisa tu grupo asignado abajo.',
        [{ text: 'Genial' }]
      );
      fetchMatchGroups(eventId);
    } catch (err) {
      Alert.alert('Matchmaking', err.message || 'No se pudo completar el matchmaking.');
    }
  };

  const renderGroupItem = ({ item, index }) => {
    const isFull = item.members.length >= item.maxSize;
    const statusText = item.status === 'forming' ? 'Buscando participantes' : 'Listos para ir';
    const statusColor = item.status === 'forming' ? colors.secondary : colors.live;

    return (
      <FadeInView delay={index * 50} style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={styles.groupMeta}>
            <Text style={styles.groupName}>{item.name}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>
          <View style={styles.spotsBadge}>
            <Text style={styles.spotsText}>
              {item.members.length}/{item.maxSize} Miembros
            </Text>
          </View>
        </View>

        {/* Member Avatars */}
        <View style={styles.membersRow}>
          {item.members.map((member, i) => {
            const firstName = member.user?.profile?.firstName || 'Participante';
            const initials = `${member.user?.profile?.firstName?.[0] || 'P'}${member.user?.profile?.lastName?.[0] || ''}`;
            return (
              <View key={i} style={styles.memberAvatarContainer}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{initials}</Text>
                </View>
                <Text style={styles.memberName} numberOfLines={1}>
                  {firstName}
                </Text>
              </View>
            );
          })}
        </View>
      </FadeInView>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.on_surface} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>MATCHMAKING AUTOMÁTICO</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{eventTitle}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Matchmaking Explanation Banner */}
        <FadeInView style={styles.banner}>
          <LinearGradient
            colors={[colors.primary_container, 'rgba(31, 32, 32, 0.4)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.bannerLeft}>
            <Ionicons name="people" size={32} color={colors.primary} />
          </View>
          <View style={styles.bannerRight}>
            <Text style={styles.bannerTitle}>¿No quieres ir solo?</Text>
            <Text style={styles.bannerDesc}>
              Únete al matchmaking y nuestro algoritmo te agrupará de forma inteligente con otros 5 asistentes que compartan tus afinidades e intereses académicos.
            </Text>
          </View>
        </FadeInView>

        {/* CTA to Join Matchmaking */}
        <PressableScale style={styles.joinBtn} onPress={handleJoin}>
          <LinearGradient
            colors={[colors.primary, colors.primary_container]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.joinBtnGradient}
          >
            <Ionicons name="sparkles" size={18} color={colors.on_primary} />
            <Text style={styles.joinBtnText}>UNIRSE A UN GRUPO AUTOMÁTICO</Text>
          </LinearGradient>
        </PressableScale>

        <Text style={styles.sectionTitle}>Grupos de Afinidad Activos</Text>

        {matchGroups.length > 0 ? (
          <FlatList
            data={matchGroups}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={renderGroupItem}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="people-outline" size={36} color={colors.outline} />
                <Text style={styles.emptyText}>Ningún grupo formado para este evento todavía.</Text>
              </>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface_container_high,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  headerLabel: { ...typography.label_sm, color: colors.outline, letterSpacing: 2 },
  headerTitle: { ...typography.display_sm, color: colors.on_surface },
  scroll: { paddingHorizontal: spacing.xl },
  banner: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(193, 199, 207, 0.08)',
  },
  bannerLeft: {
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  bannerRight: { flex: 1, gap: 4 },
  bannerTitle: { ...typography.headline_md, color: colors.on_surface },
  bannerDesc: { ...typography.body_sm, color: colors.secondary, lineHeight: 18 },
  joinBtn: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },
  joinBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
  },
  joinBtnText: { ...typography.label_lg, color: colors.on_primary, fontWeight: '700' },
  sectionTitle: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.lg },
  groupCard: {
    backgroundColor: colors.surface_container_high,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(193, 199, 207, 0.05)',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  groupMeta: { gap: 4 },
  groupName: { ...typography.title_lg, color: colors.on_surface },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...typography.label_sm, fontSize: 9, letterSpacing: 1 },
  spotsBadge: {
    backgroundColor: colors.surface_container_highest,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  spotsText: { ...typography.label_sm, color: colors.primary, fontSize: 9 },
  membersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  memberAvatarContainer: { alignItems: 'center', gap: 4, width: 48 },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface_container_highest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { ...typography.label_md, color: colors.primary, fontWeight: '600', fontSize: 10 },
  memberName: { ...typography.body_sm, color: colors.secondary, fontSize: 9, textAlign: 'center', width: '100%' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(193, 199, 207, 0.03)',
  },
  emptyText: { ...typography.body_md, color: colors.outline, textAlign: 'center', paddingHorizontal: spacing.xl },
});
