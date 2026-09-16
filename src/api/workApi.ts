import {apiRequest, expectSuccess} from './client';
import {PaginatedData} from '../types/api';
import {
  Department,
  DepartmentDashboard,
  ManagerDashboard,
  MemberScope,
  Membership,
  Organization,
  PersonalDashboard,
  Permission,
  Project,
  Role,
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

  async getOrganization(organization_id: number) {
    const res = await apiRequest<Organization>('/apis/get_organization', {body: {organization_id}});
    return expectSuccess(res);
  },

  async getDepartments(payload: {organization_id: number; limit?: number; page?: number}) {
    const res = await apiRequest<PaginatedData<Department> | Department[]>('/apis/get_departments', {
      body: {limit: 2000, page: 1, ...payload},
    });
    return listFromResponse<Department>(expectSuccess(res));
  },

  async getDepartment(department_id: number) {
    const res = await apiRequest<Department>('/apis/get_department', {body: {department_id}});
    return expectSuccess(res);
  },

  async saveDepartment(payload: {
    department_id?: number;
    organization_id?: number;
    name: string;
    description?: string;
  }) {
    const path = payload.department_id ? '/apis/edit_department' : '/apis/add_department';
    return expectSuccess(await apiRequest(path, {body: payload}));
  },

  async deleteDepartment(department_id: number) {
    return expectSuccess(await apiRequest('/apis/delete_department', {body: {department_id}}));
  },

  async getProjects(payload: Partial<Project> & {limit?: number; page?: number} = {}) {
    const res = await apiRequest<PaginatedData<Project> | Project[]>('/apis/get_projects', {body: payload});
    return listFromResponse<Project>(expectSuccess(res));
  },

  async getProject(project_id: number) {
    const res = await apiRequest<Project>('/apis/get_project', {body: {project_id}});
    return expectSuccess(res);
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
    user_id?: number;
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

  async getMembers(scope: MemberScope) {
    const path = scope.type === 'organization'
      ? '/apis/get_organization_members'
      : scope.type === 'department'
        ? '/apis/get_department_members'
        : '/apis/get_project_members';
    const body = scope.type === 'organization'
      ? {organization_id: scope.organizationId}
      : scope.type === 'department'
        ? {department_id: scope.departmentId}
        : {project_id: scope.projectId};
    const res = await apiRequest<PaginatedData<Record<string, unknown>> | Record<string, unknown>[]>(path, {body});
    return listFromResponse<Record<string, unknown>>(expectSuccess(res)).map(item => {
      const user = (item.Users || item.user || item) as User;
      return {
        ...user,
        join_id: Number(item.id || item.departmentMember_id || item.organizationMember_id || item.projectMember_id),
        role_id: Number(item.role_id || user.role_id) || null,
        total_tasks: Number(item.total_tasks || user.total_tasks) || 0,
      } as Membership;
    });
  },

  async searchUsers(keyword: string, organization_id?: number) {
    const res = await apiRequest<PaginatedData<User> | User[]>('/apis/get_users', {
      body: {keyword, status: 1, ...(organization_id ? {organization_id} : {})},
    });
    return listFromResponse<User>(expectSuccess(res));
  },

  async addMembers(scope: MemberScope, userIds: number[], roleId?: number | null) {
    const path = scope.type === 'organization'
      ? '/apis/add_organization_member'
      : scope.type === 'department'
        ? '/apis/add_department_member'
        : '/apis/add_project_member';
    const body = scope.type === 'organization'
      ? {organization_id: scope.organizationId, user_id: userIds, role_id: roleId || null}
      : scope.type === 'department'
        ? {department_id: scope.departmentId, user_id: userIds}
        : {project_id: scope.projectId, user_id: userIds};
    return expectSuccess(await apiRequest(path, {body}));
  },

  async deleteMember(scope: MemberScope, id: number) {
    const path = scope.type === 'organization'
      ? '/apis/delete_organization_member'
      : scope.type === 'department'
        ? '/apis/delete_department_member'
        : '/apis/delete_project_member';
    return expectSuccess(await apiRequest(path, {body: {id}}));
  },

  async editOrganizationMember(payload: {user_id: number; organization_id: number; role_id: number | null}) {
    return expectSuccess(await apiRequest('/apis/edit_organization_member', {body: payload}));
  },

  async getRolePermissions(organization_id: number) {
    const res = await apiRequest<Permission[]>('/apis/get_role_permission', {body: {organization_id}});
    return (expectSuccess(res) || []).map(permission => permission.code);
  },

  async getRoles(organization_id: number) {
    const res = await apiRequest<PaginatedData<Role> | Role[]>('/apis/get_roles', {body: {organization_id}});
    return listFromResponse<Role>(expectSuccess(res));
  },

  async getPermissions() {
    const res = await apiRequest<PaginatedData<Permission> | Permission[]>('/apis/get_permissions');
    return listFromResponse<Permission>(expectSuccess(res));
  },

  async saveRole(payload: {
    id?: number;
    organization_id: number;
    name: string;
    description?: string;
    permissions: number[];
  }) {
    const path = payload.id ? '/apis/edit_role' : '/apis/add_role';
    return expectSuccess(await apiRequest(path, {body: payload}));
  },

  async deleteRole(id: number) {
    return expectSuccess(await apiRequest('/apis/delete_role', {body: {id}}));
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

  async getManagerDashboard(payload: {organization_id: number; start_date?: string | null; end_date?: string | null}) {
    const res = await apiRequest<ManagerDashboard>('/apis/managerDashboardAPI', {body: payload});
    return expectSuccess(res);
  },

  async getDepartmentDashboard(payload: {department_id: number; start_date?: string | null; end_date?: string | null}) {
    const res = await apiRequest<DepartmentDashboard>('/apis/DepartmentDashboardAPI', {body: payload});
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
