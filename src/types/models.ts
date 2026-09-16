export interface UserSession {
  id?: number;
  user_id?: number;
  token?: string;
  token_mobile?: string;
  token_device?: string;
  type_device?: 'mobile' | string;
  fullname?: string;
  name?: string;
  phone?: string;
  email?: string;
  description?: string;
  avatar?: string;
  telegram_chat_id?: string | null;
  permissions?: string[];
}

export interface User {
  id: number;
  fullname: string;
  phone?: string;
  email?: string;
  avatar?: string;
  role_id?: number | null;
  total_tasks?: number;
}

export interface Membership extends User {
  join_id: number;
  role_name?: string;
}

export interface Permission {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  member_count?: number;
  permissions?: Permission[];
}

export interface Organization {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
  member_count?: number;
  department_count?: number;
  project_count?: number;
  task_count?: number;
  role_count?: number;
}

export interface Department {
  id: number;
  name: string;
  description?: string | null;
  organization_id?: number;
  organization_name?: string;
  member_count?: number;
  project_count?: number;
  task_count?: number;
}

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  organization_id?: number | null;
  department_id?: number | null;
  status?: number;
  start_date?: number | string | null;
  end_date?: number | string | null;
  member_count?: number;
  task_count?: number;
}

export interface AttachedFile {
  file_url: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  rawFile?: {
    uri: string;
    name: string;
    type: string;
  };
}

export interface Task {
  id: number;
  name: string;
  description?: string | null;
  project_id?: number | null;
  department_id?: number | null;
  organization_id?: number | null;
  status: number;
  start_date?: number | string | null;
  end_date?: number | string | null;
  link_file?: string | null;
  image?: string | null;
  Users?: User | User[];
  text?: User | User[];
}

export interface TaskLog {
  id: number;
  task_id: number;
  action?: string;
  status?: number;
  created_at?: string;
  user_id?: number;
  link_file?: string | null;
  image?: string | null;
  Users?: User;
}

export interface PersonalDashboard {
  user_id: number;
  total_assigned: number;
  total_completed: number;
  total_in_progress: number;
  total_not_started: number;
  total_overdue: number;
  total_upcoming: number;
  recent_tasks: Task[];
}

export interface ManagerDashboardSummary {
  total_departments: number;
  total_projects: number;
  total_tasks: number;
  total_members: number;
  total_completed_tasks: number;
  total_in_progress_tasks: number;
  total_overdue_tasks: number;
}

export interface DepartmentDashboardSummary {
  total: number;
  not_started: number;
  in_progress: number;
  completed: number;
  canceled?: number;
  overdue: number;
}

export interface DepartmentStat {
  id: number;
  name: string;
  total_projects: number;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  not_started_tasks: number;
  canceled_tasks: number;
  overdue_tasks: number;
}

export interface ProjectStat extends Project {
  not_started_tasks?: number;
  in_progress_tasks?: number;
  completed_tasks?: number;
  overdue_tasks?: number;
}

export interface ManagerDashboard {
  organization: Pick<Organization, 'id' | 'name' | 'description'>;
  summary: ManagerDashboardSummary;
  departments: DepartmentStat[];
  tasks?: Task[];
  task_assignees?: Record<number, User[]>;
}

export interface DepartmentDashboard {
  department: Department;
  summary: DepartmentDashboardSummary;
  projects?: ProjectStat[];
  tasks?: Task[];
  task_assignees?: Record<number, User[]>;
}

export type MemberScope =
  | {type: 'organization'; organizationId: number}
  | {type: 'department'; organizationId: number; departmentId: number}
  | {type: 'project'; organizationId?: number; projectId: number};
