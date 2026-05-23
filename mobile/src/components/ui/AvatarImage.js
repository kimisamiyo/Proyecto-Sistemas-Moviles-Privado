import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme/tokens';

export default function AvatarImage({
  uri,
  size = 48,
  initials = '?',
  style,
  borderColor = colors.surface,
}) {
  const [failed, setFailed] = useState(false);
  const showImage = uri && !failed;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={styles.img}
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.primary_container,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { width: '100%', height: '100%' },
  initials: {
    ...typography.label_lg,
    color: colors.primary,
    fontWeight: '700',
  },
});
