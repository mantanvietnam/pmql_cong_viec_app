import {PermissionsAndroid, Platform} from 'react-native';
import {
  getMessaging,
  getToken,
  registerDeviceForRemoteMessages,
  requestPermission,
} from '@react-native-firebase/messaging';

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

    return await getToken(messaging);
  } catch (error) {
    if (__DEV__) {
      console.warn('Khong lay duoc Firebase device token:', error);
    }
    return '';
  }
};
