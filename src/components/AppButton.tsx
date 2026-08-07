import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle} from 'react-native';
import {colors} from '../theme/colors';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: ViewStyle;
};

export function AppButton({title, onPress, loading, disabled, variant = 'primary', style}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({pressed}) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}>
      {loading ? <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? colors.primary : '#fff'} /> : null}
      <Text style={[styles.text, (variant === 'secondary' || variant === 'ghost') && styles.secondaryText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primary: {backgroundColor: colors.primary},
  secondary: {backgroundColor: '#eff4ff', borderWidth: 1, borderColor: '#dbeafe'},
  danger: {backgroundColor: colors.danger},
  ghost: {backgroundColor: 'transparent'},
  disabled: {opacity: 0.55},
  pressed: {transform: [{scale: 0.98}]},
  text: {fontSize: 15, fontWeight: '800', color: '#fff'},
  secondaryText: {color: colors.primary},
});
