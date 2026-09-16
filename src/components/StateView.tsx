import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {Inbox} from 'lucide-react-native';
import {colors} from '../theme/colors';
import {AppButton} from './AppButton';

export function LoadingView({label = 'Đang tải dữ liệu...'}: {label?: string}) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function EmptyState({title, message}: {title: string; message?: string}) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Inbox color={colors.muted} size={30} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

export function ErrorState({message, onRetry}: {message: string; onRetry?: () => void}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Không thể tải dữ liệu</Text>
      <Text style={styles.text}>{message}</Text>
      {onRetry ? <AppButton title="Thử lại" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12},
  icon: {width: 60, height: 60, borderRadius: 18, backgroundColor: '#eef2f7', alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center'},
  text: {fontSize: 14, color: colors.muted, textAlign: 'center'},
});
