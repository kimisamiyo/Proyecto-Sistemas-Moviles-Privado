import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme/tokens';
import { useNetworkStore } from '../store/networkStore';
import { useLanguageStore } from '../store/languageStore';
import SuggestedNodes from '../components/SuggestedNodes';
import ActiveSymposia from '../components/ActiveSymposia';
import DirectCorrespondence from '../components/DirectCorrespondence';

export default function MessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguageStore();
  const {
    suggestions, discourseRooms, conversations,
    fetchSuggestions, fetchDiscourseRooms, fetchConversations, sendConnectionRequest
  } = useNetworkStore();

  useEffect(() => { fetchSuggestions(); fetchDiscourseRooms(); fetchConversations(); }, []);

  const handleConnect = async (userId) => {
    try { await sendConnectionRequest(userId); } catch (e) { console.log('Connect error:', e); }
  };

  const handleConversationPress = (convo) => {
    navigation.navigate('Chat', { userId: convo.userId, user: convo.user });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>{t.messages.headerLabel}</Text>
        <Text style={styles.headerTitle}>{t.messages.headerTitle}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SuggestedNodes suggestions={suggestions} onConnect={handleConnect} t={t} />
        <ActiveSymposia rooms={discourseRooms} onPress={() => {}} t={t} />
        <DirectCorrespondence conversations={conversations} onPress={handleConversationPress} t={t} />
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  headerLabel: { ...typography.label_sm, color: colors.outline, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { ...typography.display_sm, color: colors.on_surface },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
});
