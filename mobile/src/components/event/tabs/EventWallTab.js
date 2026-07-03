import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEventusStore } from '../../../store/eventusStore';
import { useAuthStore } from '../../../store/authStore';
import AppInput from '../../ui/AppInput';
import AppButton from '../../ui/AppButton';
import AvatarImage from '../../ui/AvatarImage';
import { colors, typography, spacing, radius } from '../../../theme/tokens';

const TYPES = [
  { id: 'general', label: 'General' },
  { id: 'logistics', label: 'Logística' },
  { id: 'icebreaker', label: 'Rompehielos' },
  { id: 'question', label: 'Pregunta' },
  { id: 'announcement', label: 'Anuncio' },
];

const WALL_POLL_MS = 20000;

export default function EventWallTab({ eventId, canPost, embedInScroll = false, bottomInset = 0 }) {
  const { wall, fetchWall, postWall, reactToPost, isLoading } = useEventusStore();
  const myId = useAuthStore((s) => s.user?._id || s.user?.id);
  const [content, setContent] = useState('');
  const [type, setType] = useState('general');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchWall(eventId);
    // Cuasi tiempo real: refresca el muro periódicamente mientras está visible
    const interval = setInterval(() => fetchWall(eventId).catch(() => {}), WALL_POLL_MS);
    return () => clearInterval(interval);
  }, [eventId]);

  const handleReact = async (postId) => {
    if (!canPost) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await reactToPost(eventId, postId, '❤️');
    } catch (e) {}
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      await postWall(eventId, content.trim(), type);
      setContent('');
    } finally {
      setPosting(false);
    }
  };

  if (isLoading && !wall) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const posts = [...(wall?.posts || [])].reverse();

  const renderPost = (item, i) => {
    const initials = `${item.author?.profile?.firstName?.[0] || ''}${item.author?.profile?.lastName?.[0] || ''}`;
    const reactions = item.reactions || [];
    const iReacted = reactions.some((r) => String(r.user?._id || r.user) === String(myId));
    return (
      <View key={String(item._id || i)} style={styles.post}>
        <View style={styles.postRow}>
          <AvatarImage uri={item.author?.profile?.avatar} size={40} initials={initials || '?'} />
          <View style={styles.postMain}>
            <View style={styles.postHead}>
              <Text style={styles.author}>
                {item.author?.profile?.firstName} {item.author?.profile?.lastName}
              </Text>
              <Text style={styles.typeBadge}>{item.type}</Text>
            </View>
            <Text style={styles.postBody}>{item.content}</Text>
            <TouchableOpacity
              style={styles.reactRow}
              onPress={() => handleReact(item._id)}
              activeOpacity={0.7}
              disabled={!canPost}
            >
              <Ionicons
                name={iReacted ? 'heart' : 'heart-outline'}
                size={16}
                color={iReacted ? colors.error : colors.outline}
              />
              {reactions.length > 0 ? (
                <Text style={[styles.reactCount, iReacted && { color: colors.error }]}>
                  {reactions.length}
                </Text>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={embedInScroll ? styles.wrapEmbedded : styles.wrap}>
      {!canPost ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Inscríbete para participar en el muro</Text>
        </View>
      ) : null}
      {embedInScroll ? (
        <View style={styles.list}>
          {posts.length ? posts.map(renderPost) : <Text style={styles.empty}>Sé el primero en escribir</Text>}
        </View>
      ) : (
        <FlatList
          style={styles.listFlex}
          data={posts}
          keyExtractor={(item, i) => String(item._id || i)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Sé el primero en escribir</Text>}
          renderItem={({ item, index }) => renderPost(item, index)}
        />
      )}
      {canPost ? (
        <View style={[styles.composer, embedInScroll && bottomInset > 0 && { paddingBottom: bottomInset }]}>
          <View style={styles.typeRow}>
            {TYPES.map((t) => (
              <TouchableOpacity key={t.id} onPress={() => setType(t.id)}>
                <Text style={[styles.typeChip, type === t.id && styles.typeChipOn]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <AppInput
            placeholder="Escribe algo al grupo..."
            value={content}
            onChangeText={setContent}
            multiline
          />
          <AppButton title="Publicar" onPress={handlePost} loading={posting} style={{ marginTop: spacing.sm }} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  wrapEmbedded: { paddingBottom: spacing.lg },
  listFlex: { flex: 1 },
  centered: { padding: spacing.xxxl, alignItems: 'center' },
  banner: {
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primary_fixed,
    borderRadius: radius.lg,
  },
  bannerText: { ...typography.body_sm, color: colors.on_primary_container, textAlign: 'center' },
  list: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  empty: { ...typography.body_md, color: colors.outline, textAlign: 'center', marginTop: spacing.xxl },
  post: {
    backgroundColor: colors.surface_container_lowest,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface_container_high,
  },
  postRow: { flexDirection: 'row', gap: spacing.md },
  postMain: { flex: 1 },
  postHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  author: { ...typography.label_lg, color: colors.on_surface },
  typeBadge: { ...typography.label_sm, color: colors.primary, textTransform: 'capitalize' },
  postBody: { ...typography.body_md, color: colors.on_surface_variant },
  reactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingRight: spacing.sm,
  },
  reactCount: { ...typography.label_md, color: colors.outline },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.outline_variant,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  typeChip: {
    ...typography.label_sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surface_container,
    color: colors.on_surface_variant,
    textTransform: 'none',
  },
  typeChipOn: { backgroundColor: colors.primary, color: colors.on_primary },
});
