export interface UserSession {
  id?: number;
  user_id?: number;
  token: string;
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
  start_date?: number | null;
  end_date?: number | null;
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
