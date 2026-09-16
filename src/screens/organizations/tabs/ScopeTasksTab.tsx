import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {UserRound, X} from 'lucide-react-native';
import {workApi} from '../../../api/workApi';
import {CardActions} from '../../../components/CardActions';
import {confirm} from '../../../components/Confirm';
import {EmptyState, ErrorState, LoadingView} from '../../../components/StateView';
import {StatusBadge} from '../../../components/StatusBadge';
import {colors} from '../../../theme/colors';
import {Task} from '../../../types/models';
import {formatDateTime} from '../../../utils/date';
import {TASK_STATUSES} from '../../../constants/business';

export function ScopeTasksTab({organizationId, departmentId, projectId, permissions, assignee, onClearAssignee, onOpen, onEdit}: {
  organizationId?: number;
  departmentId?: number;
  projectId?: number;
  permissions: string[];
  assignee?: {id: number; name: string};
  onClearAssignee?: () => void;
  onOpen: (task: Task) => void;
  onEdit: (task: Task) => void;
}) {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<number>();
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await workApi.getTasks({limit: 200, page: 1, ...(organizationId ? {organization_id: organizationId} : {}), department_id: departmentId, project_id: projectId, user_id: assignee?.id})); }
    catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  }, [assignee?.id, departmentId, organizationId, projectId]);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => {
    return status === undefined ? items : items.filter(item => item.status === status);
  }, [items, status]);
  const remove = (task: Task) => confirm('Xóa công việc', `Xóa "${task.name}"?`, async () => {
    try { await workApi.deleteTask(task.id); load(); } catch (err) { Alert.alert('Không thể xóa', (err as Error).message); }
  });
  if (loading && items.length === 0) return <LoadingView label="Đang tải công việc..." />;
  if (error && items.length === 0) return <ErrorState message={error} onRetry={load} />;
  return (
    <View style={styles.container}>
      {assignee ? (
        <View style={styles.toolbar}>
          <View style={styles.assigneeFilter}>
            <UserRound size={17} color={colors.primary} />
            <Text numberOfLines={1} style={styles.assigneeText}>Công việc của {assignee.name}</Text>
            {onClearAssignee ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Bỏ lọc nhân sự" hitSlop={8} onPress={onClearAssignee}>
                <X size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
      <FlatList style={styles.filterList} horizontal data={[{value: undefined, label: 'Tất cả'}, ...TASK_STATUSES]} keyExtractor={item => String(item.value ?? 'all')} contentContainerStyle={styles.filters} showsHorizontalScrollIndicator={false} renderItem={({item}) => <Pressable style={[styles.chip, status === item.value && styles.chipActive]} onPress={() => setStatus(item.value)}><Text style={[styles.chipText, status === item.value && styles.chipTextActive]}>{item.label}</Text></Pressable>} />
      <FlatList data={filtered} keyExtractor={item => String(item.id)} contentContainerStyle={styles.list} ListEmptyComponent={<EmptyState title={assignee ? `${assignee.name} chưa có công việc` : 'Chưa có công việc'} />} renderItem={({item}) => (
        <Pressable style={styles.card} onPress={() => onOpen(item)}>
          <View style={styles.top}><StatusBadge status={item.status} /></View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>Hạn: {formatDateTime(item.end_date)}</Text>
          <CardActions
            onEdit={permissions.includes('task_edit') ? () => onEdit(item) : undefined}
            onDelete={permissions.includes('task_delete') ? () => remove(item) : undefined}
          />
        </Pressable>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({container: {flex: 1}, toolbar: {paddingHorizontal: 16, paddingTop: 10}, assigneeFilter: {minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 8, backgroundColor: '#eff6ff'}, assigneeText: {flex: 1, fontSize: 13, color: colors.primary, fontWeight: '800'}, filterList: {height: 54, flexGrow: 0}, filters: {paddingHorizontal: 16, paddingVertical: 8}, chip: {minHeight: 38, justifyContent: 'center', paddingHorizontal: 12, marginRight: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface}, chipActive: {backgroundColor: colors.primary, borderColor: colors.primary}, chipText: {fontSize: 12, color: colors.muted, fontWeight: '800'}, chipTextActive: {color: '#fff'}, list: {padding: 16, gap: 10, flexGrow: 1}, card: {padding: 14, gap: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8}, top: {flexDirection: 'row', alignItems: 'center'}, name: {fontSize: 15, fontWeight: '900', color: colors.text}, meta: {fontSize: 12, color: colors.muted, fontWeight: '700'}});
