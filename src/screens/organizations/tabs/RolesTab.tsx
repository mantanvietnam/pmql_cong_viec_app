import React, {useCallback, useEffect, useState} from 'react';
import {Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {workApi} from '../../../api/workApi';
import {AppButton} from '../../../components/AppButton';
import {CardActions} from '../../../components/CardActions';
import {AppTextInput} from '../../../components/AppTextInput';
import {confirm} from '../../../components/Confirm';
import {EmptyState, ErrorState, LoadingView} from '../../../components/StateView';
import {colors} from '../../../theme/colors';
import {Permission, Role} from '../../../types/models';

export function RolesTab({organizationId, permissions, onChanged, onRegisterAddAction}: {organizationId: number; permissions: string[]; onChanged?: () => void; onRegisterAddAction?: (action?: () => void) => void}) {
  const [items, setItems] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState<{visible: boolean; role?: Role}>({visible: false});
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const [roles, available] = await Promise.all([workApi.getRoles(organizationId), workApi.getPermissions()]); setItems(roles); setAllPermissions(available); }
    catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  }, [organizationId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!onRegisterAddAction) return;
    if (!permissions.includes('role_add')) {
      onRegisterAddAction(undefined);
      return;
    }
    const openEditor = () => setEditor({visible: true});
    onRegisterAddAction(openEditor);
    return () => onRegisterAddAction(undefined);
  }, [onRegisterAddAction, permissions]);
  const remove = (role: Role) => confirm('Xóa vai trò', `Xóa vai trò "${role.name}"?`, async () => {
    try { await workApi.deleteRole(role.id); await load(); onChanged?.(); } catch (err) { Alert.alert('Không thể xóa', (err as Error).message); }
  });
  if (loading && items.length === 0) return <LoadingView label="Đang tải vai trò..." />;
  if (error && items.length === 0) return <ErrorState message={error} onRetry={load} />;
  return <View style={styles.container}>
    <FlatList data={items} keyExtractor={item => String(item.id)} contentContainerStyle={styles.list} ListEmptyComponent={<EmptyState title="Chưa có vai trò" />} renderItem={({item}) => <View style={styles.card}><View style={styles.body}><Text style={styles.name}>{item.name}</Text><Text style={styles.description}>{item.description || 'Chưa có mô tả'}</Text><Text style={styles.meta}>{item.permissions?.length || 0} quyền  |  {item.member_count || 0} thành viên</Text></View><CardActions onEdit={permissions.includes('role_edit') ? () => setEditor({visible: true, role: item}) : undefined} onDelete={permissions.includes('role_delete') ? () => remove(item) : undefined} /></View>} />
    <RoleEditor visible={editor.visible} role={editor.role} organizationId={organizationId} available={allPermissions} onClose={() => setEditor({visible: false})} onSaved={async () => { await load(); onChanged?.(); }} />
  </View>;
}

function RoleEditor({visible, role, organizationId, available, onClose, onSaved}: {visible: boolean; role?: Role; organizationId: number; available: Permission[]; onClose: () => void; onSaved: () => void}) {
  const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [selected, setSelected] = useState<number[]>([]); const [saving, setSaving] = useState(false);
  useEffect(() => { setName(role?.name || ''); setDescription(role?.description || ''); setSelected(role?.permissions?.map(item => item.id) || []); }, [role, visible]);
  const save = async () => { if (!name.trim()) return Alert.alert('Thiếu thông tin', 'Nhập tên vai trò.'); setSaving(true); try { await workApi.saveRole({id: role?.id, organization_id: organizationId, name: name.trim(), description: description.trim(), permissions: selected}); onClose(); onSaved(); } catch (err) { Alert.alert('Không thể lưu', (err as Error).message); } finally { setSaving(false); } };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.sheet}><Text style={styles.sheetTitle}>{role ? 'Sửa vai trò' : 'Thêm vai trò'}</Text><ScrollView contentContainerStyle={styles.editorContent}><AppTextInput label="Tên vai trò" value={name} onChangeText={setName} /><AppTextInput label="Mô tả" value={description} onChangeText={setDescription} /><View style={styles.permissionHeader}><Text style={styles.label}>Phân quyền ({selected.length}/{available.length})</Text><Pressable onPress={() => setSelected(selected.length === available.length ? [] : available.map(item => item.id))}><Text style={styles.selectAll}>{selected.length === available.length ? 'Bỏ chọn' : 'Chọn tất cả'}</Text></Pressable></View>{available.map(permission => { const active = selected.includes(permission.id); return <Pressable key={permission.id} style={[styles.permission, active && styles.permissionActive]} onPress={() => setSelected(prev => active ? prev.filter(id => id !== permission.id) : [...prev, permission.id])}><Text style={[styles.permissionName, active && styles.permissionTextActive]}>{permission.name}</Text><Text style={[styles.permissionCode, active && styles.permissionTextActive]}>{permission.code}</Text></Pressable>; })}<AppButton title="Lưu vai trò" onPress={save} loading={saving} /><AppButton title="Hủy" variant="ghost" onPress={onClose} /></ScrollView></View></View></Modal>;
}

const styles = StyleSheet.create({container: {flex: 1}, list: {padding: 16, gap: 10, flexGrow: 1}, card: {padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface, gap: 10}, body: {gap: 5}, name: {fontSize: 16, color: colors.text, fontWeight: '900'}, description: {fontSize: 13, color: colors.muted}, meta: {fontSize: 12, color: colors.primary, fontWeight: '700'}, backdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)'}, sheet: {maxHeight: '92%', backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16}, sheetTitle: {padding: 18, fontSize: 20, fontWeight: '900', color: colors.text, backgroundColor: colors.surface}, editorContent: {padding: 16, gap: 10}, permissionHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}, label: {fontSize: 13, color: colors.text, fontWeight: '800'}, selectAll: {color: colors.primary, fontWeight: '800', padding: 8}, permission: {padding: 11, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface}, permissionActive: {backgroundColor: colors.primary, borderColor: colors.primary}, permissionName: {fontSize: 13, fontWeight: '800', color: colors.text}, permissionCode: {fontSize: 11, color: colors.muted, marginTop: 3}, permissionTextActive: {color: '#fff'}});
