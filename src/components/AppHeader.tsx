import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../theme/colors';

export function AppHeader({title, subtitle, right}: {title: string; subtitle?: string; right?: React.ReactNode}) {
  return (
    <View style={styles.container}>
      <View style={styles.textBox}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textBox: {flex: 1},
  title: {fontSize: 22, fontWeight: '800', color: colors.text},
  subtitle: {marginTop: 4, fontSize: 13, color: colors.muted},
});
