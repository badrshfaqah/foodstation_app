import { apiClient } from './client';

export async function registerDeviceToken(token: string, platform: 'ios' | 'android') {
  await apiClient.post('/device-tokens', { token, platform });
}

export async function unregisterDeviceToken(token: string) {
  await apiClient.delete('/device-tokens', { data: { token } });
}

const ROUTE_PATTERNS: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^\/my-bookings\/(\d+)$/, (m) => `/booking-detail/${m[1]}`],
  [/^\/brands\/([^/]+)$/, (m) => `/brand/${m[1]}`],
];

/** يحوّل رابط ويب من حمولة الإشعار (مسارات لارفل) إلى مسار داخل تطبيق الجوال. */
export function resolveNotificationRoute(url?: string | null): string | null {
  if (!url) return null;
  for (const [pattern, toRoute] of ROUTE_PATTERNS) {
    const match = url.match(pattern);
    if (match) return toRoute(match);
  }
  return null;
}
