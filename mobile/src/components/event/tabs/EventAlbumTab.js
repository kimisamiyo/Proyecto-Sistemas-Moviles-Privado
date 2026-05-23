import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventusStore } from '../../../store/eventusStore';
import { useAuthStore } from '../../../store/authStore';
import AppInput from '../../ui/AppInput';
import AppButton from '../../ui/AppButton';
import { colors, typography, spacing, radius } from '../../../theme/tokens';
import { pickAndUploadAlbumPhoto } from '../../../utils/mediaUpload';
import { canModerateEventAlbum } from '../../../utils/eventPermissions';
import { parseApiErrors } from '../../../utils/validators';
import resolveMediaUrl from '../../../utils/resolveMediaUrl';

export default function EventAlbumTab({ eventId, event, embedInScroll = false }) {
  const { album, albumMeta, fetchAlbum, postAlbumPhoto, reviewAlbumPhoto } = useEventusStore();
  const { user } = useAuthStore();
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const canModerate = albumMeta?.canModerate || canModerateEventAlbum(user, event);
  const moderationQueue = albumMeta?.moderationQueue || [];
  const publishedPhotos = (album?.photos || []).filter(
    (p) => p.status === 'approved' || (!p.status && !canModerate)
  );

  useEffect(() => {
    fetchAlbum(eventId);
  }, [eventId]);

  const handlePickGallery = async () => {
    setUploading(true);
    try {
      const uploaded = await pickAndUploadAlbumPhoto();
      if (!uploaded) {
        setUploading(false);
        return;
      }
      const data = await postAlbumPhoto(eventId, uploaded.url, caption.trim());
      setCaption('');
      Alert.alert(
        'En revisión',
        data.message || 'Tu foto se publicará cuando un moderador u organizador la apruebe.'
      );
    } catch (e) {
      Alert.alert('Error', parseApiErrors(e));
    } finally {
      setUploading(false);
    }
  };

  const handleReview = async (photoId, action) => {
    try {
      if (action === 'reject') {
        Alert.alert('Rechazar foto', '¿Motivo del rechazo?', [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Rechazar',
            style: 'destructive',
            onPress: async () => {
              await reviewAlbumPhoto(eventId, photoId, 'reject');
              Alert.alert('Listo', 'Foto rechazada.');
            },
          },
        ]);
        return;
      }
      await reviewAlbumPhoto(eventId, photoId, 'approve');
      Alert.alert('Publicada', 'La foto ya es visible para todos.');
    } catch (e) {
      Alert.alert('Error', parseApiErrors(e));
    }
  };

  const renderModerationCard = (item) => (
    <View key={String(item._id)} style={styles.modCard}>
      <Image source={{ uri: resolveMediaUrl(item.url) }} style={styles.modThumb} />
      <View style={styles.modInfo}>
        <Text style={styles.modName} numberOfLines={1}>
          {item.uploader?.profile?.firstName || 'Usuario'} — pendiente
        </Text>
        {item.caption ? <Text style={styles.modCaption}>{item.caption}</Text> : null}
        <View style={styles.modActions}>
          <TouchableOpacity style={styles.approveBtn} onPress={() => handleReview(item._id, 'approve')}>
            <Ionicons name="checkmark" size={18} color={colors.on_primary} />
            <Text style={styles.approveText}>Aprobar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReview(item._id, 'reject')}>
            <Ionicons name="close" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const listHeader = (
    <View>
      <View style={styles.upload}>
        <Text style={styles.uploadTitle}>Subir recuerdo</Text>
        <Text style={styles.uploadHint}>
          Elige una foto de tu galería. No se publica al instante: pasa por validación del organizador o un
          moderador.
        </Text>
        <AppInput
          placeholder="Comentario (opcional)"
          value={caption}
          onChangeText={setCaption}
          icon="chatbubble-outline"
        />
        <AppButton
          title="Elegir de la galería"
          onPress={handlePickGallery}
          loading={uploading}
          style={{ marginTop: spacing.md }}
        />
        {albumMeta?.myPendingCount > 0 ? (
          <View style={styles.pendingBadge}>
            <Ionicons name="time-outline" size={16} color={colors.secondary} />
            <Text style={styles.pendingText}>{albumMeta.myPendingCount} foto(s) en revisión</Text>
          </View>
        ) : null}
      </View>
      {canModerate && moderationQueue.length > 0 ? (
        <View style={styles.modSection}>
          <Text style={styles.modSectionTitle}>Cola de moderación ({moderationQueue.length})</Text>
          {moderationQueue.map(renderModerationCard)}
        </View>
      ) : null}
      {publishedPhotos.length > 0 ? <Text style={styles.gridTitle}>Recuerdos publicados</Text> : null}
    </View>
  );

  if (embedInScroll) {
    return (
      <View style={styles.wrapEmbedded}>
        {listHeader}
        {publishedPhotos.length ? (
          <View style={[styles.grid, styles.row, { flexWrap: 'wrap' }]}>
            {publishedPhotos.map((item, i) => (
              <Image
                key={String(item._id || i)}
                source={{ uri: resolveMediaUrl(item.url) }}
                style={[styles.thumb, { width: '31%', marginBottom: spacing.xs }]}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>
            {albumMeta?.myPendingCount > 0
              ? 'Tienes fotos en revisión. Aparecerán aquí al ser aprobadas.'
              : 'Aún no hay recuerdos publicados.'}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <FlatList
        style={styles.listFlex}
        data={publishedPhotos}
        numColumns={3}
        keyExtractor={(item, i) => String(item._id || i)}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {albumMeta?.myPendingCount > 0
              ? 'Tienes fotos en revisión. Aparecerán aquí al ser aprobadas.'
              : 'Aún no hay recuerdos publicados.'}
          </Text>
        }
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <Image source={{ uri: resolveMediaUrl(item.url) }} style={styles.thumb} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  wrapEmbedded: { paddingBottom: spacing.xxl },
  listFlex: { flex: 1 },
  upload: { padding: spacing.lg, marginBottom: spacing.md },
  uploadTitle: { ...typography.title_md, color: colors.on_surface, marginBottom: spacing.xs },
  uploadHint: { ...typography.body_sm, color: colors.outline, marginBottom: spacing.md },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.lg,
  },
  pendingText: { ...typography.body_sm, color: colors.secondary },
  modSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  modSectionTitle: { ...typography.title_md, color: colors.on_surface, marginBottom: spacing.md },
  modCard: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.xl,
  },
  modThumb: { width: 72, height: 72, borderRadius: radius.md },
  modInfo: { flex: 1 },
  modName: { ...typography.label_md, color: colors.on_surface },
  modCaption: { ...typography.body_sm, color: colors.outline, marginTop: 2 },
  modActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  approveText: { ...typography.label_sm, color: colors.on_primary },
  rejectBtn: {
    padding: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.error,
  },
  gridTitle: {
    ...typography.label_md,
    color: colors.on_surface_variant,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  grid: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  row: { gap: spacing.xs, marginBottom: spacing.xs },
  thumb: { flex: 1, aspectRatio: 1, borderRadius: radius.md, backgroundColor: colors.surface_container_high },
  empty: { ...typography.body_md, color: colors.outline, textAlign: 'center', padding: spacing.xxl },
});
