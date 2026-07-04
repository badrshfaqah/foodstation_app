import { apiClient } from './client';
import type { User } from './types';

export async function requestOtp(phone: string) {
  const { data } = await apiClient.post<{ exists: boolean }>('/auth/otp/request', { phone });
  return data;
}

export async function verifyOtp(phone: string, code: string, name?: string) {
  const { data } = await apiClient.post<{ token: string; user: User }>('/auth/otp/verify', {
    phone,
    code,
    name,
  });
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get<{ user: User }>('/auth/me');
  return data.user;
}

export async function logoutRequest() {
  await apiClient.post('/auth/logout');
}
