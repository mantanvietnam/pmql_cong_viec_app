import {apiRequest, expectSuccess} from './client';
import {UserSession} from '../types/models';

export const authApi = {
  async login(phone: string, password: string, tokenDevice: string) {
    const response = await apiRequest<UserSession>('/apis/login', {
      skipAuth: true,
      body: {
        phone,
        password,
        type_device: 'mobile',
        token_device: tokenDevice,
      },
    });
    return expectSuccess(response);
  },

  async register(payload: {
    fullname: string;
    phone: string;
    email?: string;
    password: string;
    password_confirmation: string;
  }) {
    const response = await apiRequest<UserSession>('/apis/register', {
      skipAuth: true,
      body: payload,
    });
    return expectSuccess(response, [201]);
  },

  async requestForgotPasswordOtp(phone: string) {
    const response = await apiRequest('/apis/request_forgot_password_otp', {
      skipAuth: true,
      body: {phone},
    });
    return expectSuccess(response);
  },

  async resetPassword(phone: string, otp: string, newPassword: string) {
    const response = await apiRequest('/apis/forgot_password', {
      skipAuth: true,
      body: {phone, otp, new_password: newPassword},
    });
    return expectSuccess(response);
  },

  async logout(token: string) {
    await apiRequest('/apis/logout', {
      body: {access_token: token},
      headers: {Authorization: `Bearer ${token}`},
    }).catch(() => undefined);
  },

  async lockUser(token: string) {
    return apiRequest('/apis/lockUser', {
      body: {access_token: token},
      headers: {Authorization: `Bearer ${token}`},
    });
  },

  async changePassword(payload: {
    access_token: string;
    old_password: string;
    new_password: string;
    new_password_again: string;
  }) {
    const response = await apiRequest('/apis/change_password', {body: payload});
    return expectSuccess(response);
  },
};
