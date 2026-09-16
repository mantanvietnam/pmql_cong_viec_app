import React, {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {authApi} from '../../api/authApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {Screen} from '../../components/Screen';
import {useAuth} from '../../context/AuthContext';
import {AuthStackParamList} from '../../navigation/types';
import {colors} from '../../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
export function RegisterScreen({navigation}: Props) {
  const {signIn} = useAuth();
  const [fullname, setFullname] = useState(''); const [phone, setPhone] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!fullname.trim() || !phone.trim() || password.length < 6) return Alert.alert('Thông tin chưa hợp lệ', 'Nhập họ tên, số điện thoại và mật khẩu ít nhất 6 ký tự.');
    if (password !== confirmation) return Alert.alert('Sai xác nhận', 'Mật khẩu xác nhận không khớp.');
    setLoading(true);
    try {
      await authApi.register({fullname: fullname.trim(), phone: phone.trim(), email: email.trim() || undefined, password, password_confirmation: confirmation});
      await signIn(phone.trim(), password);
    } catch (err) { Alert.alert('Đăng ký thất bại', (err as Error).message); } finally { setLoading(false); }
  };
  return <Screen><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Text style={styles.title}>Tạo tài khoản</Text><Text style={styles.subtitle}>Đăng ký xong, ứng dụng sẽ đăng nhập lại để tạo phiên mobile.</Text><View style={styles.form}><AppTextInput label="Họ và tên" value={fullname} onChangeText={setFullname} /><AppTextInput label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /><AppTextInput label="Email (không bắt buộc)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /><AppTextInput label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry /><AppTextInput label="Xác nhận mật khẩu" value={confirmation} onChangeText={setConfirmation} secureTextEntry /><AppButton title="Đăng ký" onPress={submit} loading={loading} /><AppButton title="Quay lại đăng nhập" variant="ghost" onPress={() => navigation.goBack()} /></View></ScrollView></KeyboardAvoidingView></Screen>;
}
const styles = StyleSheet.create({flex: {flex: 1}, content: {padding: 24, flexGrow: 1, justifyContent: 'center'}, title: {fontSize: 24, textAlign: 'center', fontWeight: '900', color: colors.text}, subtitle: {fontSize: 13, textAlign: 'center', color: colors.muted, marginTop: 8}, form: {marginTop: 24, gap: 14}});
