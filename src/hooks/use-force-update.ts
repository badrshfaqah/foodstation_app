import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { getAppConfig, isVersionBelowMinimum } from '@/api/app-config';

export function useForceUpdate() {
  const [checked, setChecked] = useState(false);
  const [required, setRequired] = useState(false);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const config = await getAppConfig();
        const currentVersion = Constants.expoConfig?.version ?? '0.0.0';
        const minVersion = Platform.OS === 'ios' ? config.min_ios_version : config.min_android_version;

        if (isVersionBelowMinimum(currentVersion, minVersion)) {
          setRequired(true);
          setStoreUrl(Platform.OS === 'ios' ? config.ios_store_url : config.android_store_url);
        }
      } catch {
        // لا نمنع استخدام التطبيق إذا تعذر الوصول للسيرفر (مثلاً بدون اتصال).
      } finally {
        setChecked(true);
      }
    })();
  }, []);

  return { checked, required, storeUrl };
}
