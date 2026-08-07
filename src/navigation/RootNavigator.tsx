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
import {useAuth} from '../context/AuthContext';
import {LoginScreen} from '../screens/auth/LoginScreen';
import {ForgotPasswordScreen} from '../screens/auth/ForgotPasswordScreen';
import {TasksScreen} from '../screens/tasks/TasksScreen';
import {TaskDetailScreen} from '../screens/tasks/TaskDetailScreen';
import {TaskFormScreen} from '../screens/tasks/TaskFormScreen';
import {TaskReportScreen} from '../screens/tasks/TaskReportScreen';
import {OrganizationsScreen} from '../screens/organizations/OrganizationsScreen';
import {ProjectsScreen} from '../screens/projects/ProjectsScreen';
import {ReportsScreen} from '../screens/reports/ReportsScreen';
import {ProfileScreen} from '../screens/profile/ProfileScreen';
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
      <Tabs.Screen name="TasksTab" component={TasksScreen} options={{title: 'Cong viec', tabBarIcon: TasksIcon}} />
      <Tabs.Screen name="OrganizationsTab" component={OrganizationsScreen} options={{title: 'To chuc', tabBarIcon: OrganizationsIcon}} />
      <Tabs.Screen name="ProjectsTab" component={ProjectsScreen} options={{title: 'Du an', tabBarIcon: ProjectsIcon}} />
      <Tabs.Screen name="ReportsTab" component={ReportsScreen} options={{title: 'Bao cao', tabBarIcon: ReportsIcon}} />
      <Tabs.Screen name="ProfileTab" component={ProfileScreen} options={{title: 'Ho so', tabBarIcon: ProfileIcon}} />
    </Tabs.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen name="MainTabs" component={MainTabs} options={{headerShown: false}} />
      <AppStack.Screen name="TaskDetail" component={TaskDetailScreen} options={{title: 'Chi tiet cong viec'}} />
      <AppStack.Screen name="TaskForm" component={TaskFormScreen} options={{title: 'Cong viec'}} />
      <AppStack.Screen name="TaskReport" component={TaskReportScreen} options={{title: 'Bao cao tien do'}} />
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
    <NavigationContainer>
      {session?.token ? <AppNavigator /> : <AuthNavigator />}
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
