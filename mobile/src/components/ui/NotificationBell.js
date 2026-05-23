import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme/tokens';
import { useNotificationStore } from '../../store/notificationStore';

export function navigateToNotifications(navigation) {
  const tab = navigation.getParent?.();
  const app = tab?.getParent?.();
  if (app?.navigate) {
    app.navigate('Notifications');
    return;
  }
  if (navigation.navigate) {
    navigation.navigate('Notifications');
  }
}

export default function NotificationBell({ navigation, size = 22, color = colors.primary }) {
  const { unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <TouchableOpacity
      style={styles.hit}
      onPress={() => navigateToNotifications(navigation)}
      accessibilityLabel="Notificaciones"
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={size} color={color} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hit: {
    padding: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.on_error,
    fontSize: 9,
    fontWeight: '700',
  },
});
