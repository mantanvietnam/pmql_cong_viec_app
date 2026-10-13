import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {ListChecks} from 'lucide-react-native';
import {workApi} from '../../../api/workApi';
import {AppButton} from '../../../components/AppButton';
import {CardActions} from '../../../components/CardActions';
import {AppTextInput} from '../../../components/AppTextInput';
import {confirm} from '../../../components/Confirm';
import {EmptyState, ErrorState, LoadingView} from '../../../components/StateView';
import {colors} from '../../../theme/colors';
import {MemberScope, Membership, Role, User} from '../../../types/models';
import {getScopeLabel} from '../../../utils/scope';
import {AppStackParamList} from '../../../navigation/types';

export function MembersTab({scope, permissions, onChanged, onOpenTasks, onRegisterAddAction, listHeader}: {
  scope: MemberScope;
  permissions: string[];
  onChanged?: () => void;
  onOpenTasks: (member: Membership) => void;
  onRegisterAddAction?: (action?: () => void) => void;
  listHeader?: React.ReactElement;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const scopeType = scope.type;
  const organizationId = scope.organizationId;
  const departmentId = scope.type === 'department' ? scope.departmentId : undefined;
  const projectId = scope.type === 'project' ? scope.projectId : undefined;
  const stableScope = useMemo<MemberScope>(() => {
    if (scopeType === 'department') return {type: scopeType, organizationId: organizationId!, departmentId: departmentId!};
    if (scopeType === 'project') return {type: scopeType, organizationId, projectId: projectId!};
    return {type: scopeType, organizationId: organizationId!};
  }, [departmentId, organizationId, projectId, scopeType]);
  const [items, setItems] = useState<Membership[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Membership>();
  const canAdd = permissions.includes('org_member_add');
  const canDelete = permissions.includes('org_member_delete');
  const canEditRole = scopeType === 'organization' && permissions.includes('user_edit');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [members, nextRoles] = await Promise.all([workApi.getMembers(stableScope), organizationId ? workApi.getRoles(organizationId) : Promise.resolve([])]);
      setItems(members); setRoles(nextRoles);
    } catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  }, [organizationId, stableScope]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!onRegisterAddAction) return;
    if (!canAdd) {
      onRegisterAddAction(undefined);
      return;
    }
    const openAdd = () => setAddOpen(true);
    onRegisterAddAction(openAdd);
    return () => onRegisterAddAction(undefined);
  }, [canAdd, onRegisterAddAction]);

  const remove = (member: Membership) => confirm('Xóa nhân sự', `Xóa ${member.fullname} khỏi ${getScopeLabel(stableScope)}?`, async () => {
    try { await workApi.deleteMember(stableScope, member.join_id); await load(); onChanged?.(); } catch (err) { Alert.alert('Không thể xóa', (err as Error).message); }
  });

  if (loading && items.length === 0) return <ListState header={listHeader} content={<LoadingView label="Đang tải nhân sự..." />} />;
  if (error && items.length === 0) return <ListState header={listHeader} content={<ErrorState message={error} onRetry={load} />} />;
  return (
    <View style={styles.container}>
      <FlatList data={items} keyExtractor={item => String(item.join_id)} contentContainerStyle={styles.list} ListHeaderComponent={listHeader} ListHeaderComponentStyle={styles.listHeader} ListEmptyComponent={<EmptyState title="Chưa có nhân sự" />} renderItem={({item}) => {
        const role = roles.find(value => value.id === item.role_id);
        return (
          <View style={styles.card}>
            <View style={styles.cardMain}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{item.fullname?.charAt(0).toUpperCase() || '?'}</Text></View>
              <View style={styles.body}>
                <Text style={styles.name}>{item.fullname}</Text>
                <Text style={styles.meta}>{item.phone || item.email || 'Chưa có liên hệ'}</Text>
                <Text style={styles.role}>{role?.name || 'Chưa phân quyền'}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Xem ${item.total_tasks || 0} công việc của ${item.fullname}`}
                  style={styles.taskMetric}
                  onPress={() => onOpenTasks(item)}>
                  <ListChecks size={16} color={colors.primary} />
                  <Text style={styles.taskMetricText}>{item.total_tasks || 0} công việc</Text>
                </Pressable>
              </View>
            </View>
            <CardActions
              onReport={() => navigation.navigate('MemberReport', {userId: item.id, userName: item.fullname, organizationId})}
              onEdit={canEditRole ? () => setEditing(item) : undefined}
              onDelete={canDelete ? () => remove(item) : undefined}
            />
          </View>
        );
      }} />
      <AddMembersModal visible={addOpen} scope={stableScope} roles={roles} existingIds={items.map(item => item.id)} onClose={() => setAddOpen(false)} onSaved={async () => { await load(); onChanged?.(); }} />
      <EditRoleModal member={editing} organizationId={organizationId || 0} roles={roles} onClose={() => setEditing(undefined)} onSaved={load} />
    </View>
  );
}

function ListState({header, content}: {header?: React.ReactElement; content: React.ReactElement}) {
  return <FlatList data={[]} renderItem={null} contentContainerStyle={styles.list} ListHeaderComponent={header} ListHeaderComponentStyle={styles.listHeader} ListEmptyComponent={content} />;
}

function AddMembersModal({visible, scope, roles, existingIds, onClose, onSaved}: {
  visible: boolean; scope: MemberScope; roles: Role[]; existingIds: number[]; onClose: () => void; onSaved: () => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [candidates, setCandidates] = useState<User[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [roleId, setRoleId] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) { setCandidates([]); setSelected([]); setKeyword(''); setRoleId(undefined); return; }
    if (scope.type !== 'organization' && scope.organizationId) {
      setLoading(true);
      workApi.getOrganizationMembers(scope.organizationId).then(setCandidates).catch(err => Alert.alert('Không thể tải nhân sự', (err as Error).message)).finally(() => setLoading(false));
    }
  }, [scope, visible]);

  const searchUsers = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    try { setCandidates(await workApi.searchUsers(keyword.trim(), scope.type === 'organization' ? undefined : scope.organizationId)); } catch (err) { Alert.alert('Không thể tìm', (err as Error).message); } finally { setLoading(false); }
  };
  const available = candidates.filter(item => !existingIds.includes(item.id));
  const save = async () => {
    if (selected.length === 0) return Alert.alert('Chưa chọn nhân sự', 'Chọn ít nhất một người.');
    setSaving(true);
    try { await workApi.addMembers(scope, selected, roleId); onClose(); onSaved(); } catch (err) { Alert.alert('Không thể thêm', (err as Error).message); } finally { setSaving(false); }
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}><View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Thêm nhân sự</Text>
        {scope.type === 'organization' || !scope.organizationId ? <View style={styles.searchRow}><AppTextInput value={keyword} onChangeText={setKeyword} placeholder="Tên, email hoặc số điện thoại" style={styles.search} /><AppButton title="Tìm" onPress={searchUsers} loading={loading} style={styles.searchButton} /></View> : null}
        <ScrollView contentContainerStyle={styles.pickerList}>
          {loading ? <LoadingView label="Đang tải..." /> : available.map(user => {
            const active = selected.includes(user.id);
            return <Pressable key={user.id} style={[styles.choice, active && styles.choiceActive]} onPress={() => setSelected(prev => active ? prev.filter(id => id !== user.id) : [...prev, user.id])}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{user.fullname}</Text><Text style={[styles.choiceMeta, active && styles.choiceTextActive]}>{user.phone || user.email || ''}</Text></Pressable>;
          })}
        </ScrollView>
        {scope.type === 'organization' ? <><Text style={styles.label}>Vai trò</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleList}>{roles.map(role => <Pressable key={role.id} style={[styles.roleChoice, roleId === role.id && styles.choiceActive]} onPress={() => setRoleId(role.id)}><Text style={[styles.choiceText, roleId === role.id && styles.choiceTextActive]}>{role.name}</Text></Pressable>)}</ScrollView></> : null}
        <AppButton title={`Thêm ${selected.length} nhân sự`} onPress={save} loading={saving} />
        <AppButton title="Hủy" variant="ghost" onPress={onClose} />
      </View></View>
    </Modal>
  );
}

function EditRoleModal({member, organizationId, roles, onClose, onSaved}: {member?: Membership; organizationId: number; roles: Role[]; onClose: () => void; onSaved: () => void}) {
  const [roleId, setRoleId] = useState<number>();
  const [saving, setSaving] = useState(false);
  useEffect(() => { setRoleId(member?.role_id || undefined); }, [member]);
  const save = async () => {
    if (!member) return;
    setSaving(true);
    try { await workApi.editOrganizationMember({user_id: member.id, organization_id: organizationId, role_id: roleId || null}); onClose(); onSaved(); } catch (err) { Alert.alert('Không thể cập nhật', (err as Error).message); } finally { setSaving(false); }
  };
  return <Modal visible={Boolean(member)} transparent animationType="fade" onRequestClose={onClose}><View style={styles.centerBackdrop}><View style={styles.dialog}><Text style={styles.sheetTitle}>Vai trò của {member?.fullname}</Text>{roles.map(role => <Pressable key={role.id} style={[styles.choice, roleId === role.id && styles.choiceActive]} onPress={() => setRoleId(role.id)}><Text style={[styles.choiceText, roleId === role.id && styles.choiceTextActive]}>{role.name}</Text></Pressable>)}<AppButton title="Cập nhật" onPress={save} loading={saving} /><AppButton title="Hủy" variant="ghost" onPress={onClose} /></View></View></Modal>;
}

const styles = StyleSheet.create({
  container: {flex: 1}, search: {flex: 1}, list: {padding: 16, gap: 10, flexGrow: 1}, listHeader: {marginHorizontal: -16, marginTop: -16}, card: {padding: 13, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 10}, cardMain: {flexDirection: 'row', alignItems: 'center', gap: 11}, avatar: {width: 42, height: 42, borderRadius: 21, backgroundColor: '#e8f0fe', alignItems: 'center', justifyContent: 'center'}, avatarText: {fontWeight: '900', color: colors.primary}, body: {flex: 1, gap: 3}, name: {fontSize: 15, fontWeight: '900', color: colors.text}, meta: {fontSize: 12, color: colors.muted}, role: {fontSize: 12, color: colors.muted, fontWeight: '700'}, taskMetric: {minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 12}, taskMetricText: {fontSize: 13, color: colors.primary, fontWeight: '900'},
  backdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)'}, centerBackdrop: {flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.4)'}, sheet: {maxHeight: '90%', padding: 18, gap: 13, backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16}, dialog: {padding: 18, gap: 12, backgroundColor: colors.surface, borderRadius: 8}, sheetTitle: {fontSize: 20, color: colors.text, fontWeight: '900'}, searchRow: {flexDirection: 'row', gap: 8, alignItems: 'flex-end'}, searchButton: {minHeight: 48}, pickerList: {gap: 8, minHeight: 100, maxHeight: 320}, choice: {padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface}, choiceActive: {backgroundColor: colors.primary, borderColor: colors.primary}, choiceText: {fontSize: 14, fontWeight: '800', color: colors.text}, choiceTextActive: {color: '#fff'}, choiceMeta: {fontSize: 12, color: colors.muted, marginTop: 3}, label: {fontSize: 13, color: colors.text, fontWeight: '800'}, roleList: {gap: 8}, roleChoice: {paddingHorizontal: 13, minHeight: 40, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface},
});
