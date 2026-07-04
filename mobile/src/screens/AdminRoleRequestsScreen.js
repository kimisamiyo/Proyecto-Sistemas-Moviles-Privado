import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import AvatarImage from '../components/ui/AvatarImage';
import client from '../api/client';
import { parseApiErrors } from '../utils/validators';

export default function AdminRoleRequestsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/role-requests/pending');
      setRequests(data.requests || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const handleReview = (item, action) => {
    const title = action === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud';
    const msg = action === 'approve'
      ? `¿Aprobar a ${item.user?.profile?.firstName || 'este usuario'} como ${item.requestedRole}?`
      : `¿Rechazar la solicitud de ${item.user?.profile?.firstName || 'este usuario'}?`;

    Alert.alert(title, msg, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: action === 'approve' ? 'Aprobar' : 'Rechazar',
        style: action === 'approve' ? 'default' : 'destructive',
        onPress: async () => {
          try {
            await client.patch(`/role-requests/${item._id}`, { action });
            Alert.alert('Listo', action === 'approve' ? 'Solicitud aprobada.' : 'Solicitud rechazada.');
            load();
          } catch (e) {
            Alert.alert('Error', parseApiErrors(e));
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const u = item.user;
    const p = u?.profile || {};
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AvatarImage uri={p.avatar} initials={`${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`} size={44} />
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.cardName}>{p.firstName} {p.lastName}</Text>
            <Text style={styles.cardEmail}>{u?.email}</Text>
            <Text style={styles.cardRole}>Rol actual: {u?.role} → solicita: {item.requestedRole}</Text>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Motivación:</Text>
          <Text style={styles.fieldValue}>{item.reason}</Text>
        </View>
        {item.experience ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Experiencia:</Text>
            <Text style={styles.fieldValue}>{item.experience}</Text>
          </View>
        ) : null}
        {item.organization ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Organización:</Text>
            <Text style={styles.fieldValue}>{item.organization}</Text>
          </View>
        ) : null}
        <Text style={styles.cardDate}>
          Enviada: {new Date(item.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.approveBtn} onPress={() => handleReview(item, 'approve')}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.approveBtnText}>Aprobar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReview(item, 'reject')}>
            <Ionicons name="close" size={18} color={colors.error} />
            <Text style={styles.rejectBtnText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Solicitudes de rol</Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-outline" size={48} color={colors.outline} />
              <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline_variant,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', ...typography.headline_md, color: colors.primary },
  list: { padding: spacing.lg, paddingBottom: 80 },
  card: {
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline_variant,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  cardHeaderInfo: { flex: 1 },
  cardName: { ...typography.title_lg, color: colors.on_surface },
  cardEmail: { ...typography.body_sm, color: colors.outline },
  cardRole: { ...typography.label_sm, color: colors.secondary, marginTop: 2 },
  fieldRow: { marginBottom: spacing.sm },
  fieldLabel: { ...typography.label_sm, color: colors.outline, marginBottom: 2 },
  fieldValue: { ...typography.body_md, color: colors.on_surface },
  cardDate: { ...typography.label_sm, color: colors.outline, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  approveBtnText: { ...typography.label_lg, color: '#fff' },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  rejectBtnText: { ...typography.label_lg, color: colors.error },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { ...typography.body_md, color: colors.outline },
});
