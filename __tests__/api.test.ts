import * as Keychain from 'react-native-keychain';
import {authApi} from '../src/api/authApi';
import {apiRequest} from '../src/api/client';

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});

test('login sends mobile device metadata', async () => {
  fetchMock.mockResolvedValue({
    status: 200,
    json: async () => ({code: 200, data: {id: 7, token_mobile: 'mobile-token'}}),
  });

  await authApi.login('0900000000', 'password', 'firebase-device-token');

  const [, options] = fetchMock.mock.calls[0];
  expect(JSON.parse(options.body)).toEqual({
    phone: '0900000000',
    password: 'password',
    type_device: 'mobile',
    token_device: 'firebase-device-token',
  });
});

test('authenticated requests use token_mobile as token', async () => {
  (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({
    username: 'session',
    password: JSON.stringify({token: 'web-token', token_mobile: 'mobile-token'}),
  });
  fetchMock.mockResolvedValue({
    status: 200,
    json: async () => ({code: 200, data: {}}),
  });

  await apiRequest('/apis/get_organizations', {body: {name: ''}});

  const [, options] = fetchMock.mock.calls[0];
  expect(options.headers.Authorization).toBe('Bearer mobile-token');
  expect(JSON.parse(options.body).token).toBe('mobile-token');
});
