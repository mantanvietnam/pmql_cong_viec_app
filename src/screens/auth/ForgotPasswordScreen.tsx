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
    if (!phone.trim()) return Alert.alert('Thieu thong tin', 'Vui long nhap so dien thoai.');
    setLoading(true);
    try {
      await authApi.requestForgotPasswordOtp(phone.trim());
      setStep(2);
      Alert.alert('Da gui OTP', 'Vui long kiem tra email hoac tin nhan.');
    } catch (err) {
      Alert.alert('Khong the gui OTP', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!otp.trim() || !password.trim()) {
      return Alert.alert('Thieu thong tin', 'Vui long nhap OTP va mat khau moi.');
    }
    setLoading(true);
    try {
      await authApi.resetPassword(phone.trim(), otp.trim(), password);
      Alert.alert('Thanh cong', 'Mat khau da duoc cap nhat.', [
        {text: 'Dang nhap', onPress: () => navigation.goBack()},
      ]);
    } catch (err) {
      Alert.alert('Doi mat khau that bai', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{step === 1 ? 'Khoi phuc mat khau' : 'Tao mat khau moi'}</Text>
          <Text style={styles.subtitle}>
            {step === 1 ? 'Nhap so dien thoai de nhan ma xac nhan' : `Nhap ma OTP da gui den ${phone}`}
          </Text>
          <View style={styles.form}>
            {step === 1 ? (
              <>
                <AppTextInput label="So dien thoai" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <AppButton title="Gui ma xac nhan" onPress={requestOtp} loading={loading} />
              </>
            ) : (
              <>
                <AppTextInput label="Ma OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
                <AppTextInput label="Mat khau moi" value={password} onChangeText={setPassword} secureTextEntry />
                <AppButton title="Xac nhan doi mat khau" onPress={resetPassword} loading={loading} />
              </>
            )}
            <AppButton title="Quay lai" variant="ghost" onPress={() => (step === 2 ? setStep(1) : navigation.goBack())} />
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
