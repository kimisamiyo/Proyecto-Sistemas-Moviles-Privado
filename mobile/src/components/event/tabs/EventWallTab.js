import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchWall(eventId);
    const interval = setInterval(() => fetchWall(eventId).catch(() => {}), WALL_POLL_MS);
    return () => clearInterval(interval);
  }, [eventId]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const handleReact = async (postId) => {
    if (!canPost) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await reactToPost(eventId, postId, '❤️');
    } catch (e) {}
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    Keyboard.dismiss();
    setPosting(true);
    try {
      await postWall(eventId, content.trim(), type);
      setContent('');
      await fetchWall(eventId);
    } catch (e) {
      // silently handle - rate limit or network
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

  if (embedInScroll) {
    return (
      <View style={styles.wrapEmbedded}>
        {!canPost ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Inscríbete para participar en el muro</Text>
          </View>
        ) : null}
        <View style={styles.list}>
          {posts.length ? posts.map(renderPost) : <Text style={styles.empty}>Sé el primero en escribir</Text>}
        </View>
        {canPost ? (
          <View style={[styles.composer, bottomInset > 0 && { paddingBottom: bottomInset }]}>
            <View style={styles.typeRow}>
              {TYPES.map((t) => (
                <TouchableOpacity key={t.id} onPress={() => setType(t.id)}>
                  <Text style={[styles.typeChip, type === t.id && styles.typeChipOn]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <AppInput placeholder="Escribe algo al grupo..." value={content} onChangeText={setContent} multiline />
            <TouchableOpacity
              style={[styles.publishBtn, (!content.trim() || posting) && styles.publishBtnDisabled]}
              onPress={handlePost}
              disabled={!content.trim() || posting}
              activeOpacity={0.7}
            >
              {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.publishBtnText}>Publicar</Text>}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 80}
    >
      {!canPost ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Inscríbete para participar en el muro</Text>
        </View>
      ) : null}
      <FlatList
        ref={flatListRef}
        style={styles.listFlex}
        data={posts}
        keyExtractor={(item, i) => String(item._id || i)}
        contentContainerStyle={[styles.list, keyboardVisible && { paddingBottom: spacing.sm }]}
        ListEmptyComponent={<Text style={styles.empty}>Sé el primero en escribir</Text>}
        renderItem={({ item, index }) => renderPost(item, index)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => {
          if (keyboardVisible && flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
      />
      {canPost ? (
        <View style={styles.composer}>
          {!keyboardVisible ? (
            <View style={styles.typeRow}>
              {TYPES.map((t) => (
                <TouchableOpacity key={t.id} onPress={() => setType(t.id)}>
                  <Text style={[styles.typeChip, type === t.id && styles.typeChipOn]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <AppInput
              placeholder="Escribe algo al grupo..."
              value={content}
              onChangeText={setContent}
              multiline
              style={styles.inputFlex}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!content.trim() || posting) && styles.publishBtnDisabled]}
              onPress={handlePost}
              disabled={!content.trim() || posting}
              activeOpacity={0.7}
            >
              {posting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          {keyboardVisible && type !== 'general' ? (
            <Text style={styles.typeHint}>Tipo: {TYPES.find((t) => t.id === type)?.label}</Text>
          ) : null}
        </View>
      ) : null}
    </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  inputFlex: { flex: 1 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  typeHint: {
    ...typography.label_sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  publishBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  publishBtnDisabled: { opacity: 0.5 },
  publishBtnText: { ...typography.label_lg, fontWeight: '600', color: colors.on_primary },
});
