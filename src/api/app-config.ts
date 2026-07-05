import { apiClient } from './client';

export type AppConfig = {
  min_ios_version: string;
  min_android_version: string;
  ios_store_url: string;
  android_store_url: string;
};

export async function getAppConfig() {
  const { data } = await apiClient.get<AppConfig>('/app-config', { timeout: 2500 });
  return data;
}

/** يقارن رقمي إصدار semver، يرجع true إذا كان current أقل من minimum. */
export function isVersionBelowMinimum(current: string, minimum: string): boolean {
  const currentParts = current.split('.').map((n) => parseInt(n, 10) || 0);
  const minimumParts = minimum.split('.').map((n) => parseInt(n, 10) || 0);
  const length = Math.max(currentParts.length, minimumParts.length);

  for (let i = 0; i < length; i++) {
    const currentPart = currentParts[i] ?? 0;
    const minimumPart = minimumParts[i] ?? 0;
    if (currentPart < minimumPart) return true;
    if (currentPart > minimumPart) return false;
  }
  return false;
}
