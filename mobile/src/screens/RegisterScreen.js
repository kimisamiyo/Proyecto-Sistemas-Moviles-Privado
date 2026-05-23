import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/ui/Screen';
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import { colors, typography, spacing, radius, shadows } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    title: '',
  });
  const { register, isLoading, error, clearError } = useAuthStore();

  const update = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    clearError();
  };

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.firstName || !form.lastName) return;
    try {
      await register(form);
    } catch (_) {}
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.on_surface_variant} />
        </TouchableOpacity>
        <Text style={styles.brandSmall}>EventUs</Text>
        <View style={styles.back} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Únete a eventos con impacto social</Text>

          <View style={styles.card}>
            <AppInput
              icon="person-outline"
              placeholder="Nombre"
              value={form.firstName}
              onChangeText={(v) => update('firstName', v)}
            />
            <AppInput
              icon="person-outline"
              placeholder="Apellido"
              value={form.lastName}
              onChangeText={(v) => update('lastName', v)}
              style={{ marginTop: spacing.md }}
            />
            <AppInput
              icon="mail-outline"
              placeholder="Correo electrónico"
              value={form.email}
              onChangeText={(v) => update('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ marginTop: spacing.md }}
            />
            <AppInput
              icon="lock-closed-outline"
              placeholder="Contraseña (mín. 6)"
              value={form.password}
              onChangeText={(v) => update('password', v)}
              secureTextEntry
              style={{ marginTop: spacing.md }}
            />
            <AppInput
              icon="briefcase-outline"
              placeholder="Título o rol (opcional)"
              value={form.title}
              onChangeText={(v) => update('title', v)}
              style={{ marginTop: spacing.md }}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <AppButton
              title="Crear cuenta"
              onPress={handleRegister}
              loading={isLoading}
              style={{ marginTop: spacing.xl }}
            />
          </View>

          <Text style={styles.footer}>
            ¿Ya tienes cuenta?{' '}
            <Text style={styles.link} onPress={() => navigation.goBack()}>
              Iniciar sesión
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.surface },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  brandSmall: { ...typography.headline_md, color: colors.primary, fontWeight: '600' },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  title: { ...typography.headline_lg, color: colors.on_surface, marginTop: spacing.lg },
  subtitle: { ...typography.body_md, color: colors.on_surface_variant, marginTop: spacing.sm, marginBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    ...shadows.ambient,
  },
  error: { ...typography.body_sm, color: colors.error, marginTop: spacing.md, textAlign: 'center' },
  footer: { ...typography.body_md, color: colors.on_surface_variant, textAlign: 'center', marginTop: spacing.xl },
  link: { color: colors.primary, fontWeight: '600' },
});
