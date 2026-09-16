import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {ChevronRight} from 'lucide-react-native';
import {workApi} from '../../../api/workApi';
import {CardActions} from '../../../components/CardActions';
import {confirm} from '../../../components/Confirm';
import {ProjectEditorModal} from '../../../components/ProjectEditorModal';
import {EmptyState, ErrorState, LoadingView} from '../../../components/StateView';
import {colors} from '../../../theme/colors';
import {Project} from '../../../types/models';
import {formatDateTime} from '../../../utils/date';
import {PROJECT_STATUSES} from '../../../constants/business';

export function ScopeProjectsTab({organizationId, departmentId, permissions, onOpen, onChanged, onRegisterAddAction}: {
  organizationId: number;
  departmentId?: number;
  permissions: string[];
  onOpen: (project: Project) => void;
  onChanged?: () => void;
  onRegisterAddAction?: (action?: () => void) => void;
}) {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState<{visible: boolean; project?: Project}>({visible: false});
  const [status, setStatus] = useState<number>();
  const canAdd = permissions.includes('project_add');
  const canEdit = permissions.includes('project_edit');
  const canDelete = permissions.includes('project_delete');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await workApi.getProjects({organization_id: organizationId, ...(departmentId ? {department_id: departmentId} : {})}));
    } catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  }, [departmentId, organizationId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!onRegisterAddAction) return;
    if (!canAdd) {
      onRegisterAddAction(undefined);
      return;
    }
    const openEditor = () => setEditor({visible: true});
    onRegisterAddAction(openEditor);
    return () => onRegisterAddAction(undefined);
  }, [canAdd, onRegisterAddAction]);
  const filtered = useMemo(() => {
    return status === undefined ? items : items.filter(item => item.status === status);
  }, [items, status]);
  const remove = (project: Project) => confirm('Xóa dự án', `Xóa "${project.name}" và dữ liệu liên quan?`, async () => {
    try { await workApi.deleteProject(project.id); await load(); onChanged?.(); } catch (err) { Alert.alert('Không thể xóa', (err as Error).message); }
  });
  if (loading && items.length === 0) return <LoadingView label="Đang tải dự án..." />;
  if (error && items.length === 0) return <ErrorState message={error} onRetry={load} />;
  return (
    <View style={styles.container}>
      <FlatList style={styles.filterList} horizontal data={[{value: undefined, label: 'Tất cả'}, ...PROJECT_STATUSES]} keyExtractor={item => String(item.value ?? 'all')} contentContainerStyle={styles.filters} showsHorizontalScrollIndicator={false} renderItem={({item}) => <Pressable style={[styles.chip, status === item.value && styles.chipActive]} onPress={() => setStatus(item.value)}><Text style={[styles.chipText, status === item.value && styles.chipTextActive]}>{item.label}</Text></Pressable>} />
      <FlatList data={filtered} keyExtractor={item => String(item.id)} contentContainerStyle={styles.list} ListEmptyComponent={<EmptyState title="Chưa có dự án" />} renderItem={({item}) => (
        <Pressable style={styles.card} onPress={() => onOpen(item)}>
          <View style={styles.cardMain}>
            <View style={styles.body}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.description} numberOfLines={2}>{item.description || 'Chưa có mô tả'}</Text>
              <Text style={styles.meta}>{formatDateTime(item.start_date)} - {formatDateTime(item.end_date)}</Text>
              <Text style={styles.meta}>{item.member_count || 0} nhân sự  |  {item.task_count || 0} công việc</Text>
            </View>
            <ChevronRight size={19} color={colors.muted} />
          </View>
          <CardActions
            onEdit={canEdit ? () => setEditor({visible: true, project: item}) : undefined}
            onDelete={canDelete ? () => remove(item) : undefined}
          />
        </Pressable>
      )} />
      <ProjectEditorModal visible={editor.visible} project={editor.project} organizationId={organizationId} departmentId={departmentId} onClose={() => setEditor({visible: false})} onSaved={async () => { await load(); onChanged?.(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1}, filterList: {height: 54, flexGrow: 0}, filters: {paddingHorizontal: 16, paddingVertical: 8}, chip: {minHeight: 38, justifyContent: 'center', paddingHorizontal: 12, marginRight: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface}, chipActive: {backgroundColor: colors.primary, borderColor: colors.primary}, chipText: {fontSize: 12, color: colors.muted, fontWeight: '800'}, chipTextActive: {color: '#fff'}, list: {padding: 16, gap: 10, flexGrow: 1},
  card: {backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, gap: 10},
  cardMain: {flexDirection: 'row', alignItems: 'center', gap: 12},
  body: {flex: 1, gap: 5}, name: {fontSize: 16, fontWeight: '900', color: colors.text}, description: {fontSize: 13, color: colors.muted}, meta: {fontSize: 12, color: colors.muted, fontWeight: '700'},
});
