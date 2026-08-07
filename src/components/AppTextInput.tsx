import React from 'react';
import {StyleSheet, Text, TextInput, TextInputProps, View} from 'react-native';
import {colors} from '../theme/colors';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export function AppTextInput({label, error, style, ...props}: Props) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#9ca3af"
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {gap: 8},
  label: {fontSize: 13, fontWeight: '700', color: colors.text},
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  inputError: {borderColor: colors.danger},
  error: {fontSize: 12, color: colors.danger},
});
