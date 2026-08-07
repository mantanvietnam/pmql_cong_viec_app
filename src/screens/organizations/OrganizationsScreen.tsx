import React, {useCallback, useEffect, useState} from 'react';
import {Alert, FlatList, Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {Edit3, Trash2} from 'lucide-react-native';
import {workApi} from '../../api/workApi';
import {AppButton} from '../../components/AppButton';
import {AppHeader} from '../../components/AppHeader';
import {AppTextInput} from '../../components/AppTextInput';
import {confirm} from '../../components/Confirm';
import {EmptyState, ErrorState, LoadingView} from '../../components/StateView';
import {colors} from '../../theme/colors';
import {Organization} from '../../types/models';
import {initials} from '../../utils/text';

export function OrganizationsScreen() {
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
    confirm('Xoa to chuc', `Xoa "${item.name}"?`, async () => {
      try {
        await workApi.deleteOrganization(item.id);
        load();
      } catch (err) {
        Alert.alert('Khong the xoa', (err as Error).message);
      }
    });
  };

  if (loading && items.length === 0) return <LoadingView label="Dang tai to chuc..." />;
  if (error && items.length === 0) return <ErrorState message={error} onRetry={load} />;

  return (
    <View style={styles.screen}>
      <AppHeader title="To chuc" subtitle="Phong ban, du an va nhan su" right={<AppButton title="Them" onPress={() => setModal({open: true})} style={styles.addButton} />} />
      <View style={styles.filters}>
        <AppTextInput value={search} onChangeText={setSearch} onSubmitEditing={load} placeholder="Tim kiem to chuc..." />
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={item => String(item.id)}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          load();
        }}
        ListEmptyComponent={<EmptyState title="Chua co to chuc" />}
        renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.name)}</Text></View>
            <View style={styles.cardBody}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.desc} numberOfLines={2}>{item.description || 'Chua co mo ta'}</Text>
              <Text style={styles.meta}>{item.department_count || 0} phong ban • {item.project_count || 0} du an • {item.task_count || 0} cong viec</Text>
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => setModal({open: true, item})}><Edit3 color={colors.primary} size={18} /></Pressable>
              <Pressable onPress={() => remove(item)}><Trash2 color={colors.danger} size={18} /></Pressable>
            </View>
          </View>
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
    if (!name.trim()) return Alert.alert('Thieu thong tin', 'Vui long nhap ten to chuc.');
    setSaving(true);
    try {
      await workApi.saveOrganization({organization_id: state.item?.id, name: name.trim(), description});
      onClose();
      onSaved();
    } catch (err) {
      Alert.alert('Khong the luu', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={state.open} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{state.item ? 'Sua to chuc' : 'Them to chuc'}</Text>
          <AppTextInput label="Ten to chuc" value={name} onChangeText={setName} />
          <AppTextInput label="Mo ta" value={description} onChangeText={setDescription} multiline style={styles.textarea} />
          <AppButton title="Luu" onPress={save} loading={saving} />
          <AppButton title="Huy" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  addButton: {minHeight: 40, paddingHorizontal: 12},
  filters: {padding: 16},
  list: {padding: 16, paddingTop: 0, gap: 12},
  card: {backgroundColor: colors.surface, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: colors.border},
  avatar: {width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  avatarText: {color: '#fff', fontSize: 18, fontWeight: '900'},
  cardBody: {flex: 1, gap: 5},
  title: {fontSize: 16, fontWeight: '900', color: colors.text},
  desc: {fontSize: 13, color: colors.muted},
  meta: {fontSize: 12, color: colors.primary, fontWeight: '800'},
  actions: {gap: 14, justifyContent: 'center'},
  modalBackdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)'},
  modal: {backgroundColor: colors.surface, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 14},
  modalTitle: {fontSize: 20, fontWeight: '900', color: colors.text},
  textarea: {height: 96, paddingTop: 12},
});
