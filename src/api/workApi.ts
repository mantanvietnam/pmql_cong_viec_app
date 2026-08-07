import {apiRequest, expectSuccess} from './client';
import {PaginatedData} from '../types/api';
import {
  Department,
  Organization,
  PersonalDashboard,
  Project,
  Task,
  TaskLog,
  User,
} from '../types/models';

const listFromResponse = <T>(value: unknown): T[] => {
  const data = value as {listData?: T[]} | T[] | undefined;
  if (Array.isArray(data)) return data;
  return data?.listData || [];
};

export const workApi = {
  async getOrganizations(name = '') {
    const res = await apiRequest<Organization[]>('/apis/get_organizations', {
      body: {name},
    });
    return expectSuccess(res) || [];
  },

  async saveOrganization(payload: {organization_id?: number; name: string; description?: string}) {
    const path = payload.organization_id ? '/apis/edit_organization' : '/apis/add_organization';
    return expectSuccess(await apiRequest(path, {body: payload}));
  },

  async deleteOrganization(organization_id: number) {
    return expectSuccess(await apiRequest('/apis/delete_organization', {body: {organization_id}}));
  },

  async getDepartments(payload: {organization_id: number; limit?: number; page?: number}) {
    const res = await apiRequest<PaginatedData<Department> | Department[]>('/apis/get_departments', {
      body: {limit: 2000, page: 1, ...payload},
    });
    return listFromResponse<Department>(expectSuccess(res));
  },

  async getProjects(payload: Partial<Project> & {limit?: number; page?: number} = {}) {
    const res = await apiRequest<Project[]>('/apis/get_projects', {body: payload});
    return expectSuccess(res) || [];
  },

  async saveProject(payload: {
    project_id?: number;
    name: string;
    description?: string;
    start_date?: string | null;
    end_date?: string | null;
    organization_id?: number | null;
    department_id?: number | null;
    status?: number;
  }) {
    const path = payload.project_id ? '/apis/edit_project' : '/apis/add_project';
    return expectSuccess(await apiRequest(path, {body: payload}));
  },

  async deleteProject(project_id: number) {
    return expectSuccess(await apiRequest('/apis/delete_project', {body: {project_id}}));
  },

  async getTasks(payload: {
    limit?: number;
    page?: number;
    name?: string;
    status?: number;
    project_id?: number;
    department_id?: number;
    organization_id?: number;
    task_type?: string;
  }) {
    const res = await apiRequest<PaginatedData<Task>>('/apis/get_tasks', {body: payload});
    return listFromResponse<Task>(expectSuccess(res));
  },

  async getTask(id: number) {
    const res = await apiRequest<Task>('/apis/get_task', {body: {id}});
    return expectSuccess(res);
  },

  async saveTask(formData: FormData, editingId?: number) {
    if (editingId) formData.append('id', String(editingId));
    const path = editingId ? '/apis/edit_task' : '/apis/add_task';
    return expectSuccess(await apiRequest(path, {formData}));
  },

  async deleteTask(id: number) {
    return expectSuccess(await apiRequest('/apis/delete_task', {body: {id}}));
  },

  async getTaskLogs(task_id: number) {
    const res = await apiRequest<PaginatedData<TaskLog>>('/apis/get_task_logs', {body: {task_id}});
    return listFromResponse<TaskLog>(expectSuccess(res));
  },

  async saveTaskLog(formData: FormData, editingId?: number) {
    if (editingId) formData.append('id', String(editingId));
    const path = editingId ? '/apis/edit_task_log' : '/apis/add_task_log';
    return expectSuccess(await apiRequest(path, {formData}));
  },

  async deleteTaskLog(id: number) {
    return expectSuccess(await apiRequest('/apis/delete_task_log', {body: {id}}));
  },

  async getOrganizationMembers(organization_id: number) {
    const res = await apiRequest<PaginatedData<{Users?: User}>>('/apis/get_organization_members', {
      body: {organization_id},
    });
    return listFromResponse<{Users?: User}>(expectSuccess(res)).map(item => item.Users).filter(Boolean) as User[];
  },

  async getDepartmentMembers(department_id: number) {
    const res = await apiRequest<PaginatedData<{Users?: User}>>('/apis/get_department_members', {
      body: {department_id},
    });
    return listFromResponse<{Users?: User}>(expectSuccess(res)).map(item => item.Users).filter(Boolean) as User[];
  },

  async getProjectMembers(project_id: number) {
    const res = await apiRequest<PaginatedData<{Users?: User}>>('/apis/get_project_members', {
      body: {project_id},
    });
    return listFromResponse<{Users?: User}>(expectSuccess(res)).map(item => item.Users).filter(Boolean) as User[];
  },

  async getPersonalDashboard(payload: {
    user_id: number;
    organization_id?: number;
    start_date?: string;
    end_date?: string;
  }) {
    const res = await apiRequest<PersonalDashboard>('/apis/personalDashboardAPI', {body: payload});
    return expectSuccess(res);
  },

  async updateUser(formData: FormData) {
    return expectSuccess(await apiRequest('/apis/update_info_user', {formData}));
  },

  async getTelegramLink() {
    const res = await apiRequest<{link?: string; telegram_chat_id?: string}>('/apis/getTelegramLink');
    return expectSuccess(res);
  },
};
