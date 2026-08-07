import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Edit3, Search, Trash2} from 'lucide-react-native';
import {workApi} from '../../api/workApi';
import {AppButton} from '../../components/AppButton';
import {AppHeader} from '../../components/AppHeader';
import {AppTextInput} from '../../components/AppTextInput';
import {confirm} from '../../components/Confirm';
import {EmptyState, ErrorState, LoadingView} from '../../components/StateView';
import {StatusBadge} from '../../components/StatusBadge';
import {TASK_STATUSES, TASK_TYPE_FILTERS} from '../../constants/business';
import {AppStackParamList} from '../../navigation/types';
import {colors} from '../../theme/colors';
import {Task} from '../../types/models';
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

  const payload = useMemo(
    () => ({
      limit: LIMIT,
      name: search.trim() || undefined,
      status,
      task_type: taskType || undefined,
    }),
    [search, status, taskType],
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

  const refresh = () => {
    setRefreshing(true);
    load(1, false);
  };

  const deleteTask = (task: Task) => {
    confirm('Xoa cong viec', `Ban co chac muon xoa "${task.name}"?`, async () => {
      try {
        await workApi.deleteTask(task.id);
        refresh();
      } catch (err) {
        Alert.alert('Khong the xoa', (err as Error).message);
      }
    });
  };

  if (loading && tasks.length === 0) return <LoadingView label="Dang tai danh sach cong viec..." />;
  if (error && tasks.length === 0) return <ErrorState message={error} onRetry={() => load(1, false)} />;

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Cong viec"
        subtitle="Sap xep va theo doi tien do"
        right={<AppButton title="Them" onPress={() => navigation.navigate('TaskForm')} style={styles.addButton} />}
      />
      <View style={styles.filters}>
        <View style={styles.searchRow}>
          <Search color={colors.muted} size={20} />
          <AppTextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tim kiem cong viec..."
            returnKeyType="search"
            onSubmitEditing={() => load(1, false)}
            style={styles.searchInput}
          />
        </View>
        <FlatList
          horizontal
          data={[{value: undefined, label: 'Tat ca'}, ...TASK_STATUSES]}
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
        ListEmptyComponent={<EmptyState title="Khong co cong viec" message="Thu doi bo loc hoac tao cong viec moi." />}
        renderItem={({item}) => (
          <TaskCard
            task={item}
            onPress={() => navigation.navigate('TaskDetail', {taskId: item.id})}
            onEdit={() => navigation.navigate('TaskForm', {task: item, taskId: item.id})}
            onDelete={() => deleteTask(item)}
          />
        )}
        ListFooterComponent={loadingMore ? <LoadingView label="Dang tai them..." /> : null}
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
        <View style={styles.actions}>
          <Pressable onPress={onEdit} hitSlop={10}>
            <Edit3 color={colors.primary} size={18} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={10}>
            <Trash2 color={colors.danger} size={18} />
          </Pressable>
        </View>
      </View>
      <Text style={styles.cardTitle}>{task.name}</Text>
      {task.description ? <Text numberOfLines={2} style={styles.cardDesc}>{stripHtml(task.description)}</Text> : null}
      <Text style={styles.meta}>Han chot: {formatDateTime(task.end_date)}</Text>
      {overdue ? <Text style={styles.overdue}>Qua han</Text> : near ? <Text style={styles.near}>Sap den han</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  addButton: {minHeight: 40, paddingHorizontal: 12},
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
  cardTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  actions: {flexDirection: 'row', alignItems: 'center', gap: 14},
  cardTitle: {fontSize: 16, fontWeight: '900', color: colors.text},
  cardDesc: {fontSize: 13, color: colors.muted, lineHeight: 19},
  meta: {fontSize: 12, color: colors.muted, fontWeight: '700'},
  overdue: {color: '#fff', fontSize: 12, fontWeight: '900'},
  near: {color: colors.danger, fontSize: 12, fontWeight: '900'},
});
