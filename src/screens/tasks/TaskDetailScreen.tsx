import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, FlatList, Linking, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Download, FileText} from 'lucide-react-native';
import {workApi} from '../../api/workApi';
import {AppButton} from '../../components/AppButton';
import {CardActions} from '../../components/CardActions';
import {confirm} from '../../components/Confirm';
import {EmptyState, ErrorState, LoadingView} from '../../components/StateView';
import {StatusBadge} from '../../components/StatusBadge';
import {AppStackParamList} from '../../navigation/types';
import {colors} from '../../theme/colors';
import {AttachedFile, Task, TaskLog} from '../../types/models';
import {formatDateTime} from '../../utils/date';
import {isImageFile, parseAttachments} from '../../utils/files';
import {stripHtml} from '../../utils/text';
import {useAuth} from '../../context/AuthContext';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskDetail'>;

export function TaskDetailScreen({navigation, route}: Props) {
  const {taskId} = route.params;
  const {session} = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const files = useMemo(() => {
    if (!task) return [];
    return [...parseAttachments(task.link_file), ...parseAttachments(task.image)];
  }, [task]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextTask, nextLogs] = await Promise.all([workApi.getTask(taskId), workApi.getTaskLogs(taskId)]);
      setTask(nextTask);
      setLogs(nextLogs);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => navigation.addListener('focus', load), [load, navigation]);

  const deleteLog = (id: number) => {
    confirm('Xóa báo cáo', 'Bạn có chắc muốn xóa báo cáo này?', async () => {
      try {
        await workApi.deleteTaskLog(id);
        load();
      } catch (err) {
        Alert.alert('Không thể xóa', (err as Error).message);
      }
    });
  };

  if (loading && !task) {
    return (
      <TaskDetailState>
        <LoadingView label="Đang tải công việc..." />
      </TaskDetailState>
    );
  }
  if (error && !task) {
    return (
      <TaskDetailState>
        <ErrorState message={error} onRetry={load} />
      </TaskDetailState>
    );
  }
  if (!task) {
    return (
      <TaskDetailState>
        <EmptyState title="Không tìm thấy công việc" />
      </TaskDetailState>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.hero}>
          <View style={styles.heroTop}>
            <StatusBadge status={task.status} />
            <AppButton
              title="Báo cáo"
              onPress={() => navigation.navigate('TaskReport', {taskId, currentStatus: task.status})}
              style={styles.reportButton}
            />
          </View>
          <Text style={styles.title}>{task.name}</Text>
          <Text style={styles.desc}>{stripHtml(task.description) || 'Chưa có mô tả.'}</Text>
          <View style={styles.metaBox}>
            <Text style={styles.meta}>Bắt đầu: {formatDateTime(task.start_date)}</Text>
            <Text style={styles.meta}>Hạn chót: {formatDateTime(task.end_date)}</Text>
          </View>
          </View>

          <Section title="File đính kèm">
            {files.length === 0 ? (
              <Text style={styles.muted}>Chưa có file đính kèm.</Text>
            ) : (
              files.map((file, index) => <AttachmentRow key={`${file.file_url}-${index}`} file={file} />)
            )}
          </Section>

          <Section title="Nhật ký / báo cáo tiến độ">
            {logs.length === 0 ? (
              <Text style={styles.muted}>Chưa có báo cáo tiến độ.</Text>
            ) : (
              <FlatList
                data={logs}
                keyExtractor={item => String(item.id)}
                scrollEnabled={false}
                renderItem={({item}) => (
                  <View style={styles.logCard}>
                    <View style={styles.logTop}>
                      <StatusBadge status={item.status} />
                    </View>
                    <Text style={styles.logText}>{stripHtml(item.action)}</Text>
                    <Text style={styles.meta}>{item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : ''}</Text>
                    {[...parseAttachments(item.link_file), ...parseAttachments(item.image)].map((file, index) => <AttachmentRow key={`${file.file_url}-${index}`} file={file} />)}
                    {Number(item.user_id) === Number(session?.id || session?.user_id) ? (
                      <CardActions
                        editLabel="Sửa báo cáo"
                        onEdit={() => navigation.navigate('TaskReport', {taskId, currentStatus: task.status, log: item})}
                        onDelete={() => deleteLog(item.id)}
                      />
                    ) : null}
                  </View>
                )}
              />
            )}
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

function TaskDetailState({children}: {children: React.ReactNode}) {
  return (
    <View style={styles.screen}>
      <View style={styles.stateBody}>{children}</View>
    </View>
  );
}

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function AttachmentRow({file}: {file: AttachedFile}) {
  return (
    <Pressable style={styles.fileRow} onPress={() => Linking.openURL(file.file_url)}>
      {isImageFile(file) ? <Download color={colors.primary} size={18} /> : <FileText color={colors.primary} size={18} />}
      <Text numberOfLines={1} style={styles.fileName}>
        {file.file_name || file.file_url.split('/').pop() || 'File'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  scroll: {flex: 1},
  scrollContent: {flexGrow: 1, backgroundColor: colors.background},
  content: {padding: 16, gap: 16},
  stateBody: {flex: 1},
  hero: {backgroundColor: colors.surface, borderRadius: 16, padding: 18, gap: 14, borderWidth: 1, borderColor: colors.border},
  heroTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  reportButton: {minHeight: 40, paddingHorizontal: 12},
  title: {fontSize: 22, fontWeight: '900', color: colors.text},
  desc: {fontSize: 14, color: colors.muted, lineHeight: 21},
  metaBox: {gap: 6},
  meta: {fontSize: 12, color: colors.muted, fontWeight: '700'},
  section: {backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.border},
  sectionTitle: {fontSize: 16, fontWeight: '900', color: colors.text},
  muted: {fontSize: 14, color: colors.muted},
  fileRow: {flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border},
  fileName: {flex: 1, color: colors.text, fontWeight: '700'},
  logCard: {borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10, gap: 8},
  logTop: {flexDirection: 'row', alignItems: 'center'},
  logText: {fontSize: 14, color: colors.text, lineHeight: 20},
});
