import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useEventusStore } from '../store/eventusStore';
import FadeInView from '../components/ui/FadeInView';
import PressableScale from '../components/ui/PressableScale';

const POST_TYPES = [
  { key: 'all', label: 'Todo' },
  { key: 'general', label: 'General' },
  { key: 'logistics', label: 'Logística' },
  { key: 'icebreaker', label: 'Rompehielos' },
  { key: 'question', label: 'Preguntas' },
  { key: 'announcement', label: 'Anuncio' },
];

export default function EventWallScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { eventId, eventTitle } = route.params;
  const { wall, fetchWall, postToWall, isLoading } = useEventusStore();

  const [activeFilter, setActiveFilter] = useState('all');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedType, setSelectedType] = useState('general');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWall(eventId).catch(() => {});
  }, [eventId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchWall(eventId);
    } catch {}
    setRefreshing(false);
  }, [eventId]);

  const handlePost = async () => {
    if (!newPostContent.trim()) return;
    if (newPostContent.trim().length < 2) {
      Alert.alert('Error', 'La publicación debe tener al menos 2 caracteres.');
      return;
    }

    try {
      await postToWall(eventId, newPostContent.trim(), selectedType);
      setNewPostContent('');
      Alert.alert('¡Publicado!', 'Tu aporte está en el muro.');
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo publicar.');
    }
  };

  const getFilteredPosts = () => {
    if (!wall?.posts) return [];
    if (activeFilter === 'all') return [...wall.posts].reverse();
    return wall.posts.filter((p) => p.type === activeFilter).reverse();
  };

  const renderPostItem = ({ item, index }) => {
    const authorName = item.author
      ? `${item.author.profile?.firstName || ''} ${item.author.profile?.lastName || ''}`
      : 'Participante';
    const initials = item.author
      ? `${item.author.profile?.firstName?.[0] || ''}${item.author.profile?.lastName?.[0] || ''}`
      : 'P';
    const formattedDate = new Date(item.createdAt).toLocaleDateString('es-PE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const typeLabels = {
      general: 'General',
      logistics: 'Logística',
      icebreaker: 'Rompehielos',
      question: 'Pregunta',
      announcement: 'Anuncio',
    };

    return (
      <FadeInView delay={index * 40} style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.authorAvatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.authorMeta}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.postTime}>{formattedDate}</Text>
          </View>
          <View style={[styles.typeBadge, styles[`typeBadge_${item.type}`]]}>
            <Text style={styles.typeBadgeText}>{typeLabels[item.type || 'general']}</Text>
          </View>
        </View>
        <Text style={styles.postContent}>{item.content}</Text>
      </FadeInView>
    );
  };

  const filteredPosts = getFilteredPosts();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.on_surface} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>MURO DEL EVENTO</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{eventTitle}</Text>
        </View>
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={POST_TYPES}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(item.key)}
            >
              <Text style={[styles.filterText, activeFilter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Posts List */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item._id || Math.random().toString()}
        renderItem={renderPostItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          isLoading && !refreshing ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.outline} />
              <Text style={styles.emptyText}>No hay publicaciones en este filtro.</Text>
            </View>
          )
        }
      />

      {/* Composer Footer */}
      <View style={[styles.composerContainer, { paddingBottom: Math.max(spacing.lg, insets.bottom) }]}>
        {/* Post Type Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeSelectorScroll}>
          {POST_TYPES.filter(t => t.key !== 'all').map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeSelectBtn, selectedType === t.key && styles.typeSelectBtnActive]}
              onPress={() => setSelectedType(t.key)}
            >
              <Text style={[styles.typeSelectText, selectedType === t.key && styles.typeSelectTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Aporta al muro... (logística, preguntas...)"
            placeholderTextColor={colors.outline}
            value={newPostContent}
            onChangeText={setNewPostContent}
            multiline
            maxLength={1000}
          />
          <PressableScale style={styles.sendBtn} onPress={handlePost}>
            <Ionicons name="send" size={18} color={colors.on_primary} />
          </PressableScale>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  filterRow: { marginBottom: spacing.md },
  filterScroll: { paddingHorizontal: spacing.xl, gap: spacing.xs },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface_container_low,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { ...typography.label_md, color: colors.secondary },
  filterTextActive: { color: colors.on_primary, fontWeight: '700' },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 160 },
  postCard: {
    backgroundColor: colors.surface_container_high,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface_container_highest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.label_lg, color: colors.primary, fontWeight: '700' },
  authorMeta: { flex: 1 },
  authorName: { ...typography.title_md, color: colors.on_surface },
  postTime: { ...typography.body_sm, color: colors.outline, fontSize: 10 },
  typeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  typeBadgeText: { ...typography.label_sm, fontSize: 9, letterSpacing: 1 },
  typeBadge_general: { backgroundColor: colors.surface_container_highest },
  typeBadge_logistics: { backgroundColor: 'rgba(90, 122, 98, 0.2)' },
  typeBadge_icebreaker: { backgroundColor: 'rgba(255, 107, 107, 0.15)' },
  typeBadge_question: { backgroundColor: 'rgba(100, 181, 246, 0.15)' },
  typeBadge_announcement: { backgroundColor: 'rgba(255, 183, 77, 0.15)' },
  postContent: { ...typography.body_md, color: colors.on_surface, lineHeight: 20 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 120, gap: spacing.md },
  emptyText: { ...typography.body_md, color: colors.outline },
  composerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(14, 14, 14, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.outline_variant,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  typeSelectorScroll: { gap: spacing.xs, paddingBottom: 4 },
  typeSelectBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface_container_low,
  },
  typeSelectBtnActive: { backgroundColor: colors.primary_container },
  typeSelectText: { ...typography.label_md, color: colors.outline, fontSize: 10 },
  typeSelectTextActive: { color: colors.primary, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surface_container_high,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.on_surface,
    ...typography.body_md,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
