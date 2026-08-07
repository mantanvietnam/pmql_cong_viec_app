import React, {useEffect, useMemo, useState} from 'react';
import {Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DocumentPicker from 'react-native-document-picker';
import {launchImageLibrary} from 'react-native-image-picker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {X} from 'lucide-react-native';
import {workApi} from '../../api/workApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {TASK_STATUSES} from '../../constants/business';
import {useAuth} from '../../context/AuthContext';
import {AppStackParamList} from '../../navigation/types';
import {colors} from '../../theme/colors';
import {AttachedFile, Organization, Project, User} from '../../types/models';
import {fromUnixSeconds, toApiDateTime} from '../../utils/date';
import {parseAttachments, splitAttachments, validateAttachment} from '../../utils/files';
import {validateTaskForm} from '../../validation/forms';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskForm'>;

export function TaskFormScreen({navigation, route}: Props) {
  const {session} = useAuth();
  const editingTask = route.params?.task;
  const editingId = route.params?.taskId || editingTask?.id;

  const [name, setName] = useState(editingTask?.name || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [status, setStatus] = useState(editingTask?.status || 1);
  const [startDate, setStartDate] = useState<Date | null>(fromUnixSeconds(editingTask?.start_date) || new Date());
  const [endDate, setEndDate] = useState<Date | null>(fromUnixSeconds(editingTask?.end_date) || new Date());
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [organizationId, setOrganizationId] = useState<number | undefined>(editingTask?.organization_id || undefined);
  const [projectId, setProjectId] = useState<number | undefined>(editingTask?.project_id || undefined);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [files, setFiles] = useState<AttachedFile[]>([
    ...parseAttachments(editingTask?.link_file),
    ...parseAttachments(editingTask?.image),
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    workApi.getOrganizations('').then(setOrganizations).catch(() => undefined);
    workApi.getProjects({}).then(setProjects).catch(() => undefined);
  }, []);

  useEffect(() => {
    const loadMembers = async () => {
      if (projectId) {
        setMembers(await workApi.getProjectMembers(projectId));
      } else if (organizationId) {
        setMembers(await workApi.getOrganizationMembers(organizationId));
      } else if (session) {
        const userId = session.id || session.user_id;
        if (userId) {
          setMembers([{id: userId, fullname: session.fullname || session.name || 'Toi', phone: session.phone}]);
          if (!editingId) setSelectedMemberIds([userId]);
        }
      }
    };
    loadMembers().catch(() => setMembers([]));
  }, [editingId, organizationId, projectId, session]);

  useEffect(() => {
    if (editingTask?.Users || editingTask?.text) {
      const users = editingTask.Users || editingTask.text;
      const list = (Array.isArray(users) ? users : [users]).filter(
        (user): user is User => Boolean(user),
      );
      setSelectedMemberIds(list.map(user => user.id));
    }
  }, [editingTask]);

  const filteredProjects = useMemo(() => {
    if (!organizationId) return projects;
    return projects.filter(project => !project.organization_id || project.organization_id === organizationId);
  }, [organizationId, projects]);

  const toggleMember = (id: number) => {
    setSelectedMemberIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const addDocuments = async () => {
    try {
      const picked = await DocumentPicker.pick({allowMultiSelection: true});
      const next: AttachedFile[] = [];
      for (const doc of picked) {
        const validation = validateAttachment({name: doc.name || undefined, size: doc.size || undefined}, files.length + next.length);
        if (validation) return Alert.alert('File khong hop le', validation);
        next.push({
          file_url: doc.uri,
          file_name: doc.name || 'document',
          file_size: doc.size || undefined,
          file_type: doc.type || 'document',
          rawFile: {uri: doc.uri, name: doc.name || 'document', type: doc.type || 'application/octet-stream'},
        });
      }
      setFiles(prev => [...prev, ...next]);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) Alert.alert('Khong the chon file', (err as Error).message);
    }
  };

  const addImages = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', selectionLimit: 5});
    if (result.didCancel) return;
    const next: AttachedFile[] = [];
    for (const asset of result.assets || []) {
      if (!asset.uri) continue;
      const fileName = asset.fileName || 'image.jpg';
      const validation = validateAttachment({name: fileName, size: asset.fileSize}, files.length + next.length);
      if (validation) return Alert.alert('Anh khong hop le', validation);
      next.push({
        file_url: asset.uri,
        file_name: fileName,
        file_size: asset.fileSize,
        file_type: 'image',
        rawFile: {uri: asset.uri, name: fileName, type: asset.type || 'image/jpeg'},
      });
    }
    setFiles(prev => [...prev, ...next]);
  };

  const submit = async () => {
    const validationError = validateTaskForm(name, startDate, endDate);
    if (validationError) return Alert.alert('Thieu thong tin', validationError);

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    formData.append('status', String(status));
    if (organizationId) formData.append('organization_id', String(organizationId));
    if (projectId) formData.append('project_id', String(projectId));
    if (startDate) formData.append('start_date', toApiDateTime(startDate) || '');
    if (endDate) formData.append('end_date', toApiDateTime(endDate) || '');
    selectedMemberIds.forEach(id => formData.append('user_ids[]', String(id)));

    const existing = files.filter(file => !file.rawFile);
    const {images, docs} = splitAttachments(existing);
    formData.append('link_file', docs.length > 0 ? JSON.stringify(docs) : '');
    formData.append('image', images.length > 0 ? JSON.stringify(images) : '');
    files.filter(file => file.rawFile).forEach(file => {
      formData.append('files[]', file.rawFile as unknown as Blob);
    });

    setSaving(true);
    try {
      await workApi.saveTask(formData, editingId);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Khong the luu cong viec', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AppTextInput label="Tieu de" value={name} onChangeText={setName} placeholder="Nhap ten cong viec" />
      <AppTextInput
        label="Mo ta"
        value={description}
        onChangeText={setDescription}
        placeholder="Noi dung cong viec"
        multiline
        textAlignVertical="top"
        style={styles.textarea}
      />

      <Text style={styles.label}>Trang thai</Text>
      <View style={styles.wrap}>
        {TASK_STATUSES.map(item => (
          <AppButton key={item.value} title={item.label} variant={status === item.value ? 'primary' : 'secondary'} onPress={() => setStatus(item.value)} style={styles.smallButton} />
        ))}
      </View>

      <Text style={styles.label}>Thoi gian bat dau</Text>
      <View style={styles.dateBox}>
        <DateTimePicker value={startDate || new Date()} mode="datetime" onChange={(_, date) => date && setStartDate(date)} />
      </View>
      <Text style={styles.label}>Han chot</Text>
      <View style={styles.dateBox}>
        <DateTimePicker value={endDate || new Date()} mode="datetime" onChange={(_, date) => date && setEndDate(date)} />
      </View>

      <Text style={styles.label}>To chuc</Text>
      <FlatList
        horizontal
        data={[{id: 0, name: 'Ca nhan'}, ...organizations]}
        keyExtractor={item => String(item.id)}
        showsHorizontalScrollIndicator={false}
        renderItem={({item}) => (
          <Chip
            label={item.name}
            active={(organizationId || 0) === item.id}
            onPress={() => {
              setOrganizationId(item.id || undefined);
              setProjectId(undefined);
            }}
          />
        )}
      />

      <Text style={styles.label}>Du an</Text>
      <FlatList
        horizontal
        data={filteredProjects}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={<Text style={styles.muted}>Khong co du an phu hop.</Text>}
        showsHorizontalScrollIndicator={false}
        renderItem={({item}) => <Chip label={item.name} active={projectId === item.id} onPress={() => setProjectId(item.id)} />}
      />

      <Text style={styles.label}>Nguoi phu trach</Text>
      <View style={styles.wrap}>
        {members.map(member => (
          <Chip key={member.id} label={member.fullname} active={selectedMemberIds.includes(member.id)} onPress={() => toggleMember(member.id)} />
        ))}
      </View>

      <Text style={styles.label}>File dinh kem</Text>
      <View style={styles.wrap}>
        <AppButton title="Tai lieu" variant="secondary" onPress={addDocuments} style={styles.smallButton} />
        <AppButton title="Anh" variant="secondary" onPress={addImages} style={styles.smallButton} />
      </View>
      {files.map((file, index) => (
        <View key={`${file.file_url}-${index}`} style={styles.fileRow}>
          <Text numberOfLines={1} style={styles.fileText}>{file.file_name || file.file_url}</Text>
          <Pressable onPress={() => setFiles(prev => prev.filter((_, idx) => idx !== index))}>
            <X color={colors.danger} size={18} />
          </Pressable>
        </View>
      ))}

      <AppButton title={editingId ? 'Cap nhat cong viec' : 'Tao cong viec'} onPress={submit} loading={saving} />
    </ScrollView>
  );
}

function Chip({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {padding: 16, gap: 14, backgroundColor: colors.background, flexGrow: 1},
  textarea: {height: 130, paddingTop: 12},
  label: {fontSize: 13, fontWeight: '900', color: colors.text},
  wrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  smallButton: {minHeight: 42},
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  chipText: {fontWeight: '800', color: colors.muted},
  chipTextActive: {color: '#fff'},
  muted: {color: colors.muted, paddingVertical: 10},
  dateBox: {backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 8},
  fileRow: {backgroundColor: colors.surface, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10},
  fileText: {flex: 1, color: colors.text, fontWeight: '700'},
});
