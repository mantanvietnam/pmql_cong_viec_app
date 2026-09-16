import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {Search} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {workApi} from '../../api/workApi';
import {CardActions} from '../../components/CardActions';
import {AppHeader} from '../../components/AppHeader';
import {AddIconButton} from '../../components/AddIconButton';
import {AppTextInput} from '../../components/AppTextInput';
import {confirm} from '../../components/Confirm';
import {ProjectEditorModal} from '../../components/ProjectEditorModal';
import {EmptyState, ErrorState, LoadingView} from '../../components/StateView';
import {colors} from '../../theme/colors';
import {Project} from '../../types/models';
import {formatDateTime} from '../../utils/date';
import {AppStackParamList} from '../../navigation/types';
import {PROJECT_STATUSES} from '../../constants/business';
import {useAuth} from '../../context/AuthContext';

export function ProjectsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const {session} = useAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<{open: boolean; item?: Project}>({open: false});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<number>();
  const permissions = session?.permissions || ['project_add', 'project_edit', 'project_delete'];
  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi');
    return items.filter(item => (!keyword || item.name.toLocaleLowerCase('vi').includes(keyword)) && (status === undefined || item.status === status));
  }, [items, search, status]);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      setItems(await workApi.getProjects({}));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = (item: Project) => {
    confirm('Xóa dự án', `Xóa "${item.name}" và có thể cả công việc bên trong?`, async () => {
      try {
        await workApi.deleteProject(item.id);
        load();
      } catch (err) {
        Alert.alert('Không thể xóa', (err as Error).message);
      }
    });
  };

  if (loading && items.length === 0) return <LoadingView label="Đang tải dự án..." />;
  if (error && items.length === 0) return <ErrorState message={error} onRetry={load} />;

  return (
    <View style={styles.screen}>
      <AppHeader title="Dự án" subtitle="Theo dõi trạng thái và hạn chót" right={permissions.includes('project_add') ? <AddIconButton onPress={() => setModal({open: true})} /> : undefined} />
      <View style={styles.filters}>
        <View style={styles.searchRow}><Search size={20} color={colors.muted} /><AppTextInput value={search} onChangeText={setSearch} placeholder="Tìm tên dự án" style={styles.searchInput} /></View>
        <FlatList horizontal data={[{value: undefined, label: 'Tất cả'}, ...PROJECT_STATUSES]} keyExtractor={item => String(item.value ?? 'all')} showsHorizontalScrollIndicator={false} renderItem={({item}) => <Pressable style={[styles.chip, status === item.value && styles.chipActive]} onPress={() => setStatus(item.value)}><Text style={[styles.chipText, status === item.value && styles.chipTextActive]}>{item.label}</Text></Pressable>} />
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={filtered}
        keyExtractor={item => String(item.id)}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          load();
        }}
        ListEmptyComponent={<EmptyState title="Chưa có dự án" />}
        renderItem={({item}) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('ProjectDetail', {projectId: item.id})}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.description || 'Chưa có mô tả'}</Text>
            <Text style={styles.status}>{PROJECT_STATUSES.find(value => value.value === item.status)?.label || 'Chưa rõ trạng thái'}</Text>
            <Text style={styles.meta}>Bắt đầu: {formatDateTime(item.start_date)} • Hạn: {formatDateTime(item.end_date)}</Text>
            <Text style={styles.meta}>{item.task_count || 0} công việc • {item.member_count || 0} nhân sự</Text>
            <CardActions
              onEdit={permissions.includes('project_edit') ? () => setModal({open: true, item}) : undefined}
              onDelete={permissions.includes('project_delete') ? () => remove(item) : undefined}
            />
          </Pressable>
        )}
      />
      <ProjectEditorModal visible={modal.open} project={modal.item} onClose={() => setModal({open: false})} onSaved={load} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  filters: {padding: 16, paddingBottom: 4, gap: 10},
  searchRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  searchInput: {flex: 1},
  chip: {minHeight: 40, paddingHorizontal: 13, justifyContent: 'center', marginRight: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface},
  chipActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  chipText: {fontSize: 13, color: colors.muted, fontWeight: '800'},
  chipTextActive: {color: '#fff'},
  list: {padding: 16, gap: 12},
  card: {backgroundColor: colors.surface, borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.border},
  title: {fontSize: 16, fontWeight: '900', color: colors.text},
  desc: {fontSize: 13, color: colors.muted},
  status: {fontSize: 12, color: colors.primary, fontWeight: '900'},
  meta: {fontSize: 12, color: colors.muted, fontWeight: '700'},
});
