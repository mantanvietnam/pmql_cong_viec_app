import React, {useState} from 'react';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {CalendarDays} from 'lucide-react-native';
import {colors} from '../theme/colors';

export function DateField({
  label,
  value,
  onChange,
  includeTime = false,
  disabled = false,
}: {
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  includeTime?: boolean;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  const formatted = value
    ? value.toLocaleString('vi-VN', includeTime
      ? {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}
      : {day: '2-digit', month: '2-digit', year: 'numeric'})
    : 'Chưa chọn';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable disabled={disabled} style={[styles.field, disabled && styles.disabled]} onPress={() => setShow(true)}>
        <CalendarDays size={18} color={colors.primary} />
        <Text style={styles.value}>{formatted}</Text>
        {value ? <Text style={styles.clear} onPress={() => onChange(null)}>Xóa</Text> : null}
      </Pressable>
      {show ? (
        <DateTimePicker
          value={value || new Date()}
          mode={includeTime ? 'datetime' : 'date'}
          onChange={(event, date) => {
            if (Platform.OS === 'android') setShow(false);
            if (event.type !== 'dismissed' && date) onChange(date);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {gap: 8},
  label: {fontSize: 13, fontWeight: '800', color: colors.text},
  field: {minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10},
  disabled: {opacity: 0.5},
  value: {flex: 1, fontSize: 14, color: colors.text, fontWeight: '700'},
  clear: {color: colors.danger, fontWeight: '800', paddingVertical: 8},
});
