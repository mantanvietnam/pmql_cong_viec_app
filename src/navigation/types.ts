import {Task, TaskLog} from '../types/models';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  TasksTab: undefined;
  OrganizationsTab: undefined;
  ProjectsTab: undefined;
  ReportsTab: undefined;
  ProfileTab: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  TaskDetail: {taskId: number};
  TaskForm: {task?: Task; taskId?: number; defaultOrganizationId?: number; defaultDepartmentId?: number; defaultProjectId?: number} | undefined;
  TaskReport: {taskId: number; currentStatus?: number; log?: TaskLog};
  OrganizationDetail: {organizationId: number};
  DepartmentDetail: {departmentId: number};
  ProjectDetail: {projectId: number};
  ManagementReport: {scope: 'organization' | 'department'; id: number};
  MemberReport: {userId: number; userName: string; organizationId?: number};
  ProjectForm: {projectId?: number} | undefined;
};
