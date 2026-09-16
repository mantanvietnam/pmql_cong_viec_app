import React, {useEffect, useState} from 'react';
import {Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {workApi} from '../api/workApi';
import {PROJECT_STATUSES} from '../constants/business';
import {colors} from '../theme/colors';
import {Department, Organization, Project} from '../types/models';
import {fromUnixSeconds, toApiDateTime} from '../utils/date';
import {AppButton} from './AppButton';
import {AppTextInput} from './AppTextInput';
import {DateField} from './DateField';

export function ProjectEditorModal({
  visible,
  project,
  organizationId,
  departmentId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  project?: Project;
  organizationId?: number;
  departmentId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [saving, setSaving] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number>();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>();
  const canChooseScope = organizationId === undefined;

  useEffect(() => {
    setName(project?.name || '');
    setDescription(project?.description || '');
    setStatus(project?.status || 0);
    setStartDate(fromUnixSeconds(project?.start_date) || new Date());
    setEndDate(fromUnixSeconds(project?.end_date) || new Date());
    setSelectedOrganizationId(organizationId ?? project?.organization_id ?? undefined);
    setSelectedDepartmentId(departmentId ?? project?.department_id ?? undefined);
  }, [departmentId, organizationId, project, visible]);

  useEffect(() => {
    if (!visible || !canChooseScope) return;
    workApi.getOrganizations('').then(setOrganizations).catch(error => {
      Alert.alert('Không thể tải tổ chức', (error as Error).message);
    });
  }, [canChooseScope, visible]);

  useEffect(() => {
    if (!visible || !selectedOrganizationId) {
      setDepartments([]);
      return;
    }
    workApi.getDepartments({organization_id: selectedOrganizationId}).then(setDepartments).catch(error => {
      Alert.alert('Không thể tải phòng ban', (error as Error).message);
    });
  }, [selectedOrganizationId, visible]);

  const save = async () => {
    if (!name.trim() || !startDate || !endDate) {
      return Alert.alert('Thiếu thông tin', 'Nhập tên, ngày bắt đầu và ngày kết thúc.');
    }
    if (startDate > endDate) return Alert.alert('Ngày không hợp lệ', 'Ngày bắt đầu không được sau ngày kết thúc.');
    setSaving(true);
    try {
      await workApi.saveProject({
        project_id: project?.id,
        name: name.trim(),
        description: description.trim(),
        status,
        start_date: toApiDateTime(startDate),
        end_date: toApiDateTime(endDate),
        organization_id: organizationId ?? selectedOrganizationId ?? null,
        department_id: departmentId ?? selectedDepartmentId ?? null,
      });
      onClose();
      onSaved();
    } catch (error) {
      Alert.alert('Không thể lưu dự án', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{project ? 'Sửa dự án' : 'Thêm dự án'}</Text>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <AppTextInput label="Tên dự án" value={name} onChangeText={setName} />
            <AppTextInput label="Mô tả" value={description} onChangeText={setDescription} multiline style={styles.textarea} />
            {canChooseScope ? <>
              <Text style={styles.label}>Tổ chức</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
                <ScopeChoice label="Cá nhân" selected={!selectedOrganizationId} onPress={() => {setSelectedOrganizationId(undefined); setSelectedDepartmentId(undefined);}} />
                {organizations.map(item => <ScopeChoice key={item.id} label={item.name} selected={selectedOrganizationId === item.id} onPress={() => {setSelectedOrganizationId(item.id); setSelectedDepartmentId(undefined);}} />)}
              </ScrollView>
              {selectedOrganizationId ? <><Text style={styles.label}>Phòng ban</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
                <ScopeChoice label="Không thuộc phòng ban" selected={!selectedDepartmentId} onPress={() => setSelectedDepartmentId(undefined)} />
                {departments.map(item => <ScopeChoice key={item.id} label={item.name} selected={selectedDepartmentId === item.id} onPress={() => setSelectedDepartmentId(item.id)} />)}
              </ScrollView></> : null}
            </> : null}
            <Text style={styles.label}>Trạng thái</Text>
            <View style={styles.wrap}>
              {PROJECT_STATUSES.map(item => (
                <AppButton key={item.value} title={item.label} variant={status === item.value ? 'primary' : 'secondary'} onPress={() => setStatus(item.value)} style={styles.smallButton} />
              ))}
            </View>
            <DateField label="Ngày bắt đầu" value={startDate} onChange={setStartDate} />
            <DateField label="Ngày kết thúc" value={endDate} onChange={setEndDate} />
            <AppButton title="Lưu dự án" onPress={save} loading={saving} />
            <AppButton title="Hủy" variant="ghost" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ScopeChoice({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) {
  return <Pressable style={[styles.choice, selected && styles.choiceActive]} onPress={onPress}><Text style={[styles.choiceText, selected && styles.choiceTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet: {maxHeight: '92%', backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16},
  title: {fontSize: 20, fontWeight: '900', color: colors.text, padding: 18, backgroundColor: colors.surface},
  content: {padding: 16, gap: 14},
  textarea: {height: 92, paddingTop: 12},
  label: {fontSize: 13, fontWeight: '800', color: colors.text},
  wrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  choices: {gap: 8},
  choice: {minHeight: 42, maxWidth: 220, paddingHorizontal: 13, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface},
  choiceActive: {borderColor: colors.primary, backgroundColor: colors.primary},
  choiceText: {fontSize: 13, fontWeight: '800', color: colors.text},
  choiceTextActive: {color: '#fff'},
  smallButton: {minHeight: 40, paddingHorizontal: 12},
});
