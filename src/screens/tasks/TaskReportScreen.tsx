import React, {useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import {workApi} from '../../api/workApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {TASK_STATUSES} from '../../constants/business';
import {useAuth} from '../../context/AuthContext';
import {AppStackParamList} from '../../navigation/types';
import {colors} from '../../theme/colors';
import {toApiDateTime} from '../../utils/date';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskReport'>;

export function TaskReportScreen({navigation, route}: Props) {
  const {session} = useAuth();
  const [content, setContent] = useState('');
  const [status, setStatus] = useState(route.params.currentStatus || 1);
  const [time, setTime] = useState(new Date());
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!content.trim()) return Alert.alert('Thieu noi dung', 'Vui long nhap noi dung bao cao.');
    const userId = session?.id || session?.user_id;
    if (!userId) return Alert.alert('Loi phien dang nhap', 'Khong xac dinh duoc nguoi dung.');

    const formData = new FormData();
    formData.append('task_id', String(route.params.taskId));
    formData.append('action', content.trim());
    formData.append('user_id', String(userId));
    formData.append('status', String(status));
    formData.append('created_at', toApiDateTime(time) || '');

    setSaving(true);
    try {
      await workApi.saveTaskLog(formData);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Khong the gui bao cao', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AppTextInput
        label="Noi dung bao cao"
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
        style={styles.textarea}
      />
      <Text style={styles.label}>Trang thai moi</Text>
      <View style={styles.statusGrid}>
        {TASK_STATUSES.map(item => (
          <AppButton
            key={item.value}
            title={item.label}
            variant={status === item.value ? 'primary' : 'secondary'}
            onPress={() => setStatus(item.value)}
            style={styles.statusButton}
          />
        ))}
      </View>
      <Text style={styles.label}>Thoi gian bao cao</Text>
      <View style={styles.dateBox}>
        <DateTimePicker value={time} mode="datetime" onChange={(_, date) => date && setTime(date)} />
      </View>
      <AppButton title="Gui bao cao tien do" onPress={submit} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {padding: 16, gap: 16, backgroundColor: colors.background, flexGrow: 1},
  textarea: {height: 160, paddingTop: 12},
  label: {fontSize: 13, fontWeight: '800', color: colors.text},
  statusGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  statusButton: {minHeight: 42},
  dateBox: {backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 8},
});
