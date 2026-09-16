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
import {Membership, Organization} from '../../types/models';
import {DepartmentsTab} from './tabs/DepartmentsTab';
import {MembersTab} from './tabs/MembersTab';
import {RolesTab} from './tabs/RolesTab';
import {ScopeProjectsTab} from './tabs/ScopeProjectsTab';
import {ScopeTasksTab} from './tabs/ScopeTasksTab';

type Props = NativeStackScreenProps<AppStackParamList, 'OrganizationDetail'>;
type Tab = 'departments' | 'roles' | 'members' | 'projects' | 'tasks';

export function OrganizationDetailScreen({navigation, route}: Props) {
  const organizationId = route.params.organizationId;
  const [organization, setOrganization] = useState<Organization>();
  const [tab, setTab] = useState<Tab>('departments');
  const [taskAssignee, setTaskAssignee] = useState<{id: number; name: string}>();
  const addActionRef = useRef<(() => void) | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const {permissions} = useOrganizationPermissions(organizationId);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setOrganization(await workApi.getOrganization(organizationId)); }
    catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  }, [organizationId]);
  useEffect(() => { load(); }, [load]);
  const registerAddAction = useCallback((action?: () => void) => {
    addActionRef.current = action;
  }, []);
  const canAdd = tab === 'departments'
    ? permissions.includes('department_add')
    : tab === 'roles'
      ? permissions.includes('role_add')
      : tab === 'members'
        ? permissions.includes('org_member_add')
        : tab === 'projects'
          ? permissions.includes('project_add')
          : permissions.includes('task_add');
  useLayoutEffect(() => {
    const onAdd = () => {
      if (tab === 'tasks') {
        navigation.navigate('TaskForm', {defaultOrganizationId: organizationId});
      } else {
        addActionRef.current?.();
      }
    };
    navigation.setOptions({headerRight: canAdd ? () => <AddIconButton onPress={onAdd} /> : undefined});
    return () => navigation.setOptions({headerRight: undefined});
  }, [canAdd, navigation, organizationId, tab]);
  if (loading && !organization) return <LoadingView label="Đang tải tổ chức..." />;
  if (error && !organization) return <ErrorState message={error} onRetry={load} />;
  if (!organization) return null;
  const tabs = [
    {value: 'departments' as const, label: 'Phòng ban', count: organization.department_count || 0},
    {value: 'roles' as const, label: 'Vai trò', count: organization.role_count || 0},
    {value: 'members' as const, label: 'Nhân sự', count: organization.member_count || 0},
    {value: 'projects' as const, label: 'Dự án', count: organization.project_count || 0},
    {value: 'tasks' as const, label: 'Công việc', count: organization.task_count || 0},
  ];
  const changeTab = (nextTab: Tab) => {
    if (nextTab !== 'tasks') setTaskAssignee(undefined);
    addActionRef.current = undefined;
    setTab(nextTab);
  };
  const openMemberTasks = (member: Membership) => {
    setTaskAssignee({id: member.id, name: member.fullname});
    setTab('tasks');
  };
  return <View style={styles.screen}>
    <View style={styles.hero}>
      <View style={styles.identity}><View style={styles.avatar}><Text style={styles.avatarText}>{organization.name.charAt(0).toUpperCase()}</Text></View><View style={styles.heroText}><Text style={styles.title}>{organization.name}</Text><Text style={styles.description}>{organization.description || 'Chưa có mô tả'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Xem báo cáo tổ chức" style={styles.reportIcon} onPress={() => navigation.navigate('ManagementReport', {scope: 'organization', id: organizationId})}><BarChart3 size={23} color={colors.primary} /></Pressable></View>
    </View>
    <SegmentedTabs items={tabs} value={tab} onChange={changeTab} />
    <View style={styles.content}>
      {tab === 'departments' ? <DepartmentsTab organizationId={organizationId} permissions={permissions} onOpen={item => navigation.navigate('DepartmentDetail', {departmentId: item.id})} onChanged={load} onRegisterAddAction={registerAddAction} /> : null}
      {tab === 'roles' ? <RolesTab organizationId={organizationId} permissions={permissions} onChanged={load} onRegisterAddAction={registerAddAction} /> : null}
      {tab === 'members' ? <MembersTab scope={{type: 'organization', organizationId}} permissions={permissions} onChanged={load} onOpenTasks={openMemberTasks} onRegisterAddAction={registerAddAction} /> : null}
      {tab === 'projects' ? <ScopeProjectsTab organizationId={organizationId} permissions={permissions} onOpen={item => navigation.navigate('ProjectDetail', {projectId: item.id})} onChanged={load} onRegisterAddAction={registerAddAction} /> : null}
      {tab === 'tasks' ? <ScopeTasksTab organizationId={organizationId} permissions={permissions} assignee={taskAssignee} onClearAssignee={() => setTaskAssignee(undefined)} onOpen={item => navigation.navigate('TaskDetail', {taskId: item.id})} onEdit={item => navigation.navigate('TaskForm', {task: item, taskId: item.id})} /> : null}
    </View>
  </View>;
}

const styles = StyleSheet.create({screen: {flex: 1, backgroundColor: colors.background}, hero: {padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border}, identity: {flexDirection: 'row', alignItems: 'center', gap: 12}, avatar: {width: 54, height: 54, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'}, avatarText: {fontSize: 22, color: '#fff', fontWeight: '900'}, heroText: {flex: 1, gap: 4}, reportIcon: {width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe'}, title: {fontSize: 20, color: colors.text, fontWeight: '900'}, description: {fontSize: 13, color: colors.muted}, content: {flex: 1}});
