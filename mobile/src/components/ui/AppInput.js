import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, spacing } from '../../theme/tokens';

export default function AppInput({
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  style,
  inputStyle,
  ...rest
}) {
  const [hidden, setHidden] = useState(true);
  const isPassword = !!secureTextEntry;

  return (
    <View style={[styles.wrap, style]}>
      {icon ? (
        <Ionicons name={icon} size={20} color={colors.on_surface_variant} style={styles.icon} />
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        secureTextEntry={isPassword && hidden}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline, inputStyle]}
        {...rest}
      />
      {isPassword ? (
        <TouchableOpacity
          onPress={() => setHidden((v) => !v)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.eyeBtn}
          activeOpacity={0.6}
        >
          <Ionicons
            name={hidden ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.outline}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface_container_low,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outline_variant,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body_md,
    color: colors.on_surface,
    paddingVertical: spacing.md,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  eyeBtn: {
    marginLeft: spacing.sm,
    padding: 4,
  },
});
