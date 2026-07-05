import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { getNotifications, markNotificationRead } from '@/api/notifications';
import { apiErrorMessage } from '@/api/client';
import { resolveNotificationRoute } from '@/api/push';
import type { AppNotification } from '@/api/types';
import { LoginPrompt } from '@/components/login-prompt';
import { NoConnectionView } from '@/components/no-connection-view';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useNotificationsBadge } from '@/context/notifications-context';
import { useTheme } from '@/hooks/use-theme';

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { setUnreadCount } = useNotificationsBadge();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'تعذر تحميل الإشعارات'));
    }
  }, [setUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setIsLoading(true);
      load().finally(() => setIsLoading(false));
    }, [load, user])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }, [load]);

  const onPressNotification = useCallback(
    async (item: AppNotification) => {
      if (!item.read_at) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        markNotificationRead(item.id).catch(() => {});
      }
      const route = resolveNotificationRoute(item.data.url);
      if (route) {
        router.push(route as never);
      }
    },
    [router, setUnreadCount]
  );

  if (!user) {
    return (
      <ThemedView type="backgroundElement" style={{ flex: 1 }}>
        <ScreenHeader title="الإشعارات" />
        <LoginPrompt message="سجّل دخولك لعرض إشعاراتك" />
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView type="backgroundElement" style={styles.container}>
        <ScreenHeader title="الإشعارات" />
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </ThemedView>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={styles.container}>
        <ScreenHeader title="الإشعارات" />
        <NoConnectionView isRetrying={isRefreshing} onRetry={onRefresh} />
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ScreenHeader title="الإشعارات" />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            لا توجد إشعارات بعد
          </ThemedText>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.card,
              CardShadow,
              { backgroundColor: item.read_at ? theme.background : theme.primaryTint },
            ]}
            onPress={() => onPressNotification(item)}>
            <View style={styles.cardHeader}>
              <ThemedText type="smallBold">
                {item.data.icon ? `${item.data.icon} ` : ''}
                {item.data.title ?? 'إشعار'}
              </ThemedText>
              {!item.read_at ? <View style={[styles.dot, { backgroundColor: theme.primary }]} /> : null}
            </View>
            {item.data.body ? (
              <ThemedText type="small" themeColor="textSecondary">
                {item.data.body}
              </ThemedText>
            ) : null}
            <ThemedText type="small" themeColor="textSecondary">
              {item.created_at}
            </ThemedText>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  empty: { textAlign: 'center', marginTop: 48 },
  card: { borderRadius: 16, padding: 16, gap: 4, alignItems: 'flex-end' },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
