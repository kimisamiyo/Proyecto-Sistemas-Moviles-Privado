import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import client from '../api/client';
import { useNetworkStore } from '../store/networkStore';
import { parseApiErrors } from '../utils/validators';
import { openPublicProfile } from '../utils/navigationHelpers';

export default function ChatScreen({ route, navigation }) {
  const { userId, user: chatUser } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const { fetchConnectionStatus } = useNetworkStore();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [canChat, setCanChat] = useState(false);
  const [connLoading, setConnLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    (async () => {
      const st = await fetchConnectionStatus(userId);
      setCanChat(st?.status === 'connected');
      setConnLoading(false);
      if (st?.status === 'connected') fetchMessages();
    })();
  }, [userId]);

  const fetchMessages = async () => {
    try {
      const { data } = await client.get(`/messages/${userId}`);
      setMessages(data.messages || []);
    } catch (e) { console.log('Fetch messages error:', e); }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !canChat) return;
    try {
      const { data } = await client.post('/messages', { receiverId: userId, content: inputText.trim() });
      setMessages(prev => [...prev, data.message]);
      setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (e) {
      const msg = parseApiErrors(e);
      Alert.alert('No se pudo enviar', msg);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === user?._id || item.sender?._id === user?._id;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.messageTime}>
          {new Date(item.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const displayName = chatUser ? `${chatUser.profile?.firstName} ${chatUser.profile?.lastName}` : 'Chat';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.headerSub}>{chatUser?.profile?.title || 'Miembro EventUs'}</Text>
        </View>
        {chatUser?._id || userId ? (
          <TouchableOpacity
            onPress={() => openPublicProfile(navigation, chatUser?._id || userId)}
          >
            <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {connLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : !canChat ? (
        <View style={styles.blocked}>
          <Ionicons name="link-outline" size={40} color={colors.outline} />
          <Text style={styles.blockedTitle}>Aún no están conectados</Text>
          <Text style={styles.blockedText}>
            Envía una solicitud desde su perfil. Cuando la acepte, podrás escribir aquí.
          </Text>
          <TouchableOpacity onPress={() => openPublicProfile(navigation, userId)}>
            <Text style={styles.blockedLink}>Ver perfil y conectar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          style={styles.listFlex}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={[styles.messageList, { paddingBottom: spacing.md }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          keyboardShouldPersistTaps="handled"
        />
      )}
      <View
        style={[
          styles.inputBar,
          { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.lg * 5 },
        ]}
      >
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={canChat ? t.messages.typeMessage : 'Conecta para escribir'}
          placeholderTextColor={colors.outline}
          multiline
          editable={canChat}
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={[styles.sendBtn, inputText.trim() && canChat && styles.sendBtnActive]}
          disabled={!inputText.trim() || !canChat}
        >
          <Ionicons name="send" size={18} color={inputText.trim() && canChat ? colors.on_primary : colors.outline} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md, backgroundColor: colors.surface_container_low },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface_container_high, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, gap: 2 },
  headerName: { ...typography.title_lg, color: colors.on_surface },
  headerSub: { ...typography.body_sm, color: colors.secondary },
  listFlex: { flex: 1 },
  messageList: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  messageBubble: { maxWidth: '80%', padding: spacing.md, borderRadius: radius.lg, gap: 4 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: colors.primary_container, borderBottomRightRadius: radius.sm },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: colors.surface_container_high, borderBottomLeftRadius: radius.sm },
  messageText: { ...typography.body_md, color: colors.on_surface },
  messageTime: { ...typography.label_sm, color: colors.outline, fontSize: 9, textTransform: 'none', alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.surface_container_low },
  input: { flex: 1, backgroundColor: colors.surface_container_high, borderRadius: radius.xl, paddingHorizontal: spacing.lg, paddingVertical: 10, fontSize: 15, color: colors.on_surface, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface_container_high, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { backgroundColor: colors.primary },
  blocked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  blockedTitle: { ...typography.title_lg, color: colors.on_surface },
  blockedText: { ...typography.body_md, color: colors.outline, textAlign: 'center' },
  blockedLink: { ...typography.label_lg, color: colors.primary, marginTop: spacing.md },
});
