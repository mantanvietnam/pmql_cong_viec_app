import React, {useCallback, useEffect, useState} from 'react';
import {Alert, FlatList, Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {Edit3, Trash2} from 'lucide-react-native';
import {workApi} from '../../api/workApi';
import {AppButton} from '../../components/AppButton';
import {AppHeader} from '../../components/AppHeader';
import {AppTextInput} from '../../components/AppTextInput';
import {confirm} from '../../components/Confirm';
import {EmptyState, ErrorState, LoadingView} from '../../components/StateView';
import {PROJECT_STATUSES} from '../../constants/business';
import {colors} from '../../theme/colors';
import {Project} from '../../types/models';
import {formatDateTime} from '../../utils/date';

export function ProjectsScreen() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<{open: boolean; item?: Project}>({open: false});

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
    confirm('Xoa du an', `Xoa "${item.name}" va co the ca cong viec ben trong?`, async () => {
      try {
        await workApi.deleteProject(item.id);
        load();
      } catch (err) {
        Alert.alert('Khong the xoa', (err as Error).message);
      }
    });
  };

  if (loading && items.length === 0) return <LoadingView label="Dang tai du an..." />;
  if (error && items.length === 0) return <ErrorState message={error} onRetry={load} />;

  return (
    <View style={styles.screen}>
      <AppHeader title="Du an" subtitle="Theo doi trang thai va deadline" right={<AppButton title="Them" onPress={() => setModal({open: true})} style={styles.addButton} />} />
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={item => String(item.id)}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          load();
        }}
        ListEmptyComponent={<EmptyState title="Chua co du an" />}
        renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.title}>{item.name}</Text>
              <View style={styles.actions}>
                <Pressable onPress={() => setModal({open: true, item})}><Edit3 color={colors.primary} size={18} /></Pressable>
                <Pressable onPress={() => remove(item)}><Trash2 color={colors.danger} size={18} /></Pressable>
              </View>
            </View>
            <Text style={styles.desc} numberOfLines={2}>{item.description || 'Chua co mo ta'}</Text>
            <Text style={styles.meta}>Bat dau: {formatDateTime(item.start_date as number)} • Han: {formatDateTime(item.end_date as number)}</Text>
            <Text style={styles.meta}>{item.task_count || 0} cong viec • {item.member_count || 0} nhan su</Text>
          </View>
        )}
      />
      <ProjectModal state={modal} onClose={() => setModal({open: false})} onSaved={load} />
    </View>
  );
}

function ProjectModal({state, onClose, onSaved}: {state: {open: boolean; item?: Project}; onClose: () => void; onSaved: () => void}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(state.item?.name || '');
    setDescription(state.item?.description || '');
    setStatus(state.item?.status || 0);
  }, [state.item, state.open]);

  const save = async () => {
    if (!name.trim()) return Alert.alert('Thieu thong tin', 'Vui long nhap ten du an.');
    setSaving(true);
    try {
      await workApi.saveProject({project_id: state.item?.id, name: name.trim(), description, status});
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
          <Text style={styles.modalTitle}>{state.item ? 'Sua du an' : 'Them du an'}</Text>
          <AppTextInput label="Ten du an" value={name} onChangeText={setName} />
          <AppTextInput label="Mo ta" value={description} onChangeText={setDescription} multiline style={styles.textarea} />
          <View style={styles.wrap}>
            {PROJECT_STATUSES.map(item => (
              <AppButton key={item.value} title={item.label} variant={status === item.value ? 'primary' : 'secondary'} onPress={() => setStatus(item.value)} style={styles.statusButton} />
            ))}
          </View>
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
  list: {padding: 16, gap: 12},
  card: {backgroundColor: colors.surface, borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.border},
  cardTop: {flexDirection: 'row', justifyContent: 'space-between', gap: 12},
  title: {flex: 1, fontSize: 16, fontWeight: '900', color: colors.text},
  desc: {fontSize: 13, color: colors.muted},
  meta: {fontSize: 12, color: colors.muted, fontWeight: '700'},
  actions: {flexDirection: 'row', gap: 14},
  modalBackdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)'},
  modal: {backgroundColor: colors.surface, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 14},
  modalTitle: {fontSize: 20, fontWeight: '900', color: colors.text},
  textarea: {height: 96, paddingTop: 12},
  wrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  statusButton: {minHeight: 42},
});
