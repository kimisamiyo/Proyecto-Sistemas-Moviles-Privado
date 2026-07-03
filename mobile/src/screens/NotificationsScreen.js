import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useNotificationStore } from '../store/notificationStore';
import {
  navigateToTab,
  openEventDetailTab,
  openSquadDetail,
  openMessages,
} from '../utils/navigationHelpers';
import {
  isNotificationNavigable,
  resolveNotificationAction,
} from '../utils/notificationNavigation';

const ICON_BY_TYPE = {
  event_register: 'calendar-outline',
  squad_full: 'people-outline',
  squad_invite: 'people-outline',
  squad_join: 'people-outline',
  match_found: 'heart-outline',
  wall_reply: 'chatbubble-outline',
  badge_earned: 'ribbon-outline',
  welcome: 'sparkles-outline',
  connection_request: 'person-add-outline',
  album_pending: 'images-outline',
  album_approved: 'checkmark-circle-outline',
  album_rejected: 'close-circle-outline',
  default: 'notifications-outline',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `Hace ${h} h`;
  return new Date(dateStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { notifications, isLoading, fetchNotifications, markAllRead, markOneRead } =
    useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const openNotification = useCallback((item) => {
    markOneRead(item._id);
    const action = resolveNotificationAction(item);
    if (!action) {
      Alert.alert('Notificación', item.body || item.title || 'Sin destino asociado.');
      return;
    }

    switch (action.kind) {
      case 'event':
        openEventDetailTab(navigation, action.eventId, action.tab || 'info', {
          postId: action.postId,
          reviewMode: action.reviewMode,
        });
        break;
      case 'squad':
        openSquadDetail(navigation, action.squadId);
        break;
      case 'squads':
        navigateToTab(navigation, 'Squads');
        break;
      case 'events':
        navigateToTab(navigation, 'Events');
        break;
      case 'profile':
        navigateToTab(navigation, 'Profile', { screen: 'ProfileHome' });
        break;
      case 'feed':
        navigateToTab(navigation, 'Feed');
        break;
      case 'messages':
        openMessages(navigation, action.tab || 'chats');
        break;
      default:
        Alert.alert('Notificación', item.body || item.title || 'Sin destino asociado.');
    }
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    await fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notificaciones</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Leído</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.back} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={56} color={colors.outline} />
            <Text style={styles.emptyTitle}>Estás al día</Text>
            <Text style={styles.emptySub}>No hay notificaciones nuevas</Text>
          </View>
        }
        renderItem={({ item }) => {
          const icon = ICON_BY_TYPE[item.type] || ICON_BY_TYPE.default;
          const navigable = isNotificationNavigable(item);
          return (
            <TouchableOpacity
              style={[styles.item, !item.read && styles.itemUnread]}
              activeOpacity={navigable ? 0.75 : 0.95}
              onPress={() => openNotification(item)}
            >
              <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
                <Ionicons name={icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{item.title || item.type}</Text>
                <Text style={styles.itemBodyText}>{item.body || item.message}</Text>
                <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
              </View>
              {!item.read ? <View style={styles.dot} /> : null}
              {navigable ? (
                <Ionicons name="chevron-forward" size={16} color={colors.outline} style={{ marginTop: 6 }} />
              ) : null}
            </TouchableOpacity>
          );
        }}
      />
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
  back: { width: 44 },
  title: { flex: 1, textAlign: 'center', ...typography.headline_md, color: colors.on_surface },
  markAll: { ...typography.label_lg, color: colors.primary, width: 44, textAlign: 'right' },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface_container_high,
  },
  itemUnread: { borderColor: colors.primary_container, backgroundColor: colors.surface_container_low },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface_container_high,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnread: { backgroundColor: colors.primary_container },
  itemBody: { flex: 1 },
  itemTitle: { ...typography.title_lg, color: colors.on_surface },
  itemBodyText: { ...typography.body_md, color: colors.on_surface_variant, marginTop: 2 },
  itemTime: { ...typography.label_sm, color: colors.outline, marginTop: spacing.xs },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { ...typography.headline_md, color: colors.on_surface },
  emptySub: { ...typography.body_md, color: colors.on_surface_variant },
});
