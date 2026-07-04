import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { getBookings } from '@/api/bookings';
import { apiErrorMessage } from '@/api/client';
import type { Booking, BookingStatus } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending_payment: 'بانتظار الدفع',
  pending_brand: 'بانتظار موافقة العلامة',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  cancelled: 'ملغي',
  completed: 'مكتمل',
};

export default function BookingsScreen() {
  const theme = useTheme();
  const router = useRouter();

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
      setIsLoading(true);
      load().finally(() => setIsLoading(false));
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }, [load]);

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color={theme.text} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
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
            {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
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
            style={[styles.card, { backgroundColor: theme.backgroundElement }]}
            onPress={() => router.push({ pathname: '/booking-detail/[id]', params: { id: String(item.id) } })}>
            <View style={styles.cardHeader}>
              <ThemedText type="smallBold">{item.brand?.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {STATUS_LABELS[item.status]}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {item.package?.name} · {item.event_date}
            </ThemedText>
            <ThemedText type="smallBold">{item.total_amount} ر.س</ThemedText>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  title: { fontSize: 28, textAlign: 'right', marginTop: 8, marginBottom: 16 },
  error: { color: '#d32f2f', textAlign: 'center', marginBottom: 8 },
  empty: { textAlign: 'center', marginTop: 48 },
  card: { borderRadius: 16, padding: 16, gap: 6, alignItems: 'flex-end' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%' },
});
