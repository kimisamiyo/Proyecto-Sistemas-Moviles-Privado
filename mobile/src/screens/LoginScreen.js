import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const { t } = useLanguageStore();

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      await login(email.trim(), password);
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.header}>
          <View style={styles.logoMark}>
            <View style={styles.logoInner} />
          </View>
          <Text style={styles.tagline}>{t.auth.tagline}</Text>
          <Text style={styles.subtitle}>{t.auth.subtitle}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.auth.institutionalEmail}</Text>
            <TextInput
              style={[styles.input, email ? styles.inputActive : null]}
              value={email}
              onChangeText={(txt) => { setEmail(txt); clearError(); }}
              placeholder={t.auth.emailPlaceholder}
              placeholderTextColor={colors.outline}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.auth.accessKey}</Text>
            <TextInput
              style={[styles.input, password ? styles.inputActive : null]}
              value={password}
              onChangeText={(txt) => { setPassword(txt); clearError(); }}
              placeholder={t.auth.passwordPlaceholder}
              placeholderTextColor={colors.outline}
              secureTextEntry
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.primary, colors.primary_container]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginButton}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.on_primary} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>{t.auth.accessPlatform}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
            <Text style={styles.registerText}>
              {t.auth.newHere} <Text style={styles.registerHighlight}>{t.auth.createCredentials}</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.demoHint}>
            <Text style={styles.demoText}>{t.auth.demo}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xxxl },
  logoMark: {
    width: 64, height: 64, borderRadius: radius.lg,
    backgroundColor: colors.surface_container_high,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl,
  },
  logoInner: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: colors.primary, opacity: 0.8 },
  tagline: { ...typography.label_sm, color: colors.secondary, marginBottom: spacing.sm, letterSpacing: 3 },
  subtitle: { ...typography.body_md, color: colors.outline },
  form: { gap: spacing.lg },
  inputGroup: { gap: spacing.xs },
  inputLabel: { ...typography.label_sm, color: colors.secondary, marginLeft: spacing.xs },
  input: {
    backgroundColor: colors.surface_container_low, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 15, color: colors.on_surface,
  },
  inputActive: {
    backgroundColor: colors.surface_container_highest,
    borderWidth: 1, borderColor: 'rgba(193, 199, 207, 0.4)',
  },
  errorContainer: { backgroundColor: colors.error_container, borderRadius: radius.md, padding: spacing.md },
  errorText: { ...typography.body_sm, color: colors.error, textAlign: 'center' },
  loginButton: { borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: spacing.sm },
  loginButtonText: { ...typography.label_lg, color: colors.on_primary, fontWeight: '700' },
  registerLink: { alignItems: 'center', paddingVertical: spacing.md },
  registerText: { ...typography.body_md, color: colors.outline },
  registerHighlight: { color: colors.primary, fontWeight: '600' },
  demoHint: { alignItems: 'center', paddingVertical: spacing.sm, marginTop: spacing.sm },
  demoText: { ...typography.body_sm, color: colors.outline_variant },
});
