import { apiClient } from './client';
import type { AppNotification } from './types';

export async function getNotifications() {
  const { data } = await apiClient.get<{ notifications: AppNotification[]; unread_count: number }>(
    '/notifications'
  );
  return data;
}

export async function markNotificationRead(id: string | 'all') {
  const { data } = await apiClient.post<{ unread_count: number }>('/notifications/mark-read', { id });
  return data;
}
