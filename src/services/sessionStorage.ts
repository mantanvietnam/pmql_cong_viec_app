import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {UserSession} from '../types/models';

const SESSION_KEY = 'fodo_user_session';
const SERVICE = 'fodo.mobile.session';

export const sessionStorage = {
  async get(): Promise<UserSession | null> {
    try {
      const credentials = await Keychain.getGenericPassword({service: SERVICE});
      if (credentials) {
        return JSON.parse(credentials.password) as UserSession;
      }
      const fallback = await AsyncStorage.getItem(SESSION_KEY);
      return fallback ? (JSON.parse(fallback) as UserSession) : null;
    } catch {
      return null;
    }
  },

  async set(session: UserSession) {
    const serialized = JSON.stringify(session);
    await Keychain.setGenericPassword('session', serialized, {service: SERVICE});
    await AsyncStorage.setItem(SESSION_KEY, serialized);
  },

  async clear() {
    await Keychain.resetGenericPassword({service: SERVICE});
    await AsyncStorage.removeItem(SESSION_KEY);
  },
};
