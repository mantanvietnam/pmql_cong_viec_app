import {API_BASE_URL, REQUEST_TIMEOUT_MS} from '../constants/config';
import {sessionStorage} from '../services/sessionStorage';
import {ApiError, ApiResponse} from '../types/api';
import {UserSession} from '../types/models';

let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  formData?: FormData;
  skipAuth?: boolean;
};

export const getSessionAccessToken = (session?: UserSession | null) =>
  session?.token_mobile || session?.token || '';

const timeoutSignal = () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return {controller, timeout};
};

const createApiError = (message: string, code?: number, status?: number): ApiError => {
  const error = new Error(message) as ApiError;
  error.code = code;
  error.status = status;
  return error;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  if (!API_BASE_URL || API_BASE_URL.includes('your-backend')) {
    throw createApiError('Chưa cấu hình API_BASE_URL cho backend.');
  }

  const session = options.skipAuth ? null : await sessionStorage.get();
  const {controller, timeout} = timeoutSignal();

  const headers: Record<string, string> = {
    ...(options.formData ? {} : {'Content-Type': 'application/json'}),
    ...options.headers,
  };

  const accessToken = options.skipAuth ? '' : getSessionAccessToken(session);

  if (!options.skipAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let requestBody: RequestInit['body'] | undefined;

  if (options.formData) {
    if (!options.skipAuth && accessToken) {
      options.formData.append('token', accessToken);
    }
    requestBody = options.formData;
  } else if (options.body) {
    const body =
      !options.skipAuth && accessToken && typeof options.body === 'object' && !Array.isArray(options.body)
        ? {...(options.body as Record<string, unknown>), token: accessToken}
        : options.body;
    requestBody = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || 'POST',
      headers,
      body: requestBody,
      signal: controller.signal,
    });

    const json = (await response.json()) as ApiResponse<T>;

    if (response.status === 401 || json.code === 203) {
      onUnauthorized?.();
      throw createApiError(
        json.message || 'Phiên đăng nhập hết hạn.',
        json.code,
        response.status,
      );
    }

    return json;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw createApiError('Kết nối quá thời gian chờ.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const expectSuccess = <T>(response: ApiResponse<T>, codes = [200, 201, 0]) => {
  if (!codes.includes(response.code)) {
    throw createApiError(response.message || 'Máy chủ trả về lỗi.', response.code);
  }
  return response.data as T;
};
