import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, Dimensions, RefreshControl, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useEventusStore } from '../store/eventusStore';
import FadeInView from '../components/ui/FadeInView';
import PressableScale from '../components/ui/PressableScale';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - spacing.xl * 2 - spacing.md * 2) / 3;

const PRESET_PHOTOS = [
  { url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600', label: 'Auditorio Universitario' },
  { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600', label: 'Seminario de Tecnología' },
  { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600', label: 'Taller Colaborativo' },
  { url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=600', label: 'Investigación de Campo' },
  { url: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=600', label: 'Ponencia Magistral' },
  { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=600', label: 'Mesa de Trabajo' },
];

export default function EventAlbumScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { eventId, eventTitle } = route.params;
  const { album, fetchAlbum, addAlbumPhoto, isLoading } = useEventusStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);
  const [isUploadVisible, setIsUploadVisible] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');

  useEffect(() => {
    fetchAlbum(eventId).catch(() => {});
  }, [eventId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAlbum(eventId);
    } catch {}
    setRefreshing(false);
  }, [eventId]);

  const handleAddPhoto = async () => {
    const finalUrl = photoUrl.trim();
    if (!finalUrl) {
      Alert.alert('Error', 'Por favor ingresa una URL de foto o selecciona un preset.');
      return;
    }

    try {
      await addAlbumPhoto(eventId, finalUrl, photoCaption.trim());
      setIsUploadVisible(false);
      setPhotoUrl('');
      setPhotoCaption('');
      Alert.alert('¡Éxito!', 'Foto agregada al álbum colaborativo.');
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo subir la foto.');
    }
  };

  const selectPreset = (url, label) => {
    setPhotoUrl(url);
    if (!photoCaption) {
      setPhotoCaption(label);
    }
  };

  const renderPhotoItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={() => setActivePhoto(item)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: item.url }} style={styles.thumbnail} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.on_surface} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>ÁLBUM COLABORATIVO</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{eventTitle}</Text>
        </View>
        <TouchableOpacity style={styles.addBtnSmall} onPress={() => setIsUploadVisible(true)}>
          <Ionicons name="add" size={24} color={colors.on_primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={album?.photos || []}
        keyExtractor={(item) => item._id || Math.random().toString()}
        renderItem={renderPhotoItem}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          isLoading && !refreshing ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={48} color={colors.outline} />
              <Text style={styles.emptyText}>El álbum está vacío. ¡Comparte la primera foto!</Text>
            </View>
          )
        }
      />

      {/* Upload Dialog Modal */}
      <Modal visible={isUploadVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Recuerdo</Text>
              <TouchableOpacity onPress={() => setIsUploadVisible(false)}>
                <Ionicons name="close" size={22} color={colors.outline} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Presets Selector */}
              <Text style={styles.inputLabel}>SELECCIONA UN PRESET REALISTA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
                {PRESET_PHOTOS.map((p, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.presetCard, photoUrl === p.url && styles.presetCardActive]}
                    onPress={() => selectPreset(p.url, p.label)}
                  >
                    <Image source={{ uri: p.url }} style={styles.presetImage} />
                    <Text style={styles.presetLabel} numberOfLines={1}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>O INGRESA UNA URL PERSONALIZADA</Text>
              <TextInput
                style={styles.input}
                placeholder="https://ejemplo.com/foto.jpg"
                placeholderTextColor={colors.outline}
                value={photoUrl}
                onChangeText={setPhotoUrl}
              />

              <Text style={styles.inputLabel}>DESCRIPCIÓN DE LA IMAGEN</Text>
              <TextInput
                style={styles.input}
                placeholder="Describiendo este momento académico..."
                placeholderTextColor={colors.outline}
                value={photoCaption}
                onChangeText={setPhotoCaption}
              />

              <PressableScale style={styles.publishBtn} onPress={handleAddPhoto}>
                <Text style={styles.publishBtnText}>AÑADIR A RECUERDOS</Text>
              </PressableScale>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Lightbox Modal */}
      {activePhoto && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.lightboxOverlay}>
            <View style={styles.lightboxHeader}>
              <View style={styles.lightboxUploader}>
                <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
                <Text style={styles.lightboxUploaderName}>
                  {activePhoto.uploader
                    ? `${activePhoto.uploader.profile?.firstName} ${activePhoto.uploader.profile?.lastName}`
                    : 'Invitado'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActivePhoto(null)} style={styles.lightboxClose}>
                <Ionicons name="close" size={28} color={colors.on_surface} />
              </TouchableOpacity>
            </View>

            <Image source={{ uri: activePhoto.url }} style={styles.lightboxImage} resizeMode="contain" />

            {activePhoto.caption ? (
              <View style={styles.lightboxFooter}>
                <Text style={styles.lightboxCaption}>{activePhoto.caption}</Text>
              </View>
            ) : null}
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface_container_high,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  headerLabel: { ...typography.label_sm, color: colors.outline, letterSpacing: 2 },
  headerTitle: { ...typography.display_sm, color: colors.on_surface },
  addBtnSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  row: { gap: spacing.md, marginBottom: spacing.md },
  photoContainer: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface_container_high,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 180, gap: spacing.md },
  emptyText: { ...typography.body_md, color: colors.outline, textAlign: 'center', paddingHorizontal: spacing.xl },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface_container_high,
    borderRadius: radius.xl,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: { ...typography.headline_lg, color: colors.on_surface },
  inputLabel: { ...typography.label_sm, color: colors.secondary, letterSpacing: 1, marginTop: spacing.md, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.on_surface,
    ...typography.body_md,
    marginBottom: spacing.md,
  },
  presetsRow: { gap: spacing.md, paddingBottom: spacing.sm },
  presetCard: {
    width: 100,
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.lg,
    padding: spacing.xs,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  presetCardActive: { borderColor: colors.primary },
  presetImage: { width: 90, height: 60, borderRadius: radius.md, marginBottom: spacing.xs },
  presetLabel: { ...typography.body_sm, color: colors.secondary, fontSize: 10, textAlign: 'center', width: '100%' },
  publishBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  publishBtnText: { ...typography.label_lg, color: colors.on_primary, fontWeight: '700' },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  lightboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  lightboxClose: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxUploader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lightboxUploaderName: { ...typography.title_md, color: colors.on_surface },
  lightboxImage: {
    flex: 1,
    width: '100%',
  },
  lightboxFooter: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  lightboxCaption: { ...typography.body_lg, color: colors.on_surface, textAlign: 'center' },
});
