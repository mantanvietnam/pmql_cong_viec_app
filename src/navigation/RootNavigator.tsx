import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  BarChart3,
  Building2,
  Folder,
  ListChecks,
  UserCircle,
} from 'lucide-react-native';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {getSessionAccessToken} from '../api/client';
import {useAuth} from '../context/AuthContext';
import {LoginScreen} from '../screens/auth/LoginScreen';
import {ForgotPasswordScreen} from '../screens/auth/ForgotPasswordScreen';
import {RegisterScreen} from '../screens/auth/RegisterScreen';
import {TasksScreen} from '../screens/tasks/TasksScreen';
import {TaskDetailScreen} from '../screens/tasks/TaskDetailScreen';
import {TaskFormScreen} from '../screens/tasks/TaskFormScreen';
import {TaskReportScreen} from '../screens/tasks/TaskReportScreen';
import {OrganizationsScreen} from '../screens/organizations/OrganizationsScreen';
import {ProjectsScreen} from '../screens/projects/ProjectsScreen';
import {ReportsScreen} from '../screens/reports/ReportsScreen';
import {ProfileScreen} from '../screens/profile/ProfileScreen';
import {OrganizationDetailScreen} from '../screens/organizations/OrganizationDetailScreen';
import {DepartmentDetailScreen} from '../screens/organizations/DepartmentDetailScreen';
import {ProjectDetailScreen} from '../screens/projects/ProjectDetailScreen';
import {ManagementReportScreen} from '../screens/reports/ManagementReportScreen';
import {MemberReportScreen} from '../screens/reports/MemberReportScreen';
import {colors} from '../theme/colors';
import {AppStackParamList, AppTabParamList, AuthStackParamList} from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tabs = createBottomTabNavigator<AppTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

const tabOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
  tabBarStyle: {height: 64, paddingBottom: 8, paddingTop: 8},
};

const TasksIcon = ({color, size}: {color: string; size: number}) => <ListChecks color={color} size={size} />;
const OrganizationsIcon = ({color, size}: {color: string; size: number}) => <Building2 color={color} size={size} />;
const ProjectsIcon = ({color, size}: {color: string; size: number}) => <Folder color={color} size={size} />;
const ReportsIcon = ({color, size}: {color: string; size: number}) => <BarChart3 color={color} size={size} />;
const ProfileIcon = ({color, size}: {color: string; size: number}) => <UserCircle color={color} size={size} />;

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={tabOptions}>
      <Tabs.Screen name="TasksTab" component={TasksScreen} options={{title: 'Công việc', tabBarIcon: TasksIcon}} />
      <Tabs.Screen name="OrganizationsTab" component={OrganizationsScreen} options={{title: 'Tổ chức', tabBarIcon: OrganizationsIcon}} />
      <Tabs.Screen name="ProjectsTab" component={ProjectsScreen} options={{title: 'Dự án', tabBarIcon: ProjectsIcon}} />
      <Tabs.Screen name="ReportsTab" component={ReportsScreen} options={{title: 'Báo cáo', tabBarIcon: ReportsIcon}} />
      <Tabs.Screen name="ProfileTab" component={ProfileScreen} options={{title: 'Hồ sơ', tabBarIcon: ProfileIcon}} />
    </Tabs.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen name="MainTabs" component={MainTabs} options={{headerShown: false}} />
      <AppStack.Screen name="TaskDetail" component={TaskDetailScreen} options={{title: 'Chi tiết công việc'}} />
      <AppStack.Screen name="TaskForm" component={TaskFormScreen} options={{title: 'Công việc'}} />
      <AppStack.Screen name="TaskReport" component={TaskReportScreen} options={{title: 'Báo cáo tiến độ'}} />
      <AppStack.Screen name="OrganizationDetail" component={OrganizationDetailScreen} options={{title: 'Chi tiết tổ chức'}} />
      <AppStack.Screen name="DepartmentDetail" component={DepartmentDetailScreen} options={{title: 'Chi tiết phòng ban'}} />
      <AppStack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{title: 'Chi tiết dự án'}} />
      <AppStack.Screen name="ManagementReport" component={ManagementReportScreen} options={{title: 'Báo cáo quản lý'}} />
      <AppStack.Screen name="MemberReport" component={MemberReportScreen} options={{title: 'Báo cáo nhân sự'}} />
    </AppStack.Navigator>
  );
}

function Splash() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function RootNavigator() {
  const {session, isBooting} = useAuth();

  if (isBooting) return <Splash />;

  return (
    <NavigationContainer linking={{prefixes: ['fodo://'], config: {screens: {TaskDetail: {path: 'tasks/:taskId', parse: {taskId: Number}}}}}}>
      {getSessionAccessToken(session) ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
