import {PermissionsAndroid, Platform} from 'react-native';
import {
  getInitialNotification,
  getMessaging,
  getToken,
  onNotificationOpenedApp,
  registerDeviceForRemoteMessages,
  requestPermission,
} from '@react-native-firebase/messaging';

export type OpenedNotification = {
  messageId?: string;
  sentTime?: number;
  data?: Record<string, unknown>;
};

const TASK_DETAIL_ACTIONS = new Set(['addTask', 'reportTask']);

export const getTaskDetailIdFromNotification = (notification?: OpenedNotification | null) => {
  const action = notification?.data?.action;
  const rawId = notification?.data?.id;

  if (typeof action !== 'string' || !TASK_DETAIL_ACTIONS.has(action)) return null;
  if (typeof rawId !== 'string' && typeof rawId !== 'number') return null;
  if (typeof rawId === 'string' && !rawId.trim()) return null;

  const taskId = Number(rawId);
  return Number.isSafeInteger(taskId) && taskId > 0 ? taskId : null;
};

export const subscribeToOpenedNotifications = (
  onOpen: (notification: OpenedNotification) => void,
) => {
  const messaging = getMessaging();
  let active = true;
  const unsubscribe = onNotificationOpenedApp(messaging, notification => {
    if (active) onOpen(notification);
  });

  getInitialNotification(messaging)
    .then(notification => {
      if (active && notification) onOpen(notification);
    })
    .catch(error => {
      if (__DEV__) console.warn('Không đọc được notification mở ứng dụng:', error);
    });

  return () => {
    active = false;
    unsubscribe();
  };
};

const requestAndroidNotificationPermission = async () => {
  if (Platform.OS !== 'android' || Platform.Version < 33) return;
  await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
};

export const getFirebaseDeviceToken = async () => {
  try {
    await requestAndroidNotificationPermission();
    const messaging = getMessaging();

    if (Platform.OS === 'ios') {
      await requestPermission(messaging);
      await registerDeviceForRemoteMessages(messaging);
    }

    const token = await getToken(messaging);

    if (__DEV__) {
      console.info('Trạng thái Firebase device token:', {
        platform: Platform.OS,
        available: token.length > 0,
      });
    }

    return token;
  } catch (error) {
    if (__DEV__) {
      console.warn('Không lấy được Firebase device token:', error);
    }
    return '';
  }
};
