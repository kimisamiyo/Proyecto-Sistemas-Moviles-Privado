import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useNetworkStore } from '../store/networkStore';
import AvatarImage from '../components/ui/AvatarImage';
import AppButton from '../components/ui/AppButton';
import { parseApiErrors } from '../utils/validators';

const TABS = [
  { id: 'chats', label: 'Chats' },
  { id: 'connected', label: 'Conectados' },
  { id: 'requests', label: 'Solicitudes' },
  { id: 'discover', label: 'Descubrir' },
];

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const mins = Math.floor((now - date) / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return date.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' });
}

function peerName(user) {
  return `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 'Usuario';
}

export default function MessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    conversations,
    hub,
    fetchConversations,
    fetchNetworkHub,
    acceptConnection,
    declineConnection,
    sendConnectionRequest,
  } = useNetworkStore();
  const [tab, setTab] = useState('chats');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([fetchConversations(), fetchNetworkHub()]);
  }, []);

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openChat = (userId, user) => {
    navigation.navigate('Chat', { userId, user });
  };

  const renderChat = ({ item }) => {
    const user = item.user;
    const initials = `${user?.profile?.firstName?.[0] || ''}${user?.profile?.lastName?.[0] || ''}`;
    return (
      <TouchableOpacity style={styles.row} onPress={() => openChat(item.userId, user)} activeOpacity={0.85}>
        <AvatarImage uri={user?.profile?.avatar} size={52} initials={initials} />
        <View style={styles.body}>
          <View style={styles.rowTop}>
            <Text style={styles.name} numberOfLines={1}>
              {peerName(user)}
            </Text>
            <Text style={styles.time}>{formatTime(item.lastTimestamp)}</Text>
          </View>
          <Text style={styles.preview} numberOfLines={1}>
            {item.lastMessage || 'Sin mensajes'}
          </Text>
        </View>
        {item.unread > 0 ? <View style={styles.dot} /> : null}
      </TouchableOpacity>
    );
  };

  const renderConnected = ({ item }) => {
    const user = item.user;
    return (
      <TouchableOpacity style={styles.row} onPress={() => openChat(item.userId, user)} activeOpacity={0.85}>
        <AvatarImage
          uri={user?.profile?.avatar}
          size={52}
          initials={`${user?.profile?.firstName?.[0] || ''}${user?.profile?.lastName?.[0] || ''}`}
        />
        <View style={styles.body}>
          <Text style={styles.name}>{peerName(user)}</Text>
          <Text style={styles.preview}>{user?.profile?.title || 'Conectado'}</Text>
        </View>
        {user?.isOnline ? <View style={styles.online} /> : null}
        <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  const renderIncoming = ({ item }) => {
    const user = item.user;
    return (
      <View style={styles.requestCard}>
        <AvatarImage uri={user?.profile?.avatar} size={48} initials={peerName(user).slice(0, 2)} />
        <View style={styles.body}>
          <Text style={styles.name}>{peerName(user)}</Text>
          <Text style={styles.preview}>Quiere conectar contigo</Text>
          <View style={styles.requestActions}>
            <AppButton
              title="Aceptar"
              onPress={() => acceptConnection(item.connectionId).then(load)}
              style={{ flex: 1 }}
            />
            <AppButton
              title="Rechazar"
              variant="outline"
              onPress={() => declineConnection(item.connectionId).then(load)}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderDiscover = ({ item }) => {
    const p = item.profile || item;
    const id = item._id;
    return (
      <View style={styles.row}>
        <AvatarImage
          uri={p.avatar}
          size={48}
          initials={`${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`}
        />
        <View style={styles.body}>
          <Text style={styles.name}>
            {p.firstName} {p.lastName}
          </Text>
          <Text style={styles.preview}>{p.title || 'Miembro EventUs'}</Text>
        </View>
        <AppButton
          title="Conectar"
          onPress={async () => {
            try {
              await sendConnectionRequest(id);
              Alert.alert('Enviado', 'Solicitud enviada. Revisa la pestaña Solicitudes.');
              load();
            } catch (e) {
              Alert.alert('Error', parseApiErrors(e));
            }
          }}
          style={{ paddingHorizontal: spacing.md }}
        />
      </View>
    );
  };

  let data = [];
  let renderItem = renderChat;
  let emptyText = 'Sin conversaciones. Conecta con alguien primero.';

  if (tab === 'chats') {
    data = conversations.filter((c) => {
      if (!query.trim()) return true;
      return peerName(c.user).toLowerCase().includes(query.toLowerCase());
    });
    renderItem = renderChat;
  } else if (tab === 'connected') {
    data = hub.accepted;
    renderItem = renderConnected;
    emptyText = 'Aún no tienes conexiones. Acepta solicitudes o descubre personas.';
  } else if (tab === 'requests') {
    data = hub.pendingIncoming;
    renderItem = renderIncoming;
    emptyText = 'No tienes solicitudes pendientes.';
  } else {
    data = hub.suggestions;
    renderItem = renderDiscover;
    emptyText = 'No hay sugerencias por ahora.';
  }

  const requestBadge = hub.pendingIncoming?.length || 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Mensajes</Text>
      <Text style={styles.subtitle}>Chatea solo con personas conectadas</Text>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabOn]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextOn]}>{t.label}</Text>
            {t.id === 'requests' && requestBadge > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{requestBadge}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'chats' ? (
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.outline} />
          <TextInput
            style={styles.search}
            placeholder="Buscar chat"
            placeholderTextColor={colors.outline}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      ) : null}

      <FlatList
        data={data}
        keyExtractor={(item, i) => String(item.userId || item._id || item.connectionId || i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.outline} />
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  title: {
    ...typography.headline_lg,
    color: colors.on_surface,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  subtitle: {
    ...typography.body_sm,
    color: colors.outline,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface_container_high,
  },
  tabOn: { backgroundColor: colors.primary_container },
  tabText: { ...typography.label_md, color: colors.outline },
  tabTextOn: { color: colors.primary },
  badge: {
    marginLeft: 6,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface_container_high,
    borderRadius: radius.full,
  },
  search: { flex: 1, ...typography.body_md, color: colors.on_surface },
  list: { paddingHorizontal: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface_container_high,
  },
  body: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { ...typography.title_lg, color: colors.on_surface, flex: 1 },
  time: { ...typography.label_sm, color: colors.outline },
  preview: { ...typography.body_md, color: colors.on_surface_variant },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  online: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.live, marginRight: spacing.sm },
  requestCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.xl,
  },
  requestActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyText: { ...typography.body_lg, color: colors.on_surface_variant, textAlign: 'center' },
});
