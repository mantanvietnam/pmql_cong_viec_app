import React, {useCallback, useEffect, useState} from 'react';
import {Alert, FlatList, Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {workApi} from '../../api/workApi';
import {AppButton} from '../../components/AppButton';
import {CardActions} from '../../components/CardActions';
import {AppHeader} from '../../components/AppHeader';
import {AddIconButton} from '../../components/AddIconButton';
import {AppTextInput} from '../../components/AppTextInput';
import {confirm} from '../../components/Confirm';
import {EmptyState, ErrorState, LoadingView} from '../../components/StateView';
import {colors} from '../../theme/colors';
import {Organization} from '../../types/models';
import {initials} from '../../utils/text';
import {AppStackParamList} from '../../navigation/types';

export function OrganizationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [items, setItems] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{open: boolean; item?: Organization}>({open: false});

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      setItems(await workApi.getOrganizations(search));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = (item: Organization) => {
    confirm('Xóa tổ chức', `Xóa "${item.name}"?`, async () => {
      try {
        await workApi.deleteOrganization(item.id);
        load();
      } catch (err) {
        Alert.alert('Không thể xóa', (err as Error).message);
      }
    });
  };

  if (loading && items.length === 0) return <View style={styles.screen}>
    <AppHeader title="Tổ chức" subtitle="Phòng ban, dự án và nhân sự" right={<AddIconButton onPress={() => setModal({open: true})} />} />
    <LoadingView label="Đang tải tổ chức..." />
    <OrganizationModal state={modal} onClose={() => setModal({open: false})} onSaved={load} />
  </View>;
  if (error && items.length === 0) return <View style={styles.screen}>
    <AppHeader title="Tổ chức" subtitle="Phòng ban, dự án và nhân sự" right={<AddIconButton onPress={() => setModal({open: true})} />} />
    <ErrorState message={error} onRetry={load} />
    <OrganizationModal state={modal} onClose={() => setModal({open: false})} onSaved={load} />
  </View>;

  return (
    <View style={styles.screen}>
      <AppHeader title="Tổ chức" subtitle="Phòng ban, dự án và nhân sự" right={<AddIconButton onPress={() => setModal({open: true})} />} />
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={item => String(item.id)}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          load();
        }}
        ListHeaderComponent={<View style={styles.listHeader}>
          <View style={styles.filters}>
            <AppTextInput value={search} onChangeText={setSearch} onSubmitEditing={load} placeholder="Tìm kiếm tổ chức..." />
          </View>
        </View>}
        ListEmptyComponent={<EmptyState title="Chưa có tổ chức" />}
        renderItem={({item}) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('OrganizationDetail', {organizationId: item.id})}>
            <View style={styles.cardMain}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.name)}</Text></View>
              <View style={styles.cardBody}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>{item.description || 'Chưa có mô tả'}</Text>
                <Text style={styles.meta}>{item.department_count || 0} phòng ban • {item.project_count || 0} dự án • {item.task_count || 0} công việc</Text>
              </View>
            </View>
            <CardActions onEdit={() => setModal({open: true, item})} onDelete={() => remove(item)} />
          </Pressable>
        )}
      />
      <OrganizationModal state={modal} onClose={() => setModal({open: false})} onSaved={load} />
    </View>
  );
}

function OrganizationModal({state, onClose, onSaved}: {state: {open: boolean; item?: Organization}; onClose: () => void; onSaved: () => void}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(state.item?.name || '');
    setDescription(state.item?.description || '');
  }, [state.item, state.open]);

  const save = async () => {
    if (!name.trim()) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên tổ chức.');
    setSaving(true);
    try {
      await workApi.saveOrganization({organization_id: state.item?.id, name: name.trim(), description});
      onClose();
      onSaved();
    } catch (err) {
      Alert.alert('Không thể lưu', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={state.open} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{state.item ? 'Sửa tổ chức' : 'Thêm tổ chức'}</Text>
          <AppTextInput label="Tên tổ chức" value={name} onChangeText={setName} />
          <AppTextInput label="Mô tả" value={description} onChangeText={setDescription} multiline style={styles.textarea} />
          <AppButton title="Lưu" onPress={save} loading={saving} />
          <AppButton title="Hủy" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  listHeader: {marginHorizontal: -16, marginTop: -16},
  filters: {padding: 16},
  list: {padding: 16, gap: 12, flexGrow: 1},
  card: {backgroundColor: colors.surface, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: colors.border},
  cardMain: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
  avatar: {width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  avatarText: {color: '#fff', fontSize: 18, fontWeight: '900'},
  cardBody: {flex: 1, gap: 5},
  title: {fontSize: 16, fontWeight: '900', color: colors.text},
  desc: {fontSize: 13, color: colors.muted},
  meta: {fontSize: 12, color: colors.primary, fontWeight: '800'},
  modalBackdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)'},
  modal: {backgroundColor: colors.surface, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 14},
  modalTitle: {fontSize: 20, fontWeight: '900', color: colors.text},
  textarea: {height: 96, paddingTop: 12},
});
