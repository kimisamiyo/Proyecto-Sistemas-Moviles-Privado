import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import AppButton from '../components/ui/AppButton';
import AppInput from '../components/ui/AppInput';
import { parseApiErrors } from '../utils/validators';
import client from '../api/client';

export default function RequestOrganizerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');
  const [experience, setExperience] = useState('');
  const [organization, setOrganization] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkExisting();
  }, []);

  const checkExisting = async () => {
    try {
      const { data } = await client.get('/role-requests/my');
      const pending = data.requests?.find((r) => r.status === 'pending');
      const lastApproved = data.requests?.find((r) => r.status === 'approved');
      if (pending) setExistingRequest(pending);
      else if (lastApproved) setExistingRequest(lastApproved);
    } catch {}
    setCheckingStatus(false);
  };

  const handleSubmit = async () => {
    if (reason.trim().length < 10) {
      Alert.alert('Campo requerido', 'Explica con al menos 10 caracteres por qué quieres ser organizador.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post('/role-requests', {
        requestedRole: 'organizer',
        reason: reason.trim(),
        experience: experience.trim(),
        organization: organization.trim(),
      });
      Alert.alert('Solicitud enviada', data.message || 'Un administrador revisará tu solicitud.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', parseApiErrors(e));
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  if (existingRequest?.status === 'pending') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Solicitud pendiente</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="time-outline" size={56} color={colors.secondary} />
          <Text style={styles.pendingTitle}>Tu solicitud está en revisión</Text>
          <Text style={styles.pendingBody}>
            Enviaste tu solicitud el{' '}
            {new Date(existingRequest.createdAt).toLocaleDateString('es-PE', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            . Un administrador la revisará pronto.
          </Text>
          <AppButton title="Volver" onPress={() => navigation.goBack()} style={{ marginTop: spacing.xl }} />
        </View>
      </View>
    );
  }

  if (existingRequest?.status === 'approved') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Solicitud aprobada</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
          <Text style={styles.pendingTitle}>¡Ya eres organizador!</Text>
          <Text style={styles.pendingBody}>
            Tu solicitud fue aprobada. Ahora puedes crear eventos desde el Feed o tu Perfil.
          </Text>
          <AppButton title="Ir al Feed" onPress={() => navigation.goBack()} style={{ marginTop: spacing.xl }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Ser organizador</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.heroCard}>
          <Ionicons name="megaphone-outline" size={32} color={colors.primary} />
          <Text style={styles.heroTitle}>Solicita ser organizador</Text>
          <Text style={styles.heroSub}>
            Como organizador podrás crear y gestionar eventos en EventUs. Un administrador revisará tu solicitud.
          </Text>
        </View>

        <Text style={styles.fieldLabel}>¿Por qué quieres ser organizador? *</Text>
        <AppInput
          icon="document-text-outline"
          placeholder="Cuéntanos tu motivación (mín. 10 caracteres)"
          value={reason}
          onChangeText={setReason}
          multiline
          style={{ marginBottom: spacing.lg }}
        />

        <Text style={styles.fieldLabel}>Experiencia organizando eventos (opcional)</Text>
        <AppInput
          icon="briefcase-outline"
          placeholder="Eventos que has organizado antes, si aplica"
          value={experience}
          onChangeText={setExperience}
          multiline
          style={{ marginBottom: spacing.lg }}
        />

        <Text style={styles.fieldLabel}>Organización o grupo (opcional)</Text>
        <AppInput
          icon="business-outline"
          placeholder="Nombre de tu organización o colectivo"
          value={organization}
          onChangeText={setOrganization}
          style={{ marginBottom: spacing.xl }}
        />

        <AppButton
          title="Enviar solicitud"
          onPress={handleSubmit}
          loading={loading}
        />

        <Text style={styles.disclaimer}>
          Tu solicitud será revisada por un administrador. Recibirás una notificación con la respuesta.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline_variant,
    backgroundColor: colors.surface,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', ...typography.headline_md, color: colors.primary },
  form: { padding: spacing.xl, paddingBottom: 80 },
  heroCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.outline_variant,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  heroTitle: { ...typography.headline_md, color: colors.on_surface },
  heroSub: { ...typography.body_md, color: colors.on_surface_variant, textAlign: 'center' },
  fieldLabel: { ...typography.label_md, color: colors.on_surface_variant, marginBottom: spacing.sm },
  disclaimer: {
    ...typography.body_sm,
    color: colors.outline,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: { ...typography.body_md, color: colors.outline },
  pendingTitle: { ...typography.headline_md, color: colors.on_surface, textAlign: 'center' },
  pendingBody: { ...typography.body_md, color: colors.on_surface_variant, textAlign: 'center' },
});
