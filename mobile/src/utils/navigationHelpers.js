/**
 * Abre perfil público en el stack actual (Feed, Messages, Events, etc.).
 */
export function openPublicProfile(navigation, userId) {
  if (!userId || !navigation?.navigate) return;
  navigation.navigate('PublicProfile', { userId });
}

/**
 * Cambia al tab Perfil (p. ej. Mis entradas).
 */
export function openProfileTab(navigation, screen = 'ProfileHome', params) {
  const tab = navigation.getParent?.();
  if (!tab?.navigate) return;
  tab.navigate('Profile', { screen, params });
}
