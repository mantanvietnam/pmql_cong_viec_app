import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

const taskMap: Record<number, {label: string; bg: string; fg: string}> = {
  1: {label: 'Mới tạo', bg: '#dbeafe', fg: '#1d4ed8'},
  2: {label: 'Đang xử lý', bg: '#ffedd5', fg: '#c2410c'},
  3: {label: 'Hoàn thành', bg: '#d1fae5', fg: '#047857'},
  4: {label: 'Hủy bỏ', bg: '#e5e7eb', fg: '#4b5563'},
};

export function StatusBadge({status}: {status?: number}) {
  const item = taskMap[Number(status)] || {label: 'Không rõ', bg: '#f3f4f6', fg: '#4b5563'};
  return (
    <View style={[styles.badge, {backgroundColor: item.bg}]}>
      <Text style={[styles.text, {color: item.fg}]}>{item.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start'},
  text: {fontSize: 11, fontWeight: '800'},
});
