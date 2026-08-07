import React, {useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import {authApi} from '../../api/authApi';
import {getSessionAccessToken} from '../../api/client';
import {workApi} from '../../api/workApi';
import {AppButton} from '../../components/AppButton';
import {AppHeader} from '../../components/AppHeader';
import {AppTextInput} from '../../components/AppTextInput';
import {useAuth} from '../../context/AuthContext';
import {colors} from '../../theme/colors';

export function ProfileScreen() {
  const {session, signOut, updateSession} = useAuth();
  const [fullname, setFullname] = useState(session?.fullname || session?.name || '');
  const [email, setEmail] = useState(session?.email || '');
  const [description, setDescription] = useState(session?.description || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  const saveProfile = async () => {
    if (!fullname.trim()) return Alert.alert('Thieu thong tin', 'Ho ten khong duoc de trong.');
    const accessToken = getSessionAccessToken(session);
    const formData = new FormData();
    formData.append('access_token', accessToken);
    formData.append('fullname', fullname.trim());
    formData.append('email', email.trim());
    formData.append('description', description.trim());
    setSaving(true);
    try {
      await workApi.updateUser(formData);
      await updateSession({fullname, email, description});
      Alert.alert('Thanh cong', 'Da cap nhat ho so.');
    } catch (err) {
      Alert.alert('Khong the cap nhat', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) return Alert.alert('Thieu thong tin', 'Vui long nhap day du mat khau.');
    if (newPassword !== confirmPassword) return Alert.alert('Sai xac nhan', 'Mat khau nhap lai khong khop.');
    setChanging(true);
    try {
      await authApi.changePassword({
        access_token: getSessionAccessToken(session),
        old_password: oldPassword,
        new_password: newPassword,
        new_password_again: confirmPassword,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Thanh cong', 'Da doi mat khau.');
    } catch (err) {
      Alert.alert('Khong the doi mat khau', (err as Error).message);
    } finally {
      setChanging(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader title="Ho so" subtitle={session?.phone || session?.email || ''} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thong tin ca nhan</Text>
          <AppTextInput label="Ho ten" value={fullname} onChangeText={setFullname} />
          <AppTextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <AppTextInput label="Mo ta" value={description} onChangeText={setDescription} multiline style={styles.textarea} />
          <AppButton title="Luu ho so" onPress={saveProfile} loading={saving} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Doi mat khau</Text>
          <AppTextInput label="Mat khau hien tai" value={oldPassword} onChangeText={setOldPassword} secureTextEntry />
          <AppTextInput label="Mat khau moi" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <AppTextInput label="Nhap lai mat khau moi" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          <AppButton title="Doi mat khau" onPress={changePassword} loading={changing} />
        </View>

        <AppButton title="Dang xuat" variant="danger" onPress={signOut} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {padding: 16, gap: 16},
  card: {backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: colors.border},
  cardTitle: {fontSize: 17, fontWeight: '900', color: colors.text},
  textarea: {height: 96, paddingTop: 12},
});
