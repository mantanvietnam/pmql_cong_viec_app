import {Task} from '../types/models';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
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
  TaskForm: {task?: Task; taskId?: number} | undefined;
  TaskReport: {taskId: number; currentStatus: number};
  ProjectForm: {projectId?: number} | undefined;
};
