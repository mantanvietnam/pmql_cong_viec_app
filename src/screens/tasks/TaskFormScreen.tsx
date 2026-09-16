import React, {useEffect, useMemo, useState} from 'react';
import {Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {errorCodes, isErrorWithCode, pick} from '@react-native-documents/picker';
import {launchImageLibrary} from 'react-native-image-picker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {X} from 'lucide-react-native';
import {workApi} from '../../api/workApi';
import {AppButton} from '../../components/AppButton';
import {AppTextInput} from '../../components/AppTextInput';
import {DateField} from '../../components/DateField';
import {confirm} from '../../components/Confirm';
import {TASK_STATUSES} from '../../constants/business';
import {useAuth} from '../../context/AuthContext';
import {AppStackParamList} from '../../navigation/types';
import {colors} from '../../theme/colors';
import {AttachedFile, Department, Organization, Project, User} from '../../types/models';
import {fromUnixSeconds, toApiDateTime} from '../../utils/date';
import {parseAttachments, splitAttachments, validateAttachment} from '../../utils/files';
import {validateTaskForm} from '../../validation/forms';
import {useOrganizationPermissions} from '../../hooks/useOrganizationPermissions';

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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [organizationId, setOrganizationId] = useState<number | undefined>(editingTask?.organization_id || route.params?.defaultOrganizationId);
  const [departmentId, setDepartmentId] = useState<number | undefined>(editingTask?.department_id || route.params?.defaultDepartmentId);
  const [projectId, setProjectId] = useState<number | undefined>(editingTask?.project_id || route.params?.defaultProjectId);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [files, setFiles] = useState<AttachedFile[]>([
    ...parseAttachments(editingTask?.link_file),
    ...parseAttachments(editingTask?.image),
  ]);
  const [saving, setSaving] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const {permissions} = useOrganizationPermissions(organizationId);

  useEffect(() => {
    workApi.getOrganizations('').then(setOrganizations).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!organizationId) { setDepartments([]); return; }
    workApi.getDepartments({organization_id: organizationId}).then(setDepartments).catch(() => setDepartments([]));
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId) {
      if (route.params?.defaultProjectId || editingTask?.project_id) {
        workApi.getProjects({}).then(list => setProjects(list.filter(project => !project.organization_id))).catch(() => setProjects([]));
      } else {
        setProjects([]);
      }
      return;
    }
    workApi.getProjects({organization_id: organizationId, department_id: departmentId || null}).then(setProjects).catch(() => setProjects([]));
  }, [departmentId, editingTask?.project_id, organizationId, route.params?.defaultProjectId]);

  useEffect(() => {
    const loadMembers = async () => {
      if (projectId) {
        setMembers(await workApi.getProjectMembers(projectId));
      } else if (departmentId) {
        setMembers(await workApi.getDepartmentMembers(departmentId));
      } else if (organizationId) {
        setMembers(await workApi.getOrganizationMembers(organizationId));
      } else if (session) {
        const userId = session.id || session.user_id;
        if (userId) {
          setMembers([{id: userId, fullname: session.fullname || session.name || 'Tôi', phone: session.phone}]);
          if (!editingId) setSelectedMemberIds([userId]);
        }
      }
    };
    loadMembers().catch(() => setMembers([]));
  }, [departmentId, editingId, organizationId, projectId, session]);

  useEffect(() => {
    if (editingTask?.Users || editingTask?.text) {
      const users = editingTask.Users || editingTask.text;
      const list = (Array.isArray(users) ? users : [users]).filter(
        (user): user is User => Boolean(user),
      );
      setSelectedMemberIds(list.map(user => user.id));
    }
  }, [editingTask]);

  const filteredMembers = useMemo(() => {
    const keyword = memberSearch.trim().toLocaleLowerCase('vi');
    if (!keyword) return members;
    return members.filter(member => `${member.fullname} ${member.phone || ''} ${member.email || ''}`.toLocaleLowerCase('vi').includes(keyword));
  }, [memberSearch, members]);

  const toggleMember = (id: number) => {
    setSelectedMemberIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const removeFile = (index: number) => {
    const file = files[index];
    const remove = () => setFiles(previous => previous.filter((_, position) => position !== index));
    if (file.rawFile) return remove();
    confirm('Gỡ file đã lưu', 'File này sẽ bị xóa khỏi công việc sau khi bạn cập nhật. Tiếp tục?', remove);
  };

  const addDocuments = async () => {
    try {
      const picked = await pick({allowMultiSelection: true});
      const next: AttachedFile[] = [];
      for (const doc of picked) {
        const validation = validateAttachment({name: doc.name || undefined, size: doc.size || undefined}, files.length + next.length);
        if (validation) return Alert.alert('File không hợp lệ', validation);
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
      if (!isErrorWithCode(err) || err.code !== errorCodes.OPERATION_CANCELED) {
        Alert.alert('Không thể chọn file', (err as Error).message);
      }
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
      if (validation) return Alert.alert('Ảnh không hợp lệ', validation);
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
    if (validationError) return Alert.alert('Thiếu thông tin', validationError);
    if (organizationId) {
      const requiredPermission = editingId ? 'task_edit' : 'task_add';
      if (!permissions.includes(requiredPermission)) return Alert.alert('Không có quyền', 'Bạn không có quyền thực hiện thao tác này trong tổ chức.');
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    formData.append('status', String(status));
    if (organizationId) formData.append('organization_id', String(organizationId));
    if (departmentId) formData.append('department_id', String(departmentId));
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
      Alert.alert('Không thể lưu công việc', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AppTextInput label="Tiêu đề" value={name} onChangeText={setName} placeholder="Nhập tên công việc" />
      <AppTextInput
        label="Mô tả"
        value={description}
        onChangeText={setDescription}
        placeholder="Nội dung công việc"
        multiline
        textAlignVertical="top"
        style={styles.textarea}
      />

      <Text style={styles.label}>Trạng thái</Text>
      <View style={styles.wrap}>
        {TASK_STATUSES.map(item => (
          <AppButton key={item.value} title={item.label} variant={status === item.value ? 'primary' : 'secondary'} onPress={() => setStatus(item.value)} style={styles.smallButton} />
        ))}
      </View>

      <DateField label="Thời gian bắt đầu" value={startDate} onChange={setStartDate} includeTime />
      <DateField label="Hạn chót" value={endDate} onChange={setEndDate} includeTime disabled={Boolean(editingId && organizationId && !permissions.includes('task_edit_end_date'))} />

      <Text style={styles.label}>Tổ chức</Text>
      <FlatList
        horizontal
        data={[{id: 0, name: 'Cá nhân'}, ...organizations]}
        keyExtractor={item => String(item.id)}
        showsHorizontalScrollIndicator={false}
        renderItem={({item}) => (
          <Chip
            label={item.name}
            active={(organizationId || 0) === item.id}
            onPress={() => {
              setOrganizationId(item.id || undefined);
              setDepartmentId(undefined);
              setProjectId(undefined);
            }}
          />
        )}
      />

      {organizationId ? <><Text style={styles.label}>Phòng ban</Text><FlatList horizontal data={departments} keyExtractor={item => String(item.id)} ListEmptyComponent={<Text style={styles.muted}>Chưa có phòng ban.</Text>} showsHorizontalScrollIndicator={false} renderItem={({item}) => <Chip label={item.name} active={departmentId === item.id} onPress={() => {setDepartmentId(departmentId === item.id ? undefined : item.id); setProjectId(undefined);}} />} /></> : null}

      <Text style={styles.label}>Dự án</Text>
      <FlatList
        horizontal
        data={projects}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={<Text style={styles.muted}>Không có dự án phù hợp.</Text>}
        showsHorizontalScrollIndicator={false}
        renderItem={({item}) => <Chip label={item.name} active={projectId === item.id} onPress={() => setProjectId(item.id)} />}
      />

      <Text style={styles.label}>Người phụ trách</Text>
      <AppTextInput value={memberSearch} onChangeText={setMemberSearch} placeholder="Tìm tên, email, số điện thoại" />
      <FlatList horizontal data={filteredMembers} keyExtractor={member => String(member.id)} ListEmptyComponent={<Text style={styles.muted}>Không có nhân sự phù hợp.</Text>} showsHorizontalScrollIndicator={false} renderItem={({item}) => <Chip label={item.fullname} active={selectedMemberIds.includes(item.id)} onPress={() => toggleMember(item.id)} />} />

      <Text style={styles.label}>File đính kèm</Text>
      <View style={styles.wrap}>
        <AppButton title="Tài liệu" variant="secondary" onPress={addDocuments} style={styles.smallButton} />
        <AppButton title="Ảnh" variant="secondary" onPress={addImages} style={styles.smallButton} />
      </View>
      {files.map((file, index) => (
        <View key={`${file.file_url}-${index}`} style={styles.fileRow}>
          <Text numberOfLines={1} style={styles.fileText}>{file.file_name || file.file_url}</Text>
          <Pressable onPress={() => removeFile(index)}>
            <X color={colors.danger} size={18} />
          </Pressable>
        </View>
      ))}

      <AppButton title={editingId ? 'Cập nhật công việc' : 'Tạo công việc'} onPress={submit} loading={saving} />
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
  fileRow: {backgroundColor: colors.surface, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10},
  fileText: {flex: 1, color: colors.text, fontWeight: '700'},
});
