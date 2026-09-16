import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {workApi} from '../../api/workApi';
import {AppButton} from '../../components/AppButton';
import {DateField} from '../../components/DateField';
import {SegmentedTabs} from '../../components/SegmentedTabs';
import {StatGrid} from '../../components/StatGrid';
import {EmptyState, ErrorState, LoadingView} from '../../components/StateView';
import {StatusBadge} from '../../components/StatusBadge';
import {AppStackParamList} from '../../navigation/types';
import {colors} from '../../theme/colors';
import {Organization, PersonalDashboard} from '../../types/models';
import {formatDateTime, isOverdue, toApiDateTime} from '../../utils/date';

type Filter = 'all' | 'in_progress' | 'overdue' | 'completed';

export function PersonalReportView({userId, userName, defaultOrganizationId}: {userId: number; userName: string; defaultOrganizationId?: number}) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [data, setData] = useState<PersonalDashboard>();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState<number | undefined>(defaultOrganizationId);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const finalEndDate = endDate ? new Date(endDate) : null;
      finalEndDate?.setHours(23, 59, 59);
      setData(await workApi.getPersonalDashboard({
        user_id: userId,
        organization_id: organizationId,
        start_date: startDate ? toApiDateTime(startDate) || undefined : undefined,
        end_date: finalEndDate ? toApiDateTime(finalEndDate) || undefined : undefined,
      }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [endDate, organizationId, startDate, userId]);

  useEffect(() => {
    workApi.getOrganizations('').then(setOrganizations).catch(() => undefined);
  }, []);
  useEffect(() => { load(); }, [load]);

  const tasks = useMemo(() => (data?.recent_tasks || []).filter(task => {
    if (filter === 'in_progress') return task.status === 2 && !isOverdue(task.end_date, task.status);
    if (filter === 'overdue') return isOverdue(task.end_date, task.status);
    if (filter === 'completed') return task.status === 3;
    return true;
  }), [data?.recent_tasks, filter]);

  if (loading && !data) return <LoadingView label="Đang tải báo cáo..." />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  return (
    <View style={styles.screen}>
      <FlatList
        data={tasks}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={load}
        ListHeaderComponent={<View style={styles.header}>
          <Text style={styles.title}>Báo cáo: {userName}</Text>
          <Text style={styles.subtitle}>Lọc theo tổ chức và khoảng thời gian</Text>
          <FlatList horizontal data={[{id: 0, name: 'Tất cả'}, ...organizations]} keyExtractor={item => String(item.id)} showsHorizontalScrollIndicator={false} renderItem={({item}) => <Pressable style={[styles.chip, (organizationId || 0) === item.id && styles.chipActive]} onPress={() => setOrganizationId(item.id || undefined)}><Text style={[styles.chipText, (organizationId || 0) === item.id && styles.chipTextActive]}>{item.name}</Text></Pressable>} />
          <DateField label="Từ ngày" value={startDate} onChange={setStartDate} />
          <DateField label="Đến ngày" value={endDate} onChange={setEndDate} />
          <AppButton title="Áp dụng" onPress={load} loading={loading} />
          <StatGrid items={[{label: 'Tổng được giao', value: data?.total_assigned || 0, tone: 'primary'}, {label: 'Đang xử lý', value: data?.total_in_progress || 0}, {label: 'Quá hạn', value: data?.total_overdue || 0, tone: 'danger'}, {label: 'Hoàn thành', value: data?.total_completed || 0, tone: 'success'}, {label: 'Chưa bắt đầu', value: data?.total_not_started || 0}, {label: 'Sắp đến hạn', value: data?.total_upcoming || 0}]} />
          <SegmentedTabs value={filter} onChange={setFilter} items={[{value: 'all', label: 'Gần đây'}, {value: 'in_progress', label: 'Đang xử lý'}, {value: 'overdue', label: 'Quá hạn'}, {value: 'completed', label: 'Hoàn thành'}]} />
          <Text style={styles.sectionTitle}>Danh sách công việc</Text>
        </View>}
        ListEmptyComponent={<EmptyState title="Không có công việc phù hợp" />}
        renderItem={({item}) => <Pressable style={styles.task} onPress={() => navigation.navigate('TaskDetail', {taskId: item.id})}><View style={styles.taskBody}><Text style={styles.taskName}>{item.name}</Text><Text style={styles.meta}>Hạn: {formatDateTime(item.end_date)}</Text></View><StatusBadge status={item.status} /></Pressable>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  list: {padding: 16, gap: 10, flexGrow: 1},
  header: {gap: 13},
  title: {fontSize: 22, color: colors.text, fontWeight: '900'},
  subtitle: {fontSize: 13, color: colors.muted},
  chip: {minHeight: 40, paddingHorizontal: 13, justifyContent: 'center', marginRight: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface},
  chipActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  chipText: {fontSize: 13, fontWeight: '800', color: colors.muted},
  chipTextActive: {color: '#fff'},
  sectionTitle: {fontSize: 16, color: colors.text, fontWeight: '900'},
  task: {padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface, flexDirection: 'row', gap: 10, alignItems: 'center'},
  taskBody: {flex: 1},
  taskName: {fontSize: 14, color: colors.text, fontWeight: '900'},
  meta: {fontSize: 12, color: colors.muted, marginTop: 4},
});
