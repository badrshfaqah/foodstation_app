import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { registerDeviceToken, resolveNotificationRoute, unregisterDeviceToken } from '@/api/push';
import { useAuth } from '@/context/auth-context';
import { useNotificationsBadge } from '@/context/notifications-context';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const { refreshUnreadCount } = useNotificationsBadge();
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;

    (async () => {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      try {
        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
        tokenRef.current = expoPushToken;
        await registerDeviceToken(expoPushToken, Platform.OS === 'ios' ? 'ios' : 'android');
      } catch {
        // نتجاهل فشل الحصول على التوكن أو تسجيله، سيُعاد المحاولة عند فتح التطبيق التالي.
      }
    })();

    return () => {
      if (tokenRef.current) {
        unregisterDeviceToken(tokenRef.current).catch(() => {});
      }
    };
  }, [user]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const navigateFromNotification = (data: Record<string, unknown> | undefined) => {
      const route = resolveNotificationRoute(data?.url as string | undefined);
      if (route) {
        router.push(route as never);
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        navigateFromNotification(response.notification.request.content.data);
      }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateFromNotification(response.notification.request.content.data);
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      refreshUnreadCount();
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, [router, refreshUnreadCount]);
}
