import React, {useState} from 'react';
import {Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {Camera, Send} from 'lucide-react-native';
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
  const [avatar, setAvatar] = useState(session?.avatar || '');
  const [avatarFile, setAvatarFile] = useState<{uri: string; name: string; type: string}>();
  const [linkingTelegram, setLinkingTelegram] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const chooseAvatar = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', selectionLimit: 1});
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    const raw = {uri: asset.uri, name: asset.fileName || 'avatar.jpg', type: asset.type || 'image/jpeg'};
    setAvatar(asset.uri);
    setAvatarFile(raw);
  };

  const saveProfile = async () => {
    if (!fullname.trim()) return Alert.alert('Thiếu thông tin', 'Họ tên không được để trống.');
    const accessToken = getSessionAccessToken(session);
    const formData = new FormData();
    formData.append('access_token', accessToken);
    formData.append('fullname', fullname.trim());
    formData.append('email', email.trim());
    formData.append('description', description.trim());
    if (avatarFile) formData.append('avatar', avatarFile as unknown as Blob);
    setSaving(true);
    try {
      const result = await workApi.updateUser(formData) as {avatar?: string} | undefined;
      const nextAvatar = result?.avatar || avatar;
      setAvatar(nextAvatar);
      await updateSession({fullname, email, description, avatar: nextAvatar});
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ.');
    } catch (err) {
      Alert.alert('Không thể cập nhật', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const linkTelegram = async () => {
    setLinkingTelegram(true);
    try {
      const result = await workApi.getTelegramLink();
      if (result.telegram_chat_id) await updateSession({telegram_chat_id: result.telegram_chat_id});
      if (!result.link) return Alert.alert('Không có liên kết', 'Máy chủ không trả về liên kết Telegram.');
      await Linking.openURL(result.link);
    } catch (err) { Alert.alert('Không thể liên kết Telegram', (err as Error).message); } finally { setLinkingTelegram(false); }
  };

  const changePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ mật khẩu.');
    if (newPassword !== confirmPassword) return Alert.alert('Sai xác nhận', 'Mật khẩu nhập lại không khớp.');
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
      Alert.alert('Thành công', 'Đã đổi mật khẩu.');
    } catch (err) {
      Alert.alert('Không thể đổi mật khẩu', (err as Error).message);
    } finally {
      setChanging(false);
    }
  };

  const notifyAndSignOut = (title: string, message: string) => {
    Alert.alert(title, message, [{text: 'OK', onPress: () => void signOut()}], {cancelable: false});
  };

  const deleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const response = await authApi.lockUser(getSessionAccessToken(session));
      if (response.code === 200) {
        notifyAndSignOut('Đã xóa tài khoản', response.message || 'Tài khoản đã được khóa. Bạn sẽ được đăng xuất.');
        return;
      }
      if (response.code === 403) {
        notifyAndSignOut('Phiên đăng nhập không hợp lệ', response.message || 'Token không hợp lệ. Bạn sẽ được đăng xuất.');
        return;
      }
      Alert.alert('Không thể xóa tài khoản', response.message || 'Máy chủ trả về lỗi.');
    } catch (err) {
      Alert.alert('Không thể xóa tài khoản', (err as Error).message);
    } finally {
      setDeletingAccount(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Xóa tài khoản',
      'Bạn có chắc muốn xóa tài khoản này? Thao tác này không thể hoàn tác.',
      [
        {text: 'Hủy', style: 'cancel'},
        {text: 'Xóa tài khoản', style: 'destructive', onPress: () => void deleteAccount()},
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <AppHeader title="Hồ sơ" subtitle={session?.phone || session?.email || ''} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
          <Pressable style={styles.avatarButton} onPress={chooseAvatar}>
            {avatar ? <Image source={{uri: avatar}} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarPlaceholder]}><Text style={styles.avatarLetter}>{fullname.charAt(0).toUpperCase() || '?'}</Text></View>}
            <View style={styles.camera}><Camera size={17} color="#fff" /></View>
          </Pressable>
          <AppTextInput label="Họ tên" value={fullname} onChangeText={setFullname} />
          <AppTextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <AppTextInput label="Mô tả" value={description} onChangeText={setDescription} multiline style={styles.textarea} />
          <AppButton title="Lưu hồ sơ" onPress={saveProfile} loading={saving} />
        </View>

        <View style={styles.card}>
          <View style={styles.telegramTitle}><Send size={20} color={colors.primary} /><Text style={styles.cardTitle}>Thông báo Telegram</Text></View>
          <Text style={styles.telegramState}>{session?.telegram_chat_id ? 'Tài khoản đã liên kết.' : 'Liên kết để nhận thông báo công việc trên Telegram.'}</Text>
          <AppButton title={session?.telegram_chat_id ? 'Mở lại liên kết' : 'Liên kết Telegram'} variant="secondary" onPress={linkTelegram} loading={linkingTelegram} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Đổi mật khẩu</Text>
          <AppTextInput label="Mật khẩu hiện tại" value={oldPassword} onChangeText={setOldPassword} secureTextEntry />
          <AppTextInput label="Mật khẩu mới" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <AppTextInput label="Nhập lại mật khẩu mới" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          <AppButton title="Đổi mật khẩu" onPress={changePassword} loading={changing} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tài khoản</Text>
          <Text style={styles.dangerText}>Xóa tài khoản sẽ khóa tài khoản hiện tại và không thể hoàn tác.</Text>
          <AppButton title="Xóa tài khoản" variant="danger" onPress={confirmDeleteAccount} loading={deletingAccount} />
          <AppButton title="Đăng xuất" variant="secondary" onPress={signOut} disabled={deletingAccount} />
        </View>
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
  avatarButton: {alignSelf: 'center', width: 104, height: 104},
  avatar: {width: 104, height: 104, borderRadius: 52, backgroundColor: '#eef2f7'},
  avatarPlaceholder: {alignItems: 'center', justifyContent: 'center'},
  avatarLetter: {fontSize: 34, fontWeight: '900', color: colors.primary},
  camera: {position: 'absolute', right: 1, bottom: 3, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff'},
  telegramTitle: {flexDirection: 'row', alignItems: 'center', gap: 9},
  telegramState: {fontSize: 13, color: colors.muted, lineHeight: 19},
  dangerText: {fontSize: 13, color: colors.muted, lineHeight: 19},
});
