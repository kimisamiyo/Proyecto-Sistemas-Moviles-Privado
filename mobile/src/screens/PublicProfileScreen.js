import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StatCard from '../components/ui/StatCard';
import AvatarImage from '../components/ui/AvatarImage';
import AppButton from '../components/ui/AppButton';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useEventusStore } from '../store/eventusStore';
import { useNetworkStore } from '../store/networkStore';
import { useAuthStore } from '../store/authStore';
import client from '../api/client';
import { parseApiErrors } from '../utils/validators';

export default function PublicProfileScreen({ route, navigation }) {
  const userId = route.params?.userId;
  const insets = useSafeAreaInsets();
  const { user: me } = useAuthStore();
  const { fetchBadgeWall, badgeWall } = useEventusStore();
  const { fetchConnectionStatus, sendConnectionRequest, acceptConnection } = useNetworkStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState('none');
  const [connectionId, setConnectionId] = useState(null);

  const isSelf = userId && me?._id && String(userId) === String(me._id);

  useEffect(() => {
    (async () => {
      try {
        const path = userId ? `/users/profile/${userId}` : '/users/profile';
        const { data } = await client.get(path);
        setProfile(data.user || data.profile);
        await fetchBadgeWall(userId);
        if (userId && !isSelf) {
          const st = await fetchConnectionStatus(userId);
          setConnStatus(st?.status || 'none');
          setConnectionId(st?.connectionId || null);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const name = profile
    ? `${profile.profile?.firstName || ''} ${profile.profile?.lastName || ''}`.trim()
    : 'Usuario';
  const badges = badgeWall?.badges || [];
  const m = profile?.metrics || {};

  const handleConnect = async () => {
    try {
      await sendConnectionRequest(userId);
      setConnStatus('pending_outgoing');
      Alert.alert('Enviado', 'Si acepta, podrás escribirle en Mensajes → Chats.');
    } catch (e) {
      Alert.alert('Error', parseApiErrors(e));
    }
  };

  const handleAccept = async () => {
    try {
      await acceptConnection(connectionId);
      setConnStatus('connected');
    } catch (e) {
      Alert.alert('Error', parseApiErrors(e));
    }
  };

  const openChat = () => {
    navigation.navigate('Chat', { userId, user: profile });
  };

  const renderConnectionCta = () => {
    if (isSelf || !userId) return null;
    if (connStatus === 'connected') {
      return <AppButton title="Enviar mensaje" onPress={openChat} style={{ marginTop: spacing.xl }} />;
    }
    if (connStatus === 'pending_incoming') {
      return (
        <AppButton title="Aceptar solicitud" onPress={handleAccept} style={{ marginTop: spacing.xl }} />
      );
    }
    if (connStatus === 'pending_outgoing') {
      return (
        <Text style={styles.pending}>Solicitud pendiente — revisa Mensajes → Solicitudes</Text>
      );
    }
    return (
      <AppButton title="Conectar" onPress={handleConnect} style={{ marginTop: spacing.xl }} />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.on_surface} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Perfil</Text>
        <View style={styles.back} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.identity}>
            <AvatarImage
              uri={profile?.profile?.avatar}
              size={96}
              initials={`${profile?.profile?.firstName?.[0] || ''}${profile?.profile?.lastName?.[0] || ''}`}
            />
            <Text style={styles.name}>{name}</Text>
            {profile?.profile?.title ? (
              <Text style={styles.titleRole}>{profile.profile.title}</Text>
            ) : null}
            {profile?.isOnline ? (
              <Text style={styles.online}>En línea</Text>
            ) : null}
            {profile?.profile?.bio ? <Text style={styles.bio}>{profile.profile.bio}</Text> : null}
          </View>

          <View style={styles.statsRow}>
            <StatCard icon="star-outline" label="Impacto" value={String(badgeWall?.impactPoints ?? m.impactPoints ?? 0)} />
            <StatCard icon="calendar-outline" label="Eventos" value={String(m.eventsAttended ?? 0)} />
          </View>

          <Text style={styles.section}>Insignias</Text>
          <View style={styles.badgeGrid}>
            {badges.length
              ? badges.slice(0, 6).map((b, i) => (
                  <View key={b._id || i} style={styles.badge}>
                    <Ionicons name="ribbon" size={28} color={colors.primary} />
                    <Text style={styles.badgeName} numberOfLines={1}>
                      {b.name || 'Insignia'}
                    </Text>
                  </View>
                ))
              : (
                <Text style={styles.emptyBadges}>Sin insignias públicas aún</Text>
              )}
          </View>

          {renderConnectionCta()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', ...typography.headline_md, color: colors.primary },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  identity: { alignItems: 'center', marginBottom: spacing.xxl },
  name: { ...typography.headline_lg, color: colors.on_surface },
  titleRole: { ...typography.label_lg, color: colors.primary, marginTop: spacing.xs },
  online: { ...typography.label_sm, color: colors.live, marginTop: spacing.xs },
  bio: {
    ...typography.body_md,
    color: colors.on_surface_variant,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl },
  section: { ...typography.headline_md, color: colors.on_surface, marginBottom: spacing.lg },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.secondary_container,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  badgeName: { ...typography.label_sm, color: colors.on_surface, marginTop: spacing.xs, textAlign: 'center' },
  emptyBadges: { ...typography.body_md, color: colors.outline },
  pending: { ...typography.body_md, color: colors.outline, textAlign: 'center', marginTop: spacing.xl },
});
