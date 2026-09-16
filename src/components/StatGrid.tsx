import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../theme/colors';

export function StatGrid({items}: {items: {label: string; value: number; tone?: 'primary' | 'danger' | 'success'}[]}) {
  return (
    <View style={styles.grid}>
      {items.map(item => (
        <View key={item.label} style={styles.card}>
          <Text style={[styles.value, item.tone && styles[item.tone]]}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  card: {width: '48%', minHeight: 88, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface, justifyContent: 'center'},
  value: {fontSize: 25, fontWeight: '900', color: colors.text},
  label: {fontSize: 12, color: colors.muted, fontWeight: '700', marginTop: 4},
  primary: {color: colors.primary},
  danger: {color: colors.danger},
  success: {color: colors.success},
});
