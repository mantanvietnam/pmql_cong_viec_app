import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {workApi} from '../../api/workApi';
import {AppButton} from '../../components/AppButton';
import {DateField} from '../../components/DateField';
import {SegmentedTabs} from '../../components/SegmentedTabs';
import {StatGrid} from '../../components/StatGrid';
import {EmptyState, ErrorState, LoadingView} from '../../components/StateView';
import {StatusBadge} from '../../components/StatusBadge';
import {AppStackParamList} from '../../navigation/types';
import {colors} from '../../theme/colors';
import {DepartmentDashboard, ManagerDashboard, Task} from '../../types/models';
import {formatDateTime, isOverdue, toApiDate} from '../../utils/date';

type Props = NativeStackScreenProps<AppStackParamList, 'ManagementReport'>;
type Filter = 'overview' | 'in_progress' | 'overdue' | 'completed';

export function ManagementReportScreen({navigation, route}: Props) {
  const [data, setData] = useState<ManagerDashboard | DepartmentDashboard>();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<Filter>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const dates = {start_date: toApiDate(startDate), end_date: toApiDate(endDate)};
      setData(route.params.scope === 'organization'
        ? await workApi.getManagerDashboard({organization_id: route.params.id, ...dates})
        : await workApi.getDepartmentDashboard({department_id: route.params.id, ...dates}));
    } catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  }, [endDate, route.params.id, route.params.scope, startDate]);
  useEffect(() => { load(); }, [load]);

  const isManager = route.params.scope === 'organization';
  const manager = isManager ? data as ManagerDashboard | undefined : undefined;
  const department = !isManager ? data as DepartmentDashboard | undefined : undefined;
  const metrics = isManager ? {
    total: manager?.summary.total_tasks || 0,
    inProgress: manager?.summary.total_in_progress_tasks || 0,
    overdue: manager?.summary.total_overdue_tasks || 0,
    completed: manager?.summary.total_completed_tasks || 0,
  } : {
    total: department?.summary.total || 0,
    inProgress: department?.summary.in_progress || 0,
    overdue: department?.summary.overdue || 0,
    completed: department?.summary.completed || 0,
  };
  const filteredTasks = useMemo(() => (data?.tasks || []).filter(task => {
    if (filter === 'in_progress') return task.status === 2 && !isOverdue(task.end_date, task.status);
    if (filter === 'overdue') return isOverdue(task.end_date, task.status);
    if (filter === 'completed') return task.status === 3;
    return false;
  }), [data?.tasks, filter]);

  if (loading && !data) return <LoadingView label="Đang tải báo cáo..." />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  const completion = metrics.total ? Math.round(metrics.completed * 100 / metrics.total) : 0;
  return <View style={styles.screen}><FlatList
    data={filter === 'overview' ? [] : filteredTasks}
    keyExtractor={item => String(item.id)}
    contentContainerStyle={styles.list}
    ListHeaderComponent={<View style={styles.header}>
      <Text style={styles.title}>{manager?.organization.name || department?.department.name || 'Báo cáo'}</Text>
      <Text style={styles.subtitle}>Tiến độ hoàn thành {completion}%</Text>
      <View style={styles.dates}><DateField label="Từ ngày" value={startDate} onChange={setStartDate} /><DateField label="Đến ngày" value={endDate} onChange={setEndDate} /></View>
      <AppButton title="Áp dụng bộ lọc" onPress={load} loading={loading} />
      <StatGrid items={[{label: 'Tổng công việc', value: metrics.total, tone: 'primary'}, {label: 'Đang xử lý', value: metrics.inProgress}, {label: 'Quá hạn', value: metrics.overdue, tone: 'danger'}, {label: 'Hoàn thành', value: metrics.completed, tone: 'success'}]} />
      <SegmentedTabs value={filter} onChange={setFilter} items={[{value: 'overview', label: 'Tổng quan'}, {value: 'in_progress', label: 'Đang xử lý'}, {value: 'overdue', label: 'Quá hạn'}, {value: 'completed', label: 'Hoàn thành'}]} />
      {filter === 'overview' ? <View style={styles.section}><Text style={styles.sectionTitle}>{isManager ? 'Theo phòng ban' : 'Theo dự án'}</Text>{(manager?.departments || department?.projects || []).map(entry => <View key={entry.id} style={styles.progressRow}><View style={styles.progressText}><Text style={styles.progressName}>{entry.name}</Text><Text style={styles.progressMeta}>{'total_tasks' in entry ? entry.total_tasks : entry.task_count || 0} công việc</Text></View><Text style={styles.progressDone}>{'completed_tasks' in entry ? entry.completed_tasks : entry.completed_tasks || 0} xong</Text></View>)}</View> : <Text style={styles.sectionTitle}>Danh sách công việc</Text>}
    </View>}
    ListEmptyComponent={filter === 'overview' ? null : <EmptyState title="Không có công việc phù hợp" />}
    renderItem={({item}: {item: Task}) => <Pressable style={styles.task} onPress={() => navigation.navigate('TaskDetail', {taskId: item.id})}><View style={styles.taskBody}><Text style={styles.taskName}>{item.name}</Text><Text style={styles.progressMeta}>Hạn: {formatDateTime(item.end_date)}</Text></View><StatusBadge status={item.status} /></Pressable>}
  /></View>;
}

const styles = StyleSheet.create({screen: {flex: 1, backgroundColor: colors.background}, list: {padding: 16, gap: 10, flexGrow: 1}, header: {gap: 14}, title: {fontSize: 22, color: colors.text, fontWeight: '900'}, subtitle: {fontSize: 13, color: colors.muted}, dates: {gap: 12}, section: {padding: 14, gap: 9, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border}, sectionTitle: {fontSize: 16, color: colors.text, fontWeight: '900'}, progressRow: {paddingVertical: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border}, progressText: {flex: 1}, progressName: {fontSize: 14, color: colors.text, fontWeight: '800'}, progressMeta: {fontSize: 12, color: colors.muted, marginTop: 3}, progressDone: {fontSize: 13, color: colors.success, fontWeight: '900'}, task: {padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface}, taskBody: {flex: 1}, taskName: {fontSize: 14, fontWeight: '900', color: colors.text}});
