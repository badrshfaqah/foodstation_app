import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { getBookings } from '@/api/bookings';
import { apiErrorMessage } from '@/api/client';
import type { Booking, BookingStatus } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LoginPrompt } from '@/components/login-prompt';
import { NoConnectionView } from '@/components/no-connection-view';
import { CardShadow } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending_payment: 'بانتظار الدفع',
  pending_brand: 'بانتظار موافقة العلامة',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  cancelled: 'ملغي',
  completed: 'مكتمل',
};

const STATUS_COLOR: Partial<Record<BookingStatus, 'success' | 'danger'>> = {
  accepted: 'success',
  completed: 'success',
  rejected: 'danger',
  cancelled: 'danger',
};

export default function BookingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const page = await getBookings();
      setBookings(page.data);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'تعذر تحميل الحجوزات'));
    }
  }, []);

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

  if (!user) {
    return (
      <ThemedView type="backgroundElement" style={{ flex: 1 }}>
        <LoginPrompt message="سجّل دخولك لعرض حجوزاتك" />
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView type="backgroundElement" style={styles.center}>
        <ActivityIndicator color={theme.primary} />
      </ThemedView>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={{ flex: 1 }}>
        <NoConnectionView
          isRetrying={isRefreshing}
          onRetry={async () => {
            setIsRefreshing(true);
            await load();
            setIsRefreshing(false);
          }}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <ThemedText type="title" style={styles.title}>
              حجوزاتي
            </ThemedText>
            <Pressable
              style={[styles.quotesButton, { borderColor: theme.primary }]}
              onPress={() => router.push('/custom-quotes' as Href)}>
              <ThemedText type="smallBold" themeColor="accent">
                طلبات عروض الولائم
              </ThemedText>
            </Pressable>
            {error ? (
              <ThemedText themeColor="danger" style={styles.error}>
                {error}
              </ThemedText>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            لا يوجد حجوزات بعد
          </ThemedText>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, CardShadow, { backgroundColor: theme.background }]}
            onPress={() => router.push({ pathname: '/booking-detail/[id]', params: { id: String(item.id) } })}>
            <View style={styles.cardHeader}>
              <ThemedText type="smallBold">{item.brand?.name}</ThemedText>
              <ThemedText type="small" themeColor={STATUS_COLOR[item.status] ?? 'textSecondary'}>
                {STATUS_LABELS[item.status]}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {item.package?.name} · {item.event_date.slice(0, 10)}
            </ThemedText>
            <ThemedText type="smallBold" themeColor="accent">
              {item.total_amount} ر.س
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
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  title: { fontSize: 28, textAlign: 'right', marginTop: 8, marginBottom: 16 },
  quotesButton: { alignSelf: 'flex-end', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, marginBottom: 14 },
  error: { textAlign: 'center', marginBottom: 8 },
  empty: { textAlign: 'center', marginTop: 48 },
  card: { borderRadius: 14, padding: 16, gap: 6, alignItems: 'flex-end' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%' },
});
