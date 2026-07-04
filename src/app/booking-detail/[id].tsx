import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet } from 'react-native';

import { cancelBooking, getBooking } from '@/api/bookings';
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

const CANCELLABLE: BookingStatus[] = ['pending_payment', 'pending_brand'];

export default function BookingDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const load = () => {
    setIsLoading(true);
    getBooking(Number(id))
      .then(setBooking)
      .catch((err) => setError(apiErrorMessage(err, 'تعذر تحميل الحجز')))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [id]);

  const handleCancel = () => {
    Alert.alert('إلغاء الحجز', 'هل أنت متأكد من إلغاء هذا الحجز؟', [
      { text: 'تراجع', style: 'cancel' },
      {
        text: 'إلغاء الحجز',
        style: 'destructive',
        onPress: async () => {
          setIsCancelling(true);
          try {
            await cancelBooking(Number(id));
            load();
          } catch (err) {
            Alert.alert('خطأ', apiErrorMessage(err, 'تعذر إلغاء الحجز'));
          } finally {
            setIsCancelling(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color={theme.text} />
      </ThemedView>
    );
  }

  if (error || !booking) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={{ color: '#d32f2f' }}>{error ?? 'الحجز غير موجود'}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle" style={styles.row}>
          {booking.brand?.name}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.row}>
          رقم الحجز: {booking.booking_number}
        </ThemedText>
        <ThemedText style={styles.row}>{STATUS_LABELS[booking.status]}</ThemedText>
        <ThemedText style={styles.row}>الباقة: {booking.package?.name}</ThemedText>
        <ThemedText style={styles.row}>
          التاريخ: {booking.event_date} · {booking.event_time}
        </ThemedText>
        <ThemedText style={styles.row}>عدد الأشخاص: {booking.persons_count}</ThemedText>
        <ThemedText style={styles.row}>العنوان: {booking.location_address}</ThemedText>
        <ThemedText type="smallBold" style={styles.row}>
          الإجمالي: {booking.total_amount} ر.س
        </ThemedText>

        {CANCELLABLE.includes(booking.status) ? (
          <Pressable
            style={[styles.cancelButton, { borderColor: '#d32f2f', opacity: isCancelling ? 0.6 : 1 }]}
            disabled={isCancelling}
            onPress={handleCancel}>
            {isCancelling ? (
              <ActivityIndicator color="#d32f2f" />
            ) : (
              <ThemedText style={{ color: '#d32f2f' }}>إلغاء الحجز</ThemedText>
            )}
          </Pressable>
        ) : null}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { gap: 10 },
  row: { textAlign: 'right' },
  cancelButton: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
});
