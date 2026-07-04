import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import MainNavigator from './src/navigation/MainNavigator';
import { useAuthStore } from './src/store/authStore';
import { colors } from './src/theme/tokens';
import * as Sentry from '@sentry/react-native';

if (!__DEV__) {
  Sentry.init({
    dsn: 'https://ceeea4a88fe54c2675a2d43cd308f519@o4511437324419072.ingest.us.sentry.io/4511437335363584',
    sendDefaultPii: true,
    enableLogs: true,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
  });
}

function BootSplash() {
  return (
    <View style={styles.boot}>
      <Text style={styles.bootLogo}>EventUs</Text>
      <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
    </View>
  );
}

const wrapper = __DEV__ ? (c) => c : Sentry.wrap;
export default wrapper(function App() {
  const [fontsLoaded] = useFonts({
    Manrope: Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
    'Manrope-ExtraBold': Manrope_800ExtraBold,
  });
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  useEffect(() => {
    hydrate();
  }, []);

  if (!fontsLoaded || isHydrating) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={colors.background} />
        <BootSplash />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <MainNavigator />
    </SafeAreaProvider>
  );
});

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bootLogo: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    color: colors.primary,
  },
});
