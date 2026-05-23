import { Platform } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

/** Debe coincidir con tabBarStyle.height en MainNavigator */
export const DEFAULT_TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 64;
const TAB_BAR_EXTRA = 12;

/** Layout helpers tuned for phones like Galaxy S24 FE (~360–412dp wide). */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarFromNav = useBottomTabBarHeight();
  const tabBarHeight = tabBarFromNav > 0 ? tabBarFromNav : DEFAULT_TAB_BAR_HEIGHT;
  const tabBarSpace = tabBarHeight + TAB_BAR_EXTRA;

  const horizontalPad = Math.max(16, Math.round(width * 0.048));
  const hCardWidth = Math.min(Math.round(width * 0.82), 340);
  const liveCardWidth = Math.min(Math.round(width * 0.88), 360);
  const squadCardWidth = Math.min(Math.round(width * 0.86), 340);
  const bottomInset = insets.bottom + TAB_BAR_EXTRA;

  return {
    width,
    height,
    insets,
    horizontalPad,
    hCardWidth,
    liveCardWidth,
    squadCardWidth,
    tabBarHeight,
    tabBarSpace,
    bottomInset,
    isCompact: width < 380,
  };
}

export function hashSeed(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}
