import React, {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {authApi} from '../../api/authApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Screen} from '../../components/Screen';
import {colors} from '../../theme/colors';
import {AuthStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({navigation}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    if (!phone.trim()) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại.');
    setLoading(true);
    try {
      await authApi.requestForgotPasswordOtp(phone.trim());
      setStep(2);
      Alert.alert('Đã gửi OTP', 'Vui lòng kiểm tra email hoặc tin nhắn.');
    } catch (err) {
      Alert.alert('Không thể gửi OTP', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!otp.trim() || !password.trim()) {
      return Alert.alert('Thiếu thông tin', 'Vui lòng nhập OTP và mật khẩu mới.');
    }
    setLoading(true);
    try {
      await authApi.resetPassword(phone.trim(), otp.trim(), password);
      Alert.alert('Thành công', 'Mật khẩu đã được cập nhật.', [
        {text: 'Đăng nhập', onPress: () => navigation.goBack()},
      ]);
    } catch (err) {
      Alert.alert('Đổi mật khẩu thất bại', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{step === 1 ? 'Khôi phục mật khẩu' : 'Tạo mật khẩu mới'}</Text>
          <Text style={styles.subtitle}>
            {step === 1 ? 'Nhập số điện thoại để nhận mã xác nhận' : `Nhập mã OTP đã gửi đến ${phone}`}
          </Text>
          <View style={styles.form}>
            {step === 1 ? (
              <>
                <AppTextInput label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <AppButton title="Gửi mã xác nhận" onPress={requestOtp} loading={loading} />
              </>
            ) : (
              <>
                <AppTextInput label="Mã OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
                <AppTextInput label="Mật khẩu mới" value={password} onChangeText={setPassword} secureTextEntry />
                <AppButton title="Xác nhận đổi mật khẩu" onPress={resetPassword} loading={loading} />
              </>
            )}
            <AppButton title="Quay lại" variant="ghost" onPress={() => (step === 2 ? setStep(1) : navigation.goBack())} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  content: {flexGrow: 1, justifyContent: 'center', padding: 24},
  title: {fontSize: 24, fontWeight: '900', color: colors.text, textAlign: 'center'},
  subtitle: {fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 8},
  form: {marginTop: 28, gap: 16},
});
