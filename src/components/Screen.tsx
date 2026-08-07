import React from 'react';
import {SafeAreaView, StyleSheet, ViewStyle} from 'react-native';
import {colors} from '../theme/colors';

export function Screen({children, style}: {children: React.ReactNode; style?: ViewStyle}) {
  return <SafeAreaView style={[styles.screen, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
