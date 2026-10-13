import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BarChart3} from 'lucide-react-native';
import {workApi} from '../../api/workApi';
import {SegmentedTabs} from '../../components/SegmentedTabs';
import {AddIconButton} from '../../components/AddIconButton';
import {ErrorState, LoadingView} from '../../components/StateView';
import {useOrganizationPermissions} from '../../hooks/useOrganizationPermissions';
import {AppStackParamList} from '../../navigation/types';
import {colors} from '../../theme/colors';
import {Department, Membership} from '../../types/models';
import {MembersTab} from './tabs/MembersTab';
import {ScopeProjectsTab} from './tabs/ScopeProjectsTab';
import {ScopeTasksTab} from './tabs/ScopeTasksTab';

type Props = NativeStackScreenProps<AppStackParamList, 'DepartmentDetail'>;
type Tab = 'projects' | 'members' | 'tasks';
export function DepartmentDetailScreen({navigation, route}: Props) {
  const departmentId = route.params.departmentId;
  const [item, setItem] = useState<Department>(); const [tab, setTab] = useState<Tab>('projects'); const [taskAssignee, setTaskAssignee] = useState<{id: number; name: string}>(); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const addActionRef = useRef<(() => void) | undefined>(undefined);
  const load = useCallback(async () => { setLoading(true); setError(''); try { setItem(await workApi.getDepartment(departmentId)); } catch (err) { setError((err as Error).message); } finally { setLoading(false); } }, [departmentId]);
  useEffect(() => { load(); }, [load]);
  const {permissions} = useOrganizationPermissions(item?.organization_id);
  const organizationId = item?.organization_id;
  const registerAddAction = useCallback((action?: () => void) => { addActionRef.current = action; }, []);
  const canAdd = tab === 'projects' ? permissions.includes('project_add') : tab === 'members' ? permissions.includes('org_member_add') : permissions.includes('task_add');
  useLayoutEffect(() => {
    const onAdd = () => {
      if (tab === 'tasks') {
        if (organizationId) navigation.navigate('TaskForm', {defaultOrganizationId: organizationId, defaultDepartmentId: departmentId});
      } else {
        addActionRef.current?.();
      }
    };
    navigation.setOptions({headerRight: canAdd ? () => <AddIconButton onPress={onAdd} /> : undefined});
    return () => navigation.setOptions({headerRight: undefined});
  }, [canAdd, departmentId, navigation, organizationId, tab]);
  if (loading && !item) return <LoadingView label="Đang tải phòng ban..." />;
  if (error && !item) return <ErrorState message={error} onRetry={load} />;
  if (!organizationId) return <ErrorState message="Phòng ban không có organization_id." />;
  const changeTab = (nextTab: Tab) => { if (nextTab !== 'tasks') setTaskAssignee(undefined); addActionRef.current = undefined; setTab(nextTab); };
  const openMemberTasks = (member: Membership) => { setTaskAssignee({id: member.id, name: member.fullname}); setTab('tasks'); };
  const listHeader = <View><View style={styles.hero}><View style={styles.heroTop}><View style={styles.heroText}><Text style={styles.title}>{item.name}</Text><Text style={styles.description}>{item.organization_name ? `${item.organization_name}  |  ` : ''}{item.description || 'Chưa có mô tả'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Xem báo cáo phòng ban" style={styles.reportIcon} onPress={() => navigation.navigate('ManagementReport', {scope: 'department', id: departmentId})}><BarChart3 size={23} color={colors.primary} /></Pressable></View></View><SegmentedTabs value={tab} onChange={changeTab} items={[{value: 'projects', label: 'Dự án', count: item.project_count || 0}, {value: 'members', label: 'Nhân sự', count: item.member_count || 0}, {value: 'tasks', label: 'Công việc', count: item.task_count || 0}]} /></View>;
  return <View style={styles.screen}><View style={styles.content}>{tab === 'projects' ? <ScopeProjectsTab listHeader={listHeader} organizationId={organizationId} departmentId={departmentId} permissions={permissions} onOpen={project => navigation.navigate('ProjectDetail', {projectId: project.id})} onChanged={load} onRegisterAddAction={registerAddAction} /> : null}{tab === 'members' ? <MembersTab listHeader={listHeader} scope={{type: 'department', organizationId, departmentId}} permissions={permissions} onChanged={load} onOpenTasks={openMemberTasks} onRegisterAddAction={registerAddAction} /> : null}{tab === 'tasks' ? <ScopeTasksTab listHeader={listHeader} organizationId={organizationId} departmentId={departmentId} permissions={permissions} assignee={taskAssignee} onClearAssignee={() => setTaskAssignee(undefined)} onOpen={task => navigation.navigate('TaskDetail', {taskId: task.id})} onEdit={task => navigation.navigate('TaskForm', {task, taskId: task.id})} /> : null}</View></View>;
}
const styles = StyleSheet.create({screen: {flex: 1, backgroundColor: colors.background}, hero: {padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border}, heroTop: {flexDirection: 'row', alignItems: 'center', gap: 12}, heroText: {flex: 1, gap: 5}, reportIcon: {width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe'}, title: {fontSize: 21, fontWeight: '900', color: colors.text}, description: {fontSize: 13, color: colors.muted}, content: {flex: 1}});
