import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {Plus} from 'lucide-react-native';
import {colors} from '../theme/colors';

export function AddIconButton({onPress}: {onPress: () => void}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Thêm"
      hitSlop={6}
      onPress={onPress}
      style={({pressed}) => [styles.button, pressed && styles.pressed]}>
      <Plus size={22} strokeWidth={2.5} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  pressed: {
    opacity: 0.72,
    transform: [{scale: 0.94}],
  },
});
