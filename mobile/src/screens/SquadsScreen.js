import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {

  View,

  Text,

  StyleSheet,

  TextInput,

  RefreshControl,

  FlatList,

  Alert,

  TouchableOpacity,

} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { colors, typography, spacing, radius } from '../theme/tokens';

import { useSquadStore } from '../store/squadStore';

import { useWalletStore } from '../store/walletStore';

import SquadCard from '../components/SquadCard';

import FadeInView from '../components/ui/FadeInView';

import NotificationBell from '../components/ui/NotificationBell';

import { useLayout } from '../utils/responsive';

import { parseApiErrors } from '../utils/validators';

import { filterSquadsForExplore } from '../utils/squadFilters';



export default function SquadsScreen({ navigation, route }) {

  const insets = useSafeAreaInsets();

  const { horizontalPad } = useLayout();

  const { openSquads, mySquads, fetchOpenSquads, fetchMySquads, joinSquad } = useSquadStore();

  const { tickets, fetchWallet } = useWalletStore();

  const [tab, setTab] = useState('explore');

  const [planNote, setPlanNote] = useState('');

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (route?.params?.showMine) {
      setTab('mine');
      fetchMySquads();
    }
  }, [route?.params?.showMine]);

  useFocusEffect(
    useCallback(() => {
      fetchOpenSquads();
      fetchMySquads();
      fetchWallet();
    }, [])
  );



  const onRefresh = useCallback(async () => {

    setRefreshing(true);

    await Promise.all([fetchOpenSquads(), fetchMySquads(), fetchWallet()]);

    setRefreshing(false);

  }, []);



  const ticketEventIds = useMemo(

    () => new Set(tickets.map((t) => String(t.eventId))),

    [tickets]

  );



  const squadsForMyEvents = useMemo(
    () => {
      if (ticketEventIds.size === 0) return openSquads;
      return openSquads.filter((s) => {
        const eid = String(s.event?._id || s.event || '');
        return ticketEventIds.has(eid);
      });
    },
    [openSquads, ticketEventIds]
  );



  const exploreList = useMemo(

    () => filterSquadsForExplore(squadsForMyEvents, mySquads),

    [squadsForMyEvents, mySquads]

  );



  const list = tab === 'explore' ? exploreList : mySquads;



  const handleJoin = async (squad) => {

    const note = planNote.trim() || 'Me apunto al plan';

    try {

      await joinSquad(squad._id, note);

      Alert.alert('¡Unido!', `Te uniste a ${squad.name}`);

      await Promise.all([fetchOpenSquads(), fetchMySquads()]);

    } catch (e) {

      Alert.alert('Error', parseApiErrors(e));

    }

  };



  const renderItem = ({ item }) => (

    <SquadCard

      squad={item}

      fullWidth

      planNote={planNote}

      isJoined={tab === 'mine'}

      onPress={(s) => navigation.navigate('SquadDetail', { squadId: s._id })}

      onJoin={tab === 'explore' ? handleJoin : undefined}

    />

  );



  const emptyMessage =

    tab === 'explore'
      ? exploreList.length === 0 && mySquads.length > 0
        ? 'Ya estás en todas las escuadras disponibles. ¡Crea una nueva!'
        : 'No hay escuadras disponibles aún. ¡Sé el primero en crear una!'
      : 'Aún no perteneces a ninguna escuadra.';



  return (

    <View style={[styles.container, { paddingTop: insets.top }]}>

      <FadeInView style={[styles.header, { paddingHorizontal: horizontalPad }]}>

        <View style={styles.headerRow}>

          <View style={styles.headerText}>

            <Text style={styles.label}>EVENTUS</Text>

            <Text style={styles.title}>Escuadras</Text>

            <Text style={styles.sub}>Explora nuevas o revisa donde ya estás</Text>

          </View>

          <NotificationBell navigation={navigation} />

        </View>

      </FadeInView>



      <View style={[styles.tabs, { paddingHorizontal: horizontalPad }]}>

        <TouchableOpacity

          style={[styles.tab, tab === 'explore' && styles.tabOn]}

          onPress={() => setTab('explore')}

        >

          <Text style={[styles.tabText, tab === 'explore' && styles.tabTextOn]}>

            Explorar ({exploreList.length})

          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={[styles.tab, tab === 'mine' && styles.tabOn]}

          onPress={() => setTab('mine')}

        >

          <Text style={[styles.tabText, tab === 'mine' && styles.tabTextOn]}>

            Mis escuadras ({mySquads.length})

          </Text>

        </TouchableOpacity>

      </View>



      {tab === 'explore' ? (
        <TextInput
          style={[styles.input, { marginHorizontal: horizontalPad }]}
          placeholder="Tu aporte al plan (opcional)"
          placeholderTextColor={colors.outline}
          value={planNote}
          onChangeText={setPlanNote}
        />
      ) : null}



      <FlatList

        data={list}

        keyExtractor={(item) => item._id}

        renderItem={renderItem}

        contentContainerStyle={{

          paddingHorizontal: horizontalPad,

          paddingBottom: spacing.xl,

        }}

        refreshControl={

          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />

        }

        ListEmptyComponent={

          <View style={styles.emptyWrap}>

            <Ionicons name="people-outline" size={40} color={colors.outline} />

            <Text style={styles.empty}>{emptyMessage}</Text>

          </View>

        }

      />

    </View>

  );

}



const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: colors.surface },

  header: { paddingVertical: spacing.lg },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },

  headerText: { flex: 1, minWidth: 0, marginRight: spacing.sm },

  label: { ...typography.label_sm, color: colors.primary, letterSpacing: 1 },

  title: { ...typography.headline_lg, color: colors.on_surface },

  sub: { ...typography.body_sm, color: colors.on_surface_variant, marginTop: spacing.xs },

  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },

  tab: {

    flex: 1,

    paddingVertical: spacing.sm,

    paddingHorizontal: spacing.xs,

    borderRadius: radius.full,

    backgroundColor: colors.surface_container_high,

    alignItems: 'center',

  },

  tabOn: { backgroundColor: colors.primary_container },

  tabText: { ...typography.label_sm, color: colors.outline, textAlign: 'center' },

  tabTextOn: { color: colors.primary, fontWeight: '700' },

  input: {

    marginBottom: spacing.md,

    backgroundColor: colors.surface_container_lowest,

    borderRadius: radius.lg,

    padding: spacing.lg,

    color: colors.on_surface,

    borderWidth: 1,

    borderColor: colors.outline_variant,

  },

  emptyWrap: { alignItems: 'center', paddingTop: spacing.xxxl, gap: spacing.md, paddingHorizontal: spacing.xl },

  empty: {

    ...typography.body_md,

    color: colors.on_surface_variant,

    textAlign: 'center',

  },

});

