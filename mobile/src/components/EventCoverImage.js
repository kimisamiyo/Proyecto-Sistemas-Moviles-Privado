import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/tokens';
import { getEventCover, getSquadCover } from '../utils/images';

export default function EventCoverImage({ event, squad, height = 140, style, uri }) {
  const [failed, setFailed] = useState(false);
  const coverUri = uri || (event ? getEventCover(event) : squad ? getSquadCover(squad) : null);

  return (
    <View style={[styles.wrap, { height }, style]}>
      {!failed && coverUri ? (
        <Image
          source={{ uri: coverUri }}
          style={styles.img}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.ph}>
          <Ionicons name="image-outline" size={32} color={colors.outline} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', backgroundColor: colors.surface_container_high },
  img: { width: '100%', height: '100%' },
  ph: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface_container },
});
