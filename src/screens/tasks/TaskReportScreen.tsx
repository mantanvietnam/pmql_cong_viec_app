import React, {useEffect, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {errorCodes, isErrorWithCode, pick} from '@react-native-documents/picker';
import {launchImageLibrary} from 'react-native-image-picker';
import {X} from 'lucide-react-native';
import {workApi} from '../../api/workApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {DateField} from '../../components/DateField';
import {confirm} from '../../components/Confirm';
import {ErrorState, LoadingView} from '../../components/StateView';
import {TASK_STATUSES} from '../../constants/business';
import {useAuth} from '../../context/AuthContext';
import {AppStackParamList} from '../../navigation/types';
import {colors} from '../../theme/colors';
import {toApiDateTime} from '../../utils/date';
import {AttachedFile} from '../../types/models';
import {parseAttachments, splitAttachments, validateAttachment} from '../../utils/files';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskReport'>;

export function TaskReportScreen({navigation, route}: Props) {
  const {session} = useAuth();
  const editingLog = route.params.log;
  const [content, setContent] = useState(editingLog?.action || '');
  const shouldLoadTask = editingLog?.status == null && route.params.currentStatus == null;
  const [status, setStatus] = useState(editingLog?.status ?? route.params.currentStatus ?? 1);
  const [loadingTask, setLoadingTask] = useState(shouldLoadTask);
  const [taskError, setTaskError] = useState('');
  const [taskRequest, setTaskRequest] = useState(0);
  const [time, setTime] = useState(editingLog?.created_at ? new Date(editingLog.created_at) : new Date());
  const [files, setFiles] = useState<AttachedFile[]>([...parseAttachments(editingLog?.link_file), ...parseAttachments(editingLog?.image)]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shouldLoadTask) return;

    let active = true;
    setLoadingTask(true);
    setTaskError('');
    workApi.getTask(route.params.taskId)
      .then(task => {
        if (!active) return;
        if (!task) throw new Error('Không tìm thấy công việc.');
        setStatus(task.status);
        setLoadingTask(false);
      })
      .catch(error => {
        if (!active) return;
        setTaskError((error as Error).message);
        setLoadingTask(false);
      });

    return () => {
      active = false;
    };
  }, [route.params.taskId, shouldLoadTask, taskRequest]);

  const submit = async () => {
    if (!content.trim()) return Alert.alert('Thiếu nội dung', 'Vui lòng nhập nội dung báo cáo.');
    const userId = session?.id || session?.user_id;
    if (!userId) return Alert.alert('Lỗi phiên đăng nhập', 'Không xác định được người dùng.');

    const formData = new FormData();
    formData.append('task_id', String(route.params.taskId));
    formData.append('action', content.trim());
    formData.append('user_id', String(userId));
    formData.append('status', String(status));
    formData.append('created_at', toApiDateTime(time) || '');
    const existing = files.filter(file => !file.rawFile);
    const {images, docs} = splitAttachments(existing);
    formData.append('link_file', docs.length ? JSON.stringify(docs) : '');
    formData.append('image', images.length ? JSON.stringify(images) : '');
    files.filter(file => file.rawFile).forEach(file => formData.append('files[]', file.rawFile as unknown as Blob));

    setSaving(true);
    try {
      await workApi.saveTaskLog(formData, editingLog?.id);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Không thể gửi báo cáo', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addDocuments = async () => {
    try {
      const picked = await pick({allowMultiSelection: true});
      const next: AttachedFile[] = [];
      for (const file of picked) {
        const validation = validateAttachment({name: file.name || undefined, size: file.size || undefined}, files.length + next.length);
        if (validation) return Alert.alert('File không hợp lệ', validation);
        next.push({file_url: file.uri, file_name: file.name || 'document', file_size: file.size || undefined, file_type: file.type || 'document', rawFile: {uri: file.uri, name: file.name || 'document', type: file.type || 'application/octet-stream'}});
      }
      setFiles(prev => [...prev, ...next]);
    } catch (err) {
      if (!isErrorWithCode(err) || err.code !== errorCodes.OPERATION_CANCELED) Alert.alert('Không thể chọn file', (err as Error).message);
    }
  };
  const addImages = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', selectionLimit: 5});
    const next: AttachedFile[] = [];
    for (const asset of result.assets || []) {
      if (!asset.uri) continue;
      const name = asset.fileName || 'image.jpg';
      const validation = validateAttachment({name, size: asset.fileSize}, files.length + next.length);
      if (validation) return Alert.alert('Ảnh không hợp lệ', validation);
      next.push({file_url: asset.uri, file_name: name, file_size: asset.fileSize, file_type: 'image', rawFile: {uri: asset.uri, name, type: asset.type || 'image/jpeg'}});
    }
    setFiles(prev => [...prev, ...next]);
  };
  const removeFile = (index: number) => {
    const file = files[index];
    const remove = () => setFiles(previous => previous.filter((_, position) => position !== index));
    if (file.rawFile) return remove();
    confirm('Gỡ file đã lưu', 'File này sẽ bị xóa khỏi báo cáo sau khi cập nhật. Tiếp tục?', remove);
  };

  if (loadingTask) {
    return (
      <TaskReportState>
        <LoadingView label="Đang tải công việc..." />
      </TaskReportState>
    );
  }
  if (taskError) {
    return (
      <TaskReportState>
        <ErrorState message={taskError} onRetry={() => setTaskRequest(value => value + 1)} />
      </TaskReportState>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <AppTextInput
            label="Nội dung báo cáo"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            style={styles.textarea}
          />
          <Text style={styles.label}>Trạng thái mới</Text>
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
          <DateField label="Thời gian báo cáo" value={time} onChange={value => value && setTime(value)} includeTime />
          <Text style={styles.label}>File đính kèm</Text><View style={styles.fileActions}><AppButton title="Tài liệu" variant="secondary" onPress={addDocuments} style={styles.fileButton} /><AppButton title="Ảnh" variant="secondary" onPress={addImages} style={styles.fileButton} /></View>
          {files.map((file, index) => <View key={`${file.file_url}-${index}`} style={styles.fileRow}><Text numberOfLines={1} style={styles.fileName}>{file.file_name || file.file_url}</Text><Pressable onPress={() => removeFile(index)}><X size={18} color={colors.danger} /></Pressable></View>)}
          <AppButton title={editingLog ? 'Cập nhật báo cáo' : 'Gửi báo cáo tiến độ'} onPress={submit} loading={saving} />
        </View>
      </ScrollView>
    </View>
  );
}

function TaskReportState({children}: {children: React.ReactNode}) {
  return (
    <View style={styles.screen}>
      <View style={styles.stateBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  scroll: {flex: 1},
  scrollContent: {backgroundColor: colors.background, flexGrow: 1},
  content: {padding: 16, gap: 16, flexGrow: 1},
  stateBody: {flex: 1},
  textarea: {height: 160, paddingTop: 12},
  label: {fontSize: 13, fontWeight: '800', color: colors.text},
  statusGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  statusButton: {minHeight: 42},
  fileActions: {flexDirection: 'row', gap: 10}, fileButton: {flex: 1}, fileRow: {minHeight: 46, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10}, fileName: {flex: 1, color: colors.text, fontWeight: '700'},
});
