import React, {useCallback, useEffect, useState} from 'react';
import {Alert, FlatList, Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {ChevronRight} from 'lucide-react-native';
import {workApi} from '../../../api/workApi';
import {AppButton} from '../../../components/AppButton';
import {CardActions} from '../../../components/CardActions';
import {AppTextInput} from '../../../components/AppTextInput';
import {confirm} from '../../../components/Confirm';
import {EmptyState, ErrorState, LoadingView} from '../../../components/StateView';
import {colors} from '../../../theme/colors';
import {Department} from '../../../types/models';

export function DepartmentsTab({
  organizationId,
  permissions,
  onOpen,
  onChanged,
  onRegisterAddAction,
}: {
  organizationId: number;
  permissions: string[];
  onOpen: (department: Department) => void;
  onChanged?: () => void;
  onRegisterAddAction?: (action?: () => void) => void;
}) {
  const [items, setItems] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState<{visible: boolean; item?: Department}>({visible: false});
  const canAdd = permissions.includes('department_add');
  const canEdit = permissions.includes('department_edit');
  const canDelete = permissions.includes('department_delete');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await workApi.getDepartments({organization_id: organizationId, limit: 50, page: 1}));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

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
  const remove = (item: Department) => confirm('Xóa phòng ban', `Xóa "${item.name}"?`, async () => {
    try {
      await workApi.deleteDepartment(item.id);
      await load();
      onChanged?.();
    } catch (err) {
      Alert.alert('Không thể xóa', (err as Error).message);
    }
  });

  if (loading && items.length === 0) return <LoadingView label="Đang tải phòng ban..." />;
  if (error && items.length === 0) return <ErrorState message={error} onRetry={load} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="Chưa có phòng ban" />}
        renderItem={({item}) => (
          <Pressable style={styles.card} onPress={() => onOpen(item)}>
            <View style={styles.cardMain}>
              <View style={styles.cardBody}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.description || 'Chưa có mô tả'}</Text>
                <Text style={styles.meta}>{item.member_count || 0} nhân sự  |  {item.project_count || 0} dự án  |  {item.task_count || 0} công việc</Text>
              </View>
              <ChevronRight size={19} color={colors.muted} />
            </View>
            <CardActions
              onEdit={canEdit ? () => setEditor({visible: true, item}) : undefined}
              onDelete={canDelete ? () => remove(item) : undefined}
            />
          </Pressable>
        )}
      />
      <DepartmentEditor state={editor} organizationId={organizationId} onClose={() => setEditor({visible: false})} onSaved={async () => { await load(); onChanged?.(); }} />
    </View>
  );
}

function DepartmentEditor({state, organizationId, onClose, onSaved}: {
  state: {visible: boolean; item?: Department};
  organizationId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setName(state.item?.name || '');
    setDescription(state.item?.description || '');
  }, [state.item, state.visible]);
  const save = async () => {
    if (!name.trim()) return Alert.alert('Thiếu thông tin', 'Nhập tên phòng ban.');
    setSaving(true);
    try {
      await workApi.saveDepartment({department_id: state.item?.id, organization_id: state.item ? undefined : organizationId, name: name.trim(), description: description.trim()});
      onClose();
      onSaved();
    } catch (err) {
      Alert.alert('Không thể lưu', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal visible={state.visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{state.item ? 'Sửa phòng ban' : 'Thêm phòng ban'}</Text>
          <AppTextInput label="Tên phòng ban" value={name} onChangeText={setName} />
          <AppTextInput label="Mô tả" value={description} onChangeText={setDescription} multiline style={styles.textarea} />
          <AppButton title="Lưu" onPress={save} loading={saving} />
          <AppButton title="Hủy" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  list: {padding: 16, gap: 10, flexGrow: 1},
  card: {backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, gap: 10},
  cardMain: {flexDirection: 'row', alignItems: 'center', gap: 12},
  cardBody: {flex: 1, gap: 5},
  name: {fontSize: 16, fontWeight: '900', color: colors.text},
  description: {fontSize: 13, color: colors.muted},
  meta: {fontSize: 12, color: colors.primary, fontWeight: '700'},
  backdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet: {backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, gap: 14},
  sheetTitle: {fontSize: 20, color: colors.text, fontWeight: '900'},
  textarea: {height: 96, paddingTop: 12},
});
