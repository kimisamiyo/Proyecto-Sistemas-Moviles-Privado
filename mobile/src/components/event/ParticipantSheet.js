import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AvatarImage from '../ui/AvatarImage';
import AppButton from '../ui/AppButton';
import { colors, typography, spacing, radius } from '../../theme/tokens';
import { useNetworkStore } from '../../store/networkStore';
import { parseApiErrors } from '../../utils/validators';

export default function ParticipantSheet({
  visible,
  participant,
  squad,
  isMe,
  mySquad,
  onClose,
  navigation,
}) {
  const { fetchConnectionStatus, sendConnectionRequest, acceptConnection } = useNetworkStore();
  const [status, setStatus] = useState('none');
  const [connectionId, setConnectionId] = useState(null);
  const [loading, setLoading] = useState(false);

  const userId = participant?._id || participant?.id;
  const p = participant?.profile || participant;
  const name = `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'Participante';

  useEffect(() => {
    if (visible && userId && !isMe) {
      (async () => {
        setLoading(true);
        const data = await fetchConnectionStatus(userId);
        setStatus(data?.status || 'none');
        setConnectionId(data?.connectionId || null);
        setLoading(false);
      })();
    }
  }, [visible, userId, isMe]);

  const openProfile = () => {
    onClose();
    navigation.navigate('PublicProfile', { userId });
  };

  const openSquad = () => {
    if (!squad?._id) return;
    onClose();
    navigation.navigate('SquadDetail', { squadId: squad._id });
  };

  const handleConnect = async () => {
    try {
      await sendConnectionRequest(userId);
      setStatus('pending_outgoing');
      Alert.alert('Solicitud enviada', 'Si acepta, podrás escribirle en Mensajes.');
    } catch (e) {
      Alert.alert('Error', parseApiErrors(e));
    }
  };

  const handleAccept = async () => {
    try {
      await acceptConnection(connectionId);
      setStatus('connected');
      Alert.alert('Conectados', 'Ya puedes chatear en la pestaña Mensajes.');
    } catch (e) {
      Alert.alert('Error', parseApiErrors(e));
    }
  };

  const openChat = () => {
    onClose();
    navigation.getParent()?.navigate('Messages', {
      screen: 'Chat',
      params: { userId, user: participant },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <AvatarImage
            uri={p?.avatar}
            size={64}
            initials={`${p?.firstName?.[0] || ''}${p?.lastName?.[0] || ''}`}
          />
          <Text style={styles.name}>{name}</Text>
          {p?.title ? <Text style={styles.title}>{p.title}</Text> : null}
        </View>

        {squad ? (
          <TouchableOpacity style={styles.squadCard} onPress={openSquad}>
            <Ionicons name="people" size={20} color={colors.primary} />
            <View style={styles.squadInfo}>
              <Text style={styles.squadLabel}>Escuadra</Text>
              <Text style={styles.squadTitle}>{squad.name}</Text>
              <Text style={styles.squadSub} numberOfLines={2}>
                {squad.plan}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.outline} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.noSquad}>Sin escuadra en este evento</Text>
        )}

        {mySquad && squad && String(mySquad._id) !== String(squad._id) ? (
          <Text style={styles.switchHint}>
            Tu escuadra actual: {mySquad.name}. Puedes cambiar uniéndote a otra desde Escuadras.
          </Text>
        ) : null}

        {!isMe ? (
          <View style={styles.actions}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : status === 'connected' ? (
              <>
                <AppButton title="Enviar mensaje" onPress={openChat} />
                <AppButton title="Ver perfil" variant="outline" onPress={openProfile} />
              </>
            ) : status === 'pending_incoming' ? (
              <>
                <AppButton title="Aceptar solicitud" onPress={handleAccept} />
                <AppButton title="Ver perfil" variant="outline" onPress={openProfile} />
              </>
            ) : status === 'pending_outgoing' ? (
              <Text style={styles.pending}>Solicitud pendiente de respuesta</Text>
            ) : (
              <>
                <AppButton title="Conectar" onPress={handleConnect} />
                <AppButton title="Ver perfil" variant="outline" onPress={openProfile} />
              </>
            )}
          </View>
        ) : (
          <AppButton title="Cerrar" variant="outline" onPress={onClose} />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: colors.surface_container_high,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outline,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  name: { ...typography.headline_md, color: colors.on_surface, marginTop: spacing.sm },
  title: { ...typography.body_sm, color: colors.primary },
  squadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
  },
  squadInfo: { flex: 1 },
  squadLabel: { ...typography.label_sm, color: colors.outline },
  squadTitle: { ...typography.title_md, color: colors.on_surface },
  squadSub: { ...typography.body_sm, color: colors.on_surface_variant, marginTop: 2 },
  noSquad: { ...typography.body_md, color: colors.outline, marginBottom: spacing.md },
  switchHint: { ...typography.body_sm, color: colors.secondary, marginBottom: spacing.md },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  pending: { ...typography.body_md, color: colors.on_surface_variant, textAlign: 'center' },
});
