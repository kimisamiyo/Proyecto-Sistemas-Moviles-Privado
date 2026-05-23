import React, { useState } from 'react';

import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import SquadCard from '../../SquadCard';

import AppButton from '../../ui/AppButton';

import LockedSectionGate from '../LockedSectionGate';

import { colors, typography, spacing, radius } from '../../../theme/tokens';



export default function EventSquadsTab({

  eventId,

  squads,

  navigation,

  onJoin,

  onLeave,

  event,

  mySquad,

  hasTicketAccess,

  onRequestRegister,
  embedInScroll = false,
}) {

  const [subTab, setSubTab] = useState('open');

  const quickNote = 'Voy con el mismo plan';



  if (!hasTicketAccess) {

    return (

      <LockedSectionGate

        title="Escuadras del evento"

        message="Confirma tu asistencia para crear o unirte a escuadras de este evento."

        onConfirm={onRequestRegister}

      />

    );

  }



  const exploreSquads = (squads || []).filter(

    (s) => !mySquad || String(s._id) !== String(mySquad._id)

  );



  const handleQuickJoin = (squad) => {

    const switching = mySquad && String(mySquad._id) !== String(squad._id);

    Alert.alert(

      switching ? 'Cambiar de escuadra' : 'Unirse',

      switching

        ? `Saldrás de "${mySquad.name}" y entrarás a "${squad.name}". Solo una escuadra por evento.`

        : `¿Unirte a "${squad.name}"?`,

      [

        { text: 'Cancelar', style: 'cancel' },

        { text: 'Unirme', onPress: () => onJoin(squad, quickNote) },

      ]

    );

  };



  return (

    <View style={styles.wrap}>

      <View style={styles.subTabs}>

        <TouchableOpacity

          style={[styles.subTab, subTab === 'open' && styles.subTabOn]}

          onPress={() => setSubTab('open')}

        >

          <Text style={[styles.subTabText, subTab === 'open' && styles.subTabTextOn]}>Explorar</Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={[styles.subTab, subTab === 'mine' && styles.subTabOn]}

          onPress={() => setSubTab('mine')}

        >

          <Text style={[styles.subTabText, subTab === 'mine' && styles.subTabTextOn]}>Mi escuadra</Text>

        </TouchableOpacity>

      </View>



      {subTab === 'open' ? (

        <>

          <AppButton

            title="Crear escuadra"

            onPress={() =>

              navigation.navigate('CreateSquad', {

                eventId,

                eventTitle: event?.metadata?.title || '',

                communitySlug: event?.metadata?.communitySlug || '',

              })

            }

            style={{ marginBottom: spacing.lg }}

          />



          {exploreSquads.length ? (

            exploreSquads.map((s) => (

              <SquadCard

                key={s._id}

                squad={s}

                fullWidth

                onPress={(sq) => navigation.navigate('SquadDetail', { squadId: sq._id })}

                onJoin={handleQuickJoin}

                planNote={quickNote}

              />

            ))

          ) : (

            <View style={styles.empty}>

              <Ionicons name="people-outline" size={40} color={colors.outline} />

              <Text style={styles.emptyText}>

                {mySquad

                  ? 'Ya estás en una escuadra. Las demás no aparecen aquí.'

                  : 'No hay escuadras abiertas para unirte.'}

              </Text>

              <Text style={styles.emptyHint}>¡Crea la primera escuadra del evento!</Text>

            </View>

          )}

        </>

      ) : (

        <>

          {mySquad ? (

            <SquadCard

              squad={mySquad}

              fullWidth

              isJoined

              onPress={(sq) => navigation.navigate('SquadDetail', { squadId: sq._id })}

            />

          ) : (

            <View style={styles.empty}>

              <Ionicons name="person-outline" size={36} color={colors.outline} />

              <Text style={styles.emptyText}>Aún no estás en una escuadra de este evento.</Text>

              <Text style={styles.emptyHint}>Usa Explorar para unirte o crear una.</Text>

            </View>

          )}

          {mySquad ? (

            <AppButton

              title="Salir de la escuadra"

              variant="outline"

              onPress={onLeave}

              style={{ marginTop: spacing.md }}

            />

          ) : null}

        </>

      )}

    </View>

  );

}



const styles = StyleSheet.create({

  wrap: { padding: spacing.lg, paddingBottom: spacing.xxxl },

  subTabs: {

    flexDirection: 'row',

    gap: spacing.sm,

    marginBottom: spacing.lg,

    backgroundColor: colors.surface_container_high,

    borderRadius: radius.full,

    padding: 4,

  },

  subTab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.full },

  subTabOn: { backgroundColor: colors.surface_container_lowest },

  subTabText: { ...typography.label_md, color: colors.outline },

  subTabTextOn: { color: colors.primary, fontWeight: '700' },

  empty: { alignItems: 'center', padding: spacing.xxl, gap: spacing.sm },

  emptyText: { ...typography.body_md, color: colors.on_surface, textAlign: 'center' },

  emptyHint: { ...typography.body_sm, color: colors.outline, textAlign: 'center' },

});

