import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';

export default function RegisterScreen({ navigation }) {
  const { t } = useLanguageStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', title: '' });
  const { register, isLoading, error, clearError } = useAuthStore();

  const updateField = (field, value) => { setForm(prev => ({ ...prev, [field]: value })); clearError(); };

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.firstName || !form.lastName) return;
    try { await register(form); } catch (e) {}
  };

  const fields = [
    { key: 'firstName', label: t.auth.firstName, placeholder: 'Elena' },
    { key: 'lastName', label: t.auth.lastName, placeholder: 'Rostova' },
    { key: 'email', label: t.auth.institutionalEmail, placeholder: t.auth.emailPlaceholder, keyboard: 'email-address' },
    { key: 'password', label: t.auth.accessKey, placeholder: 'Mín. 6 caracteres', secure: true },
    { key: 'title', label: t.auth.academicTitle, placeholder: t.auth.titlePlaceholder },
  ];

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.tagline}>{t.auth.registerTitle}</Text>
            <Text style={styles.subtitle}>{t.auth.registerSubtitle}</Text>
          </View>
          <View style={styles.form}>
            {fields.map((f) => (
              <View key={f.key} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{f.label}</Text>
                <TextInput
                  style={[styles.input, form[f.key] ? styles.inputActive : null]}
                  value={form[f.key]} onChangeText={(txt) => updateField(f.key, txt)}
                  placeholder={f.placeholder} placeholderTextColor={colors.outline}
                  keyboardType={f.keyboard || 'default'} secureTextEntry={f.secure}
                  autoCapitalize={f.key === 'email' ? 'none' : 'words'}
                />
              </View>
            ))}
            {error && (<View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>)}
            <TouchableOpacity onPress={handleRegister} disabled={isLoading} activeOpacity={0.85}>
              <LinearGradient colors={[colors.primary, colors.primary_container]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.registerButton}>
                {isLoading ? <ActivityIndicator color={colors.on_primary} size="small" /> : <Text style={styles.registerButtonText}>{t.auth.createAccount}</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
              <Text style={styles.loginText}>
                {t.auth.alreadyRegistered} <Text style={styles.loginHighlight}>{t.auth.accessPlatform}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxxl },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  tagline: { ...typography.label_sm, color: colors.secondary, letterSpacing: 3, marginBottom: spacing.sm },
  subtitle: { ...typography.body_md, color: colors.outline },
  form: { gap: spacing.lg },
  inputGroup: { gap: spacing.xs },
  inputLabel: { ...typography.label_sm, color: colors.secondary, marginLeft: spacing.xs },
  input: { backgroundColor: colors.surface_container_low, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 15, color: colors.on_surface },
  inputActive: { backgroundColor: colors.surface_container_highest, borderWidth: 1, borderColor: 'rgba(193, 199, 207, 0.4)' },
  errorContainer: { backgroundColor: colors.error_container, borderRadius: radius.md, padding: spacing.md },
  errorText: { ...typography.body_sm, color: colors.error, textAlign: 'center' },
  registerButton: { borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: spacing.sm },
  registerButtonText: { ...typography.label_lg, color: colors.on_primary, fontWeight: '700' },
  loginLink: { alignItems: 'center', paddingVertical: spacing.md },
  loginText: { ...typography.body_md, color: colors.outline },
  loginHighlight: { color: colors.primary, fontWeight: '600' },
});
