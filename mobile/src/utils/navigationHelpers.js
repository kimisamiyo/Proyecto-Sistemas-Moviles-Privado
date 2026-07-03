/**
 * Utilidades de navegación cross-stack para EventUs.
 * Los stacks anidados (Feed/Map/Profile…) no comparten rutas con el
 * AuthenticatedNavigator raíz (CheckInScanner, CreatorDashboard, etc.).
 */

/** Sube por la jerarquía hasta encontrar un navigator que tenga `screen`. */
export function navigateToAppScreen(navigation, screen, params) {
  let nav = navigation;
  while (nav) {
    const names = nav.getState?.()?.routeNames || [];
    if (names.includes(screen)) {
      nav.navigate(screen, params);
      return true;
    }
    nav = nav.getParent?.();
  }
  return false;
}

/** Cambia al tab inferior (Feed, Map, Events, Squads, Messages, Profile). */
export function navigateToTab(navigation, tabName, nestedParams) {
  let nav = navigation;
  while (nav) {
    const names = nav.getState?.()?.routeNames || [];
    if (names.includes('MainTabs')) {
      nav.navigate('MainTabs', { screen: tabName, params: nestedParams });
      return true;
    }
    if (names.includes('Feed') && names.includes('Map')) {
      if (nestedParams) {
        nav.navigate(tabName, nestedParams);
      } else if (nav.jumpTo) {
        nav.jumpTo(tabName);
      } else {
        nav.navigate(tabName);
      }
      return true;
    }
    nav = nav.getParent?.();
  }
  return false;
}

export function openPublicProfile(navigation, userId) {
  if (!userId || !navigation?.navigate) return;
  if (!navigateToAppScreen(navigation, 'PublicProfile', { userId })) {
    navigation.navigate('PublicProfile', { userId });
  }
}

export function openProfileTab(navigation, screen = 'ProfileHome', params) {
  navigateToTab(navigation, 'Profile', { screen, params });
}

export function openEventDetail(navigation, eventId, extraParams = {}) {
  if (!eventId) return;
  const params = { eventId, ...extraParams };
  if (!navigateToAppScreen(navigation, 'EventDetail', params)) {
    navigation.navigate('EventDetail', params);
  }
}

export function openEventDetailTab(navigation, eventId, tab, extraParams = {}) {
  openEventDetail(navigation, eventId, { initialTab: tab, ...extraParams });
}

export function openSquadDetail(navigation, squadId) {
  if (!squadId) return;
  navigateToTab(navigation, 'Squads', {
    screen: 'SquadDetail',
    params: { squadId },
  });
}

export function openMessages(navigation, initialTab = 'chats') {
  navigateToTab(navigation, 'Messages', {
    screen: 'MessagesHome',
    params: { initialTab },
  });
}

export function openCheckInScanner(navigation, eventId, eventTitle) {
  navigateToAppScreen(navigation, 'CheckInScanner', { eventId, eventTitle });
}

export function openCreatorDashboard(navigation) {
  navigateToAppScreen(navigation, 'CreatorDashboard');
}

export function openChat(navigation, userId, user) {
  navigateToTab(navigation, 'Messages', {
    screen: 'Chat',
    params: { userId, user },
  });
}

export function navigateToNotifications(navigation) {
  navigateToAppScreen(navigation, 'Notifications');
}
