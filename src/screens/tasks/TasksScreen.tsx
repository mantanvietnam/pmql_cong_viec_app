import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Search} from 'lucide-react-native';
import {workApi} from '../../api/workApi';
import {CardActions} from '../../components/CardActions';
import {AppHeader} from '../../components/AppHeader';
import {AddIconButton} from '../../components/AddIconButton';
import {AppTextInput} from '../../components/AppTextInput';
import {confirm} from '../../components/Confirm';
import {EmptyState, ErrorState, LoadingView} from '../../components/StateView';
import {StatusBadge} from '../../components/StatusBadge';
import {TASK_STATUSES, TASK_TYPE_FILTERS} from '../../constants/business';
import {AppStackParamList} from '../../navigation/types';
import {colors} from '../../theme/colors';
import {Project, Task} from '../../types/models';
import {formatDateTime, isNearDeadline, isOverdue} from '../../utils/date';
import {stripHtml} from '../../utils/text';

const LIMIT = 20;

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function TasksScreen() {
  const navigation = useNavigation<Nav>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<number | undefined>();
  const [taskType, setTaskType] = useState('');
  const [projectId, setProjectId] = useState<number>();
  const [projects, setProjects] = useState<Project[]>([]);

  const payload = useMemo(
    () => ({
      limit: LIMIT,
      name: search.trim() || undefined,
      status,
      project_id: projectId,
      task_type: taskType || undefined,
    }),
    [projectId, search, status, taskType],
  );

  const load = useCallback(
    async (nextPage = 1, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError('');
      try {
        const list = await workApi.getTasks({...payload, page: nextPage});
        setTasks(prev => (append ? [...prev, ...list] : list));
        setPage(nextPage);
        setHasMore(list.length === LIMIT);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [payload],
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  useEffect(() => {
    workApi.getProjects({}).then(setProjects).catch(() => undefined);
  }, []);

  const refresh = () => {
    setRefreshing(true);
    load(1, false);
  };

  const deleteTask = (task: Task) => {
    confirm('Xóa công việc', `Bạn có chắc muốn xóa "${task.name}"?`, async () => {
      try {
        await workApi.deleteTask(task.id);
        refresh();
      } catch (err) {
        Alert.alert('Không thể xóa', (err as Error).message);
      }
    });
  };

  if (loading && tasks.length === 0) return <LoadingView label="Đang tải danh sách công việc..." />;
  if (error && tasks.length === 0) return <ErrorState message={error} onRetry={() => load(1, false)} />;

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Công việc"
        subtitle="Sắp xếp và theo dõi tiến độ"
        right={<AddIconButton onPress={() => navigation.navigate('TaskForm')} />}
      />
      <View style={styles.filters}>
        <View style={styles.searchRow}>
          <Search color={colors.muted} size={20} />
          <AppTextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm kiếm công việc..."
            returnKeyType="search"
            onSubmitEditing={() => load(1, false)}
            style={styles.searchInput}
          />
        </View>
        <FlatList
          horizontal
          data={[{value: undefined, label: 'Tất cả'}, ...TASK_STATUSES]}
          keyExtractor={item => String(item.value ?? 'all')}
          showsHorizontalScrollIndicator={false}
          renderItem={({item}) => (
            <Pressable
              style={[styles.chip, status === item.value && styles.chipActive]}
              onPress={() => setStatus(item.value)}>
              <Text style={[styles.chipText, status === item.value && styles.chipTextActive]}>{item.label}</Text>
            </Pressable>
          )}
        />
        <FlatList
          horizontal
          data={TASK_TYPE_FILTERS}
          keyExtractor={item => item.value || 'all'}
          showsHorizontalScrollIndicator={false}
          renderItem={({item}) => (
            <Pressable
              style={[styles.chip, taskType === item.value && styles.chipActive]}
              onPress={() => setTaskType(item.value)}>
              <Text style={[styles.chipText, taskType === item.value && styles.chipTextActive]}>{item.label}</Text>
            </Pressable>
          )}
        />
        <FlatList
          horizontal
          data={[{id: 0, name: 'Tất cả dự án'}, ...projects]}
          keyExtractor={item => String(item.id)}
          showsHorizontalScrollIndicator={false}
          renderItem={({item}) => (
            <Pressable
              style={[styles.chip, (projectId || 0) === item.id && styles.chipActive]}
              onPress={() => setProjectId(item.id || undefined)}>
              <Text style={[styles.chipText, (projectId || 0) === item.id && styles.chipTextActive]}>{item.name}</Text>
            </Pressable>
          )}
        />
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={tasks}
        keyExtractor={item => String(item.id)}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (hasMore && !loadingMore) load(page + 1, true);
        }}
        ListEmptyComponent={<EmptyState title="Không có công việc" message="Thử đổi bộ lọc hoặc tạo công việc mới." />}
        renderItem={({item}) => (
          <TaskCard
            task={item}
            onPress={() => navigation.navigate('TaskDetail', {taskId: item.id})}
            onEdit={() => navigation.navigate('TaskForm', {task: item, taskId: item.id})}
            onDelete={() => deleteTask(item)}
          />
        )}
        ListFooterComponent={loadingMore ? <LoadingView label="Đang tải thêm..." /> : null}
      />
    </View>
  );
}

function TaskCard({
  task,
  onPress,
  onEdit,
  onDelete,
}: {
  task: Task;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const overdue = isOverdue(task.end_date, task.status);
  const near = isNearDeadline(task.end_date);
  return (
    <Pressable style={[styles.card, overdue && styles.cardOverdue, near && !overdue && styles.cardNear]} onPress={onPress}>
      <View style={styles.cardTop}>
        <StatusBadge status={task.status} />
      </View>
      <Text style={styles.cardTitle}>{task.name}</Text>
      {task.description ? <Text numberOfLines={2} style={styles.cardDesc}>{stripHtml(task.description)}</Text> : null}
      <Text style={styles.meta}>Hạn chót: {formatDateTime(task.end_date)}</Text>
      {overdue ? <Text style={styles.overdue}>Quá hạn</Text> : near ? <Text style={styles.near}>Sắp đến hạn</Text> : null}
      <CardActions onEdit={onEdit} onDelete={onDelete} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  filters: {padding: 16, gap: 12},
  searchRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  searchInput: {flex: 1},
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  chipText: {fontWeight: '700', color: colors.muted},
  chipTextActive: {color: '#fff'},
  list: {padding: 16, paddingTop: 0, gap: 12},
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardOverdue: {backgroundColor: '#111827', borderColor: '#111827'},
  cardNear: {backgroundColor: '#fff1f2', borderColor: '#fecdd3'},
  cardTop: {flexDirection: 'row', alignItems: 'center'},
  cardTitle: {fontSize: 16, fontWeight: '900', color: colors.text},
  cardDesc: {fontSize: 13, color: colors.muted, lineHeight: 19},
  meta: {fontSize: 12, color: colors.muted, fontWeight: '700'},
  overdue: {color: '#fff', fontSize: 12, fontWeight: '900'},
  near: {color: colors.danger, fontSize: 12, fontWeight: '900'},
});
