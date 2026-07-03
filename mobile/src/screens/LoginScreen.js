import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Screen from '../components/ui/Screen';
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import { colors, typography, spacing, radius, shadows } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      await login(email.trim(), password);
    } catch (_) {}
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.blobA} />
      <View style={styles.blobB} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.logo}>EventUs</Text>
            <Text style={styles.tagline}>Conecta con propósito</Text>
          </View>

          <View style={styles.card}>
            <AppInput
              icon="mail-outline"
              placeholder="Correo electrónico"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                clearError();
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <AppInput
              icon="lock-closed-outline"
              placeholder="Contraseña"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                clearError();
              }}
              secureTextEntry
              style={{ marginTop: spacing.lg }}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <AppButton
              title="Acceder"
              onPress={handleLogin}
              loading={isLoading}
              style={{ marginTop: spacing.xl }}
            />
          </View>

          <Text style={styles.footer}>
            ¿Aún no eres parte?{' '}
            <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
              Crear cuenta
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.surface_bright },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  blobA: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(63, 100, 108, 0.08)',
  },
  blobB: {
    position: 'absolute',
    bottom: -100,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(232, 226, 216, 0.5)',
  },
  brand: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 42,
    color: colors.primary,
    letterSpacing: -1,
  },
  tagline: { ...typography.headline_md, color: colors.on_surface_variant, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    ...shadows.float,
  },
  error: {
    ...typography.body_sm,
    color: colors.error,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  footer: {
    ...typography.body_md,
    color: colors.on_surface_variant,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  link: { color: colors.primary, fontWeight: '600' },
});
