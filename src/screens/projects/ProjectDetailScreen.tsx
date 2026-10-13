import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {workApi} from '../../api/workApi';
import {SegmentedTabs} from '../../components/SegmentedTabs';
import {AddIconButton} from '../../components/AddIconButton';
import {ErrorState, LoadingView} from '../../components/StateView';
import {useOrganizationPermissions} from '../../hooks/useOrganizationPermissions';
import {AppStackParamList} from '../../navigation/types';
import {colors} from '../../theme/colors';
import {Membership, Project} from '../../types/models';
import {formatDateTime} from '../../utils/date';
import {MembersTab} from '../organizations/tabs/MembersTab';
import {ScopeTasksTab} from '../organizations/tabs/ScopeTasksTab';

type Props = NativeStackScreenProps<AppStackParamList, 'ProjectDetail'>;
type Tab = 'members' | 'tasks';
export function ProjectDetailScreen({navigation, route}: Props) {
  const projectId = route.params.projectId;
  const [item, setItem] = useState<Project>(); const [tab, setTab] = useState<Tab>('tasks'); const [taskAssignee, setTaskAssignee] = useState<{id: number; name: string}>(); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const addActionRef = useRef<(() => void) | undefined>(undefined);
  const load = useCallback(async () => { setLoading(true); setError(''); try { setItem(await workApi.getProject(projectId)); } catch (err) { setError((err as Error).message); } finally { setLoading(false); } }, [projectId]);
  useEffect(() => { load(); }, [load]);
  const {permissions} = useOrganizationPermissions(item?.organization_id);
  const organizationId = item?.organization_id || undefined;
  const registerAddAction = useCallback((action?: () => void) => { addActionRef.current = action; }, []);
  const canAdd = tab === 'members' ? permissions.includes('org_member_add') : permissions.includes('task_add');
  useLayoutEffect(() => {
    const onAdd = () => {
      if (tab === 'tasks') {
        navigation.navigate('TaskForm', {defaultOrganizationId: organizationId, defaultProjectId: projectId});
      } else {
        addActionRef.current?.();
      }
    };
    navigation.setOptions({headerRight: canAdd ? () => <AddIconButton onPress={onAdd} /> : undefined});
    return () => navigation.setOptions({headerRight: undefined});
  }, [canAdd, navigation, organizationId, projectId, tab]);
  if (loading && !item) return <LoadingView label="Đang tải dự án..." />;
  if (error && !item) return <ErrorState message={error} onRetry={load} />;
  if (!item) return <ErrorState message="Không tìm thấy dự án." onRetry={load} />;
  const effectivePermissions = organizationId ? permissions : ['task_add', 'task_edit', 'task_edit_end_date', 'task_delete', 'org_member_add', 'org_member_delete'];
  const changeTab = (nextTab: Tab) => { if (nextTab !== 'tasks') setTaskAssignee(undefined); addActionRef.current = undefined; setTab(nextTab); };
  const openMemberTasks = (member: Membership) => { setTaskAssignee({id: member.id, name: member.fullname}); setTab('tasks'); };
  const listHeader = <View><View style={styles.hero}><Text style={styles.title}>{item.name}</Text><Text style={styles.description}>{item.description || 'Chưa có mô tả'}</Text><Text style={styles.meta}>{organizationId ? 'Dự án tổ chức' : 'Dự án cá nhân'}  |  {formatDateTime(item.start_date)} - {formatDateTime(item.end_date)}</Text></View><SegmentedTabs value={tab} onChange={changeTab} items={[{value: 'tasks', label: 'Công việc', count: item.task_count || 0}, {value: 'members', label: 'Nhân sự', count: item.member_count || 0}]} /></View>;
  return <View style={styles.screen}><View style={styles.content}>{tab === 'members' ? <MembersTab listHeader={listHeader} scope={{type: 'project', organizationId, projectId}} permissions={effectivePermissions} onChanged={load} onOpenTasks={openMemberTasks} onRegisterAddAction={registerAddAction} /> : <ScopeTasksTab listHeader={listHeader} organizationId={organizationId} projectId={projectId} permissions={effectivePermissions} assignee={taskAssignee} onClearAssignee={() => setTaskAssignee(undefined)} onOpen={task => navigation.navigate('TaskDetail', {taskId: task.id})} onEdit={task => navigation.navigate('TaskForm', {task, taskId: task.id})} />}</View></View>;
}
const styles = StyleSheet.create({screen: {flex: 1, backgroundColor: colors.background}, hero: {padding: 16, gap: 8, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border}, title: {fontSize: 21, fontWeight: '900', color: colors.text}, description: {fontSize: 13, color: colors.muted}, meta: {fontSize: 12, color: colors.primary, fontWeight: '800'}, content: {flex: 1}});
