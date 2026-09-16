/* eslint-env jest */

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
  isErrorWithCode: jest.fn(() => false),
  errorCodes: {OPERATION_CANCELED: 'OPERATION_CANCELED'},
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(() => Promise.resolve({assets: []})),
}));

jest.mock('@react-native-firebase/messaging', () => {
  const instance = {};
  return {
    getMessaging: jest.fn(() => instance),
    requestPermission: jest.fn(() => Promise.resolve(1)),
    registerDeviceForRemoteMessages: jest.fn(() => Promise.resolve()),
    getToken: jest.fn(() => Promise.resolve('test-fcm-token')),
  };
});

jest.mock('@react-native-firebase/app', () => ({}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const {View} = require('react-native');
  return props => React.createElement(View, props);
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const {Text} = require('react-native');
  const Icon = ({color}) => React.createElement(Text, {style: {color}}, 'icon');
  return new Proxy(
    {},
    {
      get: () => Icon,
    },
  );
});
