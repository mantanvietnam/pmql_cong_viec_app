import React, {useState} from 'react';
import {Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Screen} from '../../components/Screen';
import {APP_NAME} from '../../constants/config';
import {useAuth} from '../../context/AuthContext';
import {colors} from '../../theme/colors';
import {AuthStackParamList} from '../../navigation/types';
import {validateLogin} from '../../validation/forms';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({navigation}: Props) {
  const {signIn} = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const validationError = validateLogin(phone, password);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(phone.trim(), password);
    } catch (err) {
      Alert.alert('Đăng nhập thất bại', (err as Error).message || 'Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image source={require('../../../logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Hệ thống quản lý công việc</Text>

          <View style={styles.form}>
            <AppTextInput
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              placeholder="Nhập số điện thoại"
              error={error && !phone.trim() ? error : undefined}
            />
            <AppTextInput
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Nhập mật khẩu"
              error={error && !password.trim() ? error : undefined}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <AppButton title="Đăng nhập" onPress={submit} loading={loading} />
            <AppButton title="Quên mật khẩu?" variant="ghost" onPress={() => navigation.navigate('ForgotPassword')} />
            <AppButton title="Tạo tài khoản" variant="secondary" onPress={() => navigation.navigate('Register')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  content: {flexGrow: 1, justifyContent: 'center', padding: 24},
  logo: {width: 86, height: 86, alignSelf: 'center'},
  brand: {textAlign: 'center', fontSize: 26, fontWeight: '900', color: colors.primary, marginTop: 8},
  title: {textAlign: 'center', fontSize: 24, fontWeight: '900', color: colors.text, marginTop: 28},
  subtitle: {textAlign: 'center', fontSize: 14, color: colors.muted, marginTop: 6},
  form: {marginTop: 28, gap: 16},
  error: {color: colors.danger, textAlign: 'center'},
});
